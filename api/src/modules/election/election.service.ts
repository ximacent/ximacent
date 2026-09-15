import { validateCreateElection, validateStatusTransition, validateUpdateElection, validateRejectElection } from "@/modules/election/election.validator";
import { ElectionSanitizer } from "@/modules/election/election.sanitizer";
import { validate as isUUID } from "uuid";
import { FindOptionsWhere, ILike, In, Not } from "typeorm";
import { AppDataSource } from "@/database/data-source";
import { Election, ElectionStatus } from "@/database/entities/Election";
import { User, UserRole } from "@/database/entities/User";
import { CreateElectionDTO, ElectionActor, FilterElectionDTO, UpdateElectionDTO, UpdateElectionStatusDTO, } from "@/types/election.type";
import { CustomAppError } from "@/lib/errors/customAppError";
import { ErrorCodes } from "@/lib/errors/errorCodes";
import { generateUniqueAlias, generateUniqueSlug } from "@/utils/helpers/election.helper";
import { buildPaginationMeta, parsePagination } from "@/lib/http/pagination";
import { PaginationQuery } from "@/types/pagination.type";
import { createWithImages, ImageFileInput } from "@/lib/storage/createWithImages";
import { getStorageAdapter } from "@/lib/storage/getStorageAdapter";
import { OrganizerService } from "@/modules/organizer/organizer.service";
import { EmailService } from "@/lib/email/email.service";
import { writeAuditLog } from "@/lib/audit/writeAuditLog";
import { AuditAction, AuditEntityType } from "@/lib/audit/auditActions";

export class ElectionService {
  private static async repo() {
    const db = await AppDataSource();
    return db.getRepository(Election);
  }

  // Mirrors UserService.withoutPassword / OrganizerService.withoutPassword —
  // update()/updateStatus() below load the `createdBy` relation (needed
  // for ownership checks and the organizer notification email) and return
  // the saved election to the client; without this, passwordHash would
  // leak through election.createdBy in the JSON response.
  private static withoutPassword(user: User): Omit<User, "passwordHash"> {
    const safeUser: Partial<User> = { ...user };
    delete safeUser.passwordHash;
    return safeUser as Omit<User, "passwordHash">;
  }

  private static toSafeElection(election: Election): Election {
    if (!election.createdBy) return election;
    return { ...election, createdBy: this.withoutPassword(election.createdBy) as User };
  }

  // Ownership check used by every mutating method below. Admins retain
  // full access to every election (existing behavior). Organizers may only
  // ever act on elections where createdBy === actor.id — this is the IDOR
  // guard from section 15/17, and it is enforced here regardless of what
  // the client sends, since `existing.createdBy` comes from the DB record
  // fetched by `id`, never from the request body.
  private static assertOwnership(existing: Election, actor: ElectionActor) {
    if (actor.role === UserRole.ADMIN || actor.role === UserRole.SUPER_ADMIN) return;

    if (!existing.createdBy || existing.createdBy.id !== actor.id) {
      throw new CustomAppError(
        "You do not have permission to manage this election",
        403,
        ErrorCodes.PERMISSION_DENIED.code,
        ErrorCodes.PERMISSION_DENIED.label,
        "forbidden"
      );
    }
  }

  static async getElections(filters: FilterElectionDTO & PaginationQuery) {
      const repo = await this.repo();

      const where: FindOptionsWhere<Election> = {
        isDeleted: false,
      };

      if (filters.title) { where.title = ILike(`%${filters.title}%`); }
      if (filters.status) {
        if (!Object.values(ElectionStatus).includes(filters.status as ElectionStatus)) {
          throw new CustomAppError( "Invalid status filter", 400, ErrorCodes.VALIDATION_FAILED.code, ErrorCodes.VALIDATION_FAILED.label, "validation_failed" );
        }
        where.status = filters.status as ElectionStatus;
      }
      if (filters.createdById) {
        if (!isUUID(filters.createdById)) {
          throw new CustomAppError( "Valid createdById is required", 400, ErrorCodes.VALIDATION_FAILED.code, ErrorCodes.VALIDATION_FAILED.label, "validation_failed" );
        }
        where.createdBy = { id: filters.createdById };
      }

      const { page, limit, skip, take } = parsePagination({
        page: filters.page?.toString(),
        limit: filters.limit?.toString(),
      });

      const [elections, count] = await repo.findAndCount({
        where,
        order: { createdAt: "DESC" },
        skip,
        take,
      });

      return { elections, pagination: buildPaginationMeta(count, page, limit) };
  }

  static async getElection(id: string) {
    if (!id || !isUUID(id)) {
      throw new CustomAppError( "Valid Election ID is required", 400, ErrorCodes.ID_REQUIRED.code, ErrorCodes.ID_REQUIRED.label, "bad_request" );
    }

    const repo = await this.repo();

    const election = await repo.findOne({
      where: { id, isDeleted: false },
    });

    if (!election) {
      throw new CustomAppError( "No election found with the given ID", 404, ErrorCodes.RECORD_NOT_FOUND.code, ErrorCodes.RECORD_NOT_FOUND.label, "election_not_found" );
    }

    return election;
  }

  static async create(data: CreateElectionDTO, actor: ElectionActor) {
    validateCreateElection(data);

    // Section 14: creating an election requires role=ORGANIZER AND
    // verificationStatus=APPROVED, checked fresh against the DB (never
    // from the JWT, which only carries role). Admins retain the ability
    // to create elections directly, consistent with their existing
    // management privileges elsewhere in the app.
    if (actor.role === UserRole.ORGANIZER) {
      await OrganizerService.requireApprovedOrganizer(actor.id);
    }

    const repo = await this.repo();
    const db = await AppDataSource();
    const userRepo = db.getRepository(User);

    const createdBy = await userRepo.findOne({ where: { id: actor.id, isDeleted: false } });
    if (!createdBy) {
      throw new CustomAppError( "Authenticated user not found", 404, ErrorCodes.RECORD_NOT_FOUND.code, ErrorCodes.RECORD_NOT_FOUND.label, "user_not_found" );
    }

    const normalizedTitle = data.title.trim().toUpperCase();

    const existingElection = await repo.findOne({
      where: { title: normalizedTitle, isDeleted: false },
    });

    if (existingElection) {
      throw new CustomAppError( "Election with this title already exists", 400, ErrorCodes.RECORD_ALREADY_EXISTS.code, ErrorCodes.RECORD_ALREADY_EXISTS.label, "election_exists");
    }

    const alias = await generateUniqueAlias(normalizedTitle, repo);
    const slug  = await generateUniqueSlug(normalizedTitle, repo);

    // createdBy is always the authenticated actor — never accepted from
    // the client (section 15).
    const newElection = repo.create({
      title: normalizedTitle,
      description: data.description?.trim(),
      startDate: new Date(data.startDate),
      endDate: new Date(data.endDate),
      status: ElectionStatus.DRAFT,
      pricePerVote: data.pricePerVote,
      alias,
      slug,
      createdBy,
    });

    const saved = await repo.save(newElection);

    await writeAuditLog({
      actorUserId: actor.id,
      action: AuditAction.ELECTION_CREATED,
      entityType: AuditEntityType.ELECTION,
      entityId: saved.id,
    });

    return saved;
  }

  static async update(id: string, rawData: unknown, actor: ElectionActor) {
    if (!id || !isUUID(id)) {
      throw new CustomAppError( "Valid Election ID is required", 400, ErrorCodes.ID_REQUIRED.code, ErrorCodes.ID_REQUIRED.label, "bad_request" );
    }

    // Strips everything except title/description/startDate/endDate/
    // pricePerVote before it ever reaches repo.merge — see
    // ElectionSanitizer for why this is load-bearing, not cosmetic.
    const data: UpdateElectionDTO = ElectionSanitizer.update(rawData);

    const repo = await this.repo();

    const existingElection = await repo.findOne({
      where: { id, isDeleted: false },
      relations: { createdBy: true },
    });

    if (!existingElection) {
      throw new CustomAppError( "No election found with the given ID", 404, ErrorCodes.RECORD_NOT_FOUND.code, ErrorCodes.RECORD_NOT_FOUND.label, "election_not_found" );
    }

    this.assertOwnership(existingElection, actor);

    // A suspended (or otherwise unapproved) organizer must lose the
    // ability to modify their elections, not just create new ones
    // (section 11).
    if (actor.role === UserRole.ORGANIZER) {
      await OrganizerService.requireApprovedOrganizer(actor.id);
    }

    validateUpdateElection(data, existingElection);

    const normalizedTitle = data.title?.trim().toUpperCase();

    if (normalizedTitle && normalizedTitle !== existingElection.title) {
      const duplicateElection = await repo.findOne({
        where: {
          title: normalizedTitle,
          isDeleted: false,
          id: Not(id),
        },
      });

      if (duplicateElection) {
        throw new CustomAppError( "Election with this title already exists", 400, ErrorCodes.RECORD_ALREADY_EXISTS.code, ErrorCodes.RECORD_ALREADY_EXISTS.label, "election_exists" );
      }
    }

    const updatedElection = repo.merge(existingElection, {
      ...data,
      ...(normalizedTitle && { title: normalizedTitle }),
      ...(data.startDate && { startDate: new Date(data.startDate) }),
      ...(data.endDate && { endDate: new Date(data.endDate) }),
      ...(data.description !== undefined && { description: data.description?.trim() }),
    });

    return this.toSafeElection(await repo.save(updatedElection));
  }

  static async updateStatus(id: string, data: UpdateElectionStatusDTO, actor: ElectionActor) {
    if (!id || !isUUID(id)) {
      throw new CustomAppError( "Valid Election ID is required", 400, ErrorCodes.ID_REQUIRED.code, ErrorCodes.ID_REQUIRED.label, "bad_request" );
    }

    const repo = await this.repo();
    const election = await repo.findOne({
      where: { id, isDeleted: false },
      relations: { categories: true, createdBy: true },
    });

    if (!election) {
      throw new CustomAppError( "No election found with the given ID", 404, ErrorCodes.RECORD_NOT_FOUND.code, ErrorCodes.RECORD_NOT_FOUND.label, "election_not_found" );
    }

    this.assertOwnership(election, actor);

    const actorRole = actor.role === UserRole.ADMIN || actor.role === UserRole.SUPER_ADMIN ? "admin" : "organizer";

    // An organizer submitting/resubmitting must currently be an APPROVED,
    // non-suspended organizer — closing the gap where a suspended
    // organizer could otherwise still submit/publish elections (section 11).
    if (actorRole === "organizer") {
      await OrganizerService.requireApprovedOrganizer(actor.id);
    }

    validateStatusTransition(election, data.status, actorRole);

    if (data.status === ElectionStatus.REJECTED) {
      validateRejectElection(data.rejectionReason);
      election.rejectionReason = data.rejectionReason!.trim();
    } else {
      // Any transition other than REJECTED clears a stale rejection
      // reason from a previous review cycle.
      election.rejectionReason = undefined;
    }

    if (data.status === ElectionStatus.ACTIVE) {
      const now = new Date();
      if (now < election.startDate) {
        election.startDate = now; // activation IS the real start moment
      }
    }

    const previousStatus = election.status;
    election.status = data.status;
    const saved = await repo.save(election);

    const auditActionByStatus: Partial<Record<ElectionStatus, keyof typeof AuditAction>> = {
      [ElectionStatus.PENDING_REVIEW]: "ELECTION_SUBMITTED",
      [ElectionStatus.APPROVED]: "ELECTION_APPROVED",
      [ElectionStatus.REJECTED]: "ELECTION_REJECTED",
      [ElectionStatus.ACTIVE]: "ELECTION_LAUNCHED",
      [ElectionStatus.CLOSED]: "ELECTION_CLOSED",
    };
    const auditKey = auditActionByStatus[data.status];
    if (auditKey) {
      await writeAuditLog({
        actorUserId: actor.id,
        action: AuditAction[auditKey],
        entityType: AuditEntityType.ELECTION,
        entityId: saved.id,
        metadata: { from: previousStatus, to: data.status, ...(data.rejectionReason && { rejectionReason: data.rejectionReason }) },
      });
    }

    // Notify the organizer who owns the election — not the actor, who for
    // admin-driven transitions (approve/reject) is a different person.
    // createdBy is guaranteed loaded and present: assertOwnership above
    // already required it to exist for a non-admin actor, and admins act
    // on elections that always have a createdBy (NOT NULL in the schema).
    const organizerEmail = saved.createdBy?.email;
    if (organizerEmail && data.status === ElectionStatus.PENDING_REVIEW) {
      await EmailService.sendElectionSubmitted(organizerEmail, saved.title);
    } else if (organizerEmail && data.status === ElectionStatus.APPROVED) {
      await EmailService.sendElectionApproved(organizerEmail, saved.title);
    } else if (organizerEmail && data.status === ElectionStatus.REJECTED) {
      await EmailService.sendElectionRejected(organizerEmail, saved.title, saved.rejectionReason!);
    }

    return this.toSafeElection(saved);
  }

  // super_admin only — corrects a bad decision by any admin, bypassing
  // both the normal transition table AND ownership (a super admin can
  // override any election, not just their own). Same reasoning as
  // OrganizerService.overrideStatus: this is the deliberate escape hatch,
  // not a loophole — route-level requireRole enforces the super_admin
  // restriction, this method doesn't re-check the actor's role.
  static async overrideStatus(id: string, adminId: string, newStatus: ElectionStatus, reason: string) {
    if (!Object.values(ElectionStatus).includes(newStatus)) {
      throw new CustomAppError(
        `status must be one of: ${Object.values(ElectionStatus).join(", ")}`,
        400,
        ErrorCodes.VALIDATION_FAILED.code,
        ErrorCodes.VALIDATION_FAILED.label,
        "validation_failed"
      );
    }
    if (!reason?.trim()) {
      throw new CustomAppError("A reason is required to override an election's status", 400, ErrorCodes.VALIDATION_FAILED.code, ErrorCodes.VALIDATION_FAILED.label, "validation_failed");
    }

    const repo = await this.repo();
    const election = await repo.findOne({
      where: { id, isDeleted: false },
      relations: { createdBy: true },
    });

    if (!election) {
      throw new CustomAppError("No election found with the given ID", 404, ErrorCodes.RECORD_NOT_FOUND.code, ErrorCodes.RECORD_NOT_FOUND.label, "election_not_found");
    }

    const previousStatus = election.status;
    election.status = newStatus;
    election.rejectionReason = newStatus === ElectionStatus.REJECTED ? reason.trim() : undefined;
    const saved = await repo.save(election);

    await writeAuditLog({
      actorUserId: adminId,
      action: AuditAction.ELECTION_STATUS_OVERRIDDEN,
      entityType: AuditEntityType.ELECTION,
      entityId: saved.id,
      metadata: { from: previousStatus, to: newStatus, reason: reason.trim() },
    });

    const organizerEmail = saved.createdBy?.email;
    if (organizerEmail && newStatus === ElectionStatus.APPROVED) {
      await EmailService.sendElectionApproved(organizerEmail, saved.title);
    } else if (organizerEmail && newStatus === ElectionStatus.REJECTED) {
      await EmailService.sendElectionRejected(organizerEmail, saved.title, reason.trim());
    }

    return this.toSafeElection(saved);
  }

  static async updateBanner(id: string, image: ImageFileInput) {
    if (!id || !isUUID(id)) {
      throw new CustomAppError( "Valid Election ID is required", 400, ErrorCodes.ID_REQUIRED.code, ErrorCodes.ID_REQUIRED.label, "bad_request" );
    }

    const repo = await this.repo();
    const election = await repo.findOne({ where: { id, isDeleted: false } });

    if (!election) {
      throw new CustomAppError( "No election found with the given ID", 404, ErrorCodes.RECORD_NOT_FOUND.code, ErrorCodes.RECORD_NOT_FOUND.label, "election_not_found" );
    }

    const oldBannerUrl = election.bannerUrl;

    return await createWithImages(
      { ...image, fieldName: "bannerUrl" },
      async (urls) => {
        election.bannerUrl = urls.bannerUrl;
        const saved = await repo.save(election);
        if (oldBannerUrl) {
          await getStorageAdapter().delete(oldBannerUrl).catch(() => {});
        }
        return saved;
      },
      { folder: "elections" }
    );
  }

  static async delete(ids: string[]) {
    if (!Array.isArray(ids) || ids.length === 0 || ids.some((id) => !isUUID(id))) {
      throw new CustomAppError( "Valid Election IDs are required", 400, ErrorCodes.ID_REQUIRED.code, ErrorCodes.ID_REQUIRED.label, "bad_request" );
    }

    const repo = await this.repo();

    const records = await repo.find({
      where: {
        id: In(ids),
        isDeleted: false,
      },
    });

    if (records.length === 0) {
      throw new CustomAppError( "No matching records found to delete", 404, ErrorCodes.RECORD_NOT_FOUND.code, ErrorCodes.RECORD_NOT_FOUND.label, "not_found" );
    }

    records.forEach((record) => {
      record.isDeleted = true;
    });

    return repo.save(records);
  }
}