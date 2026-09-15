import { validate as isUUID } from "uuid";
import { AppDataSource } from "@/database/data-source";
import { OrganizerProfile, OrganizerVerificationStatus } from "@/database/entities/OrganizerProfile";
import { User, UserRole } from "@/database/entities/User";
import { CustomAppError } from "@/lib/errors/customAppError";
import { ErrorCodes } from "@/lib/errors/errorCodes";
import { EmailService } from "@/lib/email/email.service";
import { writeAuditLog } from "@/lib/audit/writeAuditLog";
import { AuditAction, AuditEntityType } from "@/lib/audit/auditActions";
import { buildPaginationMeta, parsePagination } from "@/lib/http/pagination";
import { PaginationQuery } from "@/types/pagination.type";
import { FilterOrganizerDTO, OrganizerStatusSummary, RejectOrganizerDTO, UpdateOrganizerProfileDTO } from "@/types/organizer.type";
import { OrganizerSanitizer } from "./organizer.sanitizer";
import { createWithImages, ImageFileInput } from "@/lib/storage/createWithImages";
import { getStorageAdapter } from "@/lib/storage/getStorageAdapter";
import {
  validateReadyForSubmission,
  validateRejectOrganizer,
  validateUpdateOrganizerProfile,
  validateVerificationStatusTransition,
} from "./organizer.validator";

export class OrganizerService {
  private static async repo() {
    const db = await AppDataSource();
    return db.getRepository(OrganizerProfile);
  }

  // Mirrors UserService.withoutPassword — TypeORM does not strip columns
  // on its own, so any OrganizerProfile returned to a client with its
  // `user`/`reviewedBy` relations loaded would otherwise leak
  // passwordHash in the JSON response. Every method below that returns a
  // profile to a controller/route goes through this first.
  private static withoutPassword(user: User): Omit<User, "passwordHash"> {
    const safeUser: Partial<User> = { ...user };
    delete safeUser.passwordHash;
    return safeUser as Omit<User, "passwordHash">;
  }

  private static toSafeProfile(profile: OrganizerProfile): OrganizerProfile {
    return {
      ...profile,
      user: profile.user ? (this.withoutPassword(profile.user) as User) : profile.user,
      reviewedBy: profile.reviewedBy ? (this.withoutPassword(profile.reviewedBy) as User) : profile.reviewedBy,
    };
  }

  // node-postgres error shape for a unique_violation is { code: "23505" }.
  private static isUniqueViolation(err: unknown): boolean {
    return typeof err === "object" && err !== null && "code" in err && (err as { code: unknown }).code === "23505";
  }

  // Always resolves ownership through the authenticated userId (req.user.sub)
  // — never through a client-supplied id. This is the one lookup method
  // every self-service method below goes through. Also verifies the
  // underlying User account is still active (not soft-deleted) — section
  // 14 requires "account is active" as part of the election-creation gate,
  // and a soft-deleted account must lose organizer privileges immediately
  // even if its (still-valid, unexpired) JWT is presented again.
  private static async findByUserId(userId: string): Promise<OrganizerProfile> {
    const repo = await this.repo();
    const profile = await repo.findOne({
      where: { user: { id: userId, isDeleted: false }, isDeleted: false },
      relations: { user: true },
    });

    if (!profile) {
      throw new CustomAppError("No organizer profile found for this account", 404, ErrorCodes.RECORD_NOT_FOUND.code, ErrorCodes.RECORD_NOT_FOUND.label, "organizer_profile_not_found");
    }

    return profile;
  }

  private static async findById(id: string): Promise<OrganizerProfile> {
    if (!id || !isUUID(id)) {
      throw new CustomAppError("Valid organizer profile ID is required", 400, ErrorCodes.ID_REQUIRED.code, ErrorCodes.ID_REQUIRED.label, "bad_request");
    }

    const repo = await this.repo();
    const profile = await repo.findOne({ where: { id, isDeleted: false }, relations: { user: true, reviewedBy: true } });

    if (!profile) {
      throw new CustomAppError("No organizer profile found with the given ID", 404, ErrorCodes.RECORD_NOT_FOUND.code, ErrorCodes.RECORD_NOT_FOUND.label, "organizer_profile_not_found");
    }

    return profile;
  }

  // ── Self-service ─────────────────────────────────────────────────

  static async getMyProfile(userId: string) {
    return this.toSafeProfile(await this.findByUserId(userId));
  }

  // `image` is optional — this single method covers both "update text
  // fields only" (JSON body) and "update fields + upload the Ghana Card
  // image in the same request" (multipart body). uploadGhCardImage()
  // below is a thin wrapper over this for the image-only endpoint, so
  // there's exactly one code path for the upload/rollback logic rather
  // than two copies that could drift apart.
  static async updateMyProfile(userId: string, rawData: unknown, image?: ImageFileInput) {
    const profile = await this.findByUserId(userId);

    // Once approved/suspended, profile edits should not silently change
    // details an admin already reviewed without going back through review.
    // A rejected organizer edits freely, then resubmits (PENDING again).
    // A NOT_STARTED/PENDING organizer can freely edit while building up
    // their application.
    if (
      profile.verificationStatus === OrganizerVerificationStatus.APPROVED ||
      profile.verificationStatus === OrganizerVerificationStatus.SUSPENDED
    ) {
      throw new CustomAppError(
        "Profile cannot be edited once approved or suspended. Contact support for changes.",
        400,
        ErrorCodes.INVALID_STATE.code,
        ErrorCodes.INVALID_STATE.label,
        "invalid_verification_state"
      );
    }

    const data: UpdateOrganizerProfileDTO = OrganizerSanitizer.update(rawData);
    validateUpdateOrganizerProfile(data);

    // Normalize to the canonical GHA-XXXXXXXXX-X shape so the same real
    // card can't create two "different-looking" duplicate values (e.g.
    // lowercase or stray whitespace) that a raw unique constraint wouldn't
    // catch.
    if (data.ghCardNumber) {
      data.ghCardNumber = data.ghCardNumber.trim().toUpperCase();
    }

    const repo = await this.repo();
    const oldImageUrl = profile.ghCardImageUrl;

    const persist = async (imageUrls?: Record<string, string>): Promise<OrganizerProfile> => {
      const merged = repo.merge(profile, data);
      if (imageUrls?.ghCardImageUrl) {
        merged.ghCardImageUrl = imageUrls.ghCardImageUrl;
      }

      try {
        const saved = await repo.save(merged);
        if (imageUrls?.ghCardImageUrl && oldImageUrl) {
          // Best-effort cleanup of the replaced image — never let a
          // storage-delete failure block the successful profile update.
          await getStorageAdapter().delete(oldImageUrl).catch(() => {});
        }
        return saved;
      } catch (err: unknown) {
        // Postgres unique_violation on gh_card_number — surface a clear,
        // actionable error instead of a raw 500.
        if (this.isUniqueViolation(err)) {
          throw new CustomAppError(
            "This Ghana Card number is already registered to another organizer account",
            400,
            ErrorCodes.RECORD_ALREADY_EXISTS.code,
            ErrorCodes.RECORD_ALREADY_EXISTS.label,
            "gh_card_already_registered"
          );
        }
        throw err;
      }
    };

    // createWithImages uploads first, then calls persist(); if persist
    // throws for any reason (including the unique-violation case above),
    // it deletes the just-uploaded image again before rethrowing — so a
    // rejected Ghana Card number never leaves an orphaned file in storage.
    const saved = image
      ? await createWithImages({ ...image, fieldName: "ghCardImageUrl" }, persist, { folder: "organizer-documents" })
      : await persist();

    await writeAuditLog({
      actorUserId: userId,
      action: AuditAction.ORGANIZER_PROFILE_UPDATED,
      entityType: AuditEntityType.ORGANIZER_PROFILE,
      entityId: profile.id,
    });

    return this.toSafeProfile(saved);
  }

  // Thin wrapper for the dedicated image-only endpoint — same logic path
  // as updateMyProfile, just with no text fields to merge.
  static async uploadGhCardImage(userId: string, image: ImageFileInput) {
    return this.updateMyProfile(userId, {}, image);
  }

  static async submitApplication(userId: string) {
    const profile = await this.findByUserId(userId);

    validateVerificationStatusTransition(profile.verificationStatus, OrganizerVerificationStatus.PENDING);
    validateReadyForSubmission(profile, profile.user);

    const repo = await this.repo();
    profile.verificationStatus = OrganizerVerificationStatus.PENDING;
    profile.submittedAt = new Date();
    // Clear any previous rejection reason — it no longer applies once a
    // fresh submission is under review.
    profile.rejectionReason = undefined;

    const saved = await repo.save(profile);

    await writeAuditLog({
      actorUserId: userId,
      action: AuditAction.ORGANIZER_APPLICATION_SUBMITTED,
      entityType: AuditEntityType.ORGANIZER_PROFILE,
      entityId: profile.id,
    });

    await EmailService.sendOrganizerApplicationSubmitted(profile.user.email);

    return this.toSafeProfile(saved);
  }

  // Section 20 — informational status summary for the frontend. This is
  // never the security boundary; every write path re-checks the DB itself.
  static async getStatusSummary(userId: string): Promise<OrganizerStatusSummary> {
    const db = await AppDataSource();
    const userRepo = db.getRepository(User);
    const user = await userRepo.findOne({ where: { id: userId, isDeleted: false } });

    if (!user) {
      throw new CustomAppError("User not found", 404, ErrorCodes.USER_NOT_FOUND.code, ErrorCodes.USER_NOT_FOUND.label, "user_not_found");
    }

    if (user.role !== UserRole.ORGANIZER) {
      return {
        role: user.role,
        emailVerified: user.emailVerified,
        verificationStatus: OrganizerVerificationStatus.NOT_STARTED,
        canCreateElection: false,
      };
    }

    const profile = await this.findByUserId(userId);

    return {
      role: user.role,
      emailVerified: user.emailVerified,
      verificationStatus: profile.verificationStatus,
      canCreateElection: profile.verificationStatus === OrganizerVerificationStatus.APPROVED,
      rejectionReason: profile.rejectionReason,
    };
  }

  // ── Admin review ─────────────────────────────────────────────────

  static async listForAdmin(filters: FilterOrganizerDTO & PaginationQuery) {
    const repo = await this.repo();
    const query = repo
      .createQueryBuilder("profile")
      .leftJoinAndSelect("profile.user", "user")
      .where("profile.isDeleted = :isDeleted", { isDeleted: false });

    if (filters.verificationStatus) {
      query.andWhere("profile.verificationStatus = :status", { status: filters.verificationStatus });
    }

    if (filters.search?.trim()) {
      const pattern = `%${filters.search.trim()}%`;
      query.andWhere(
        "(profile.organizationName ILIKE :pattern OR user.email ILIKE :pattern OR user.firstName ILIKE :pattern OR user.lastName ILIKE :pattern)",
        { pattern }
      );
    }

    const { page, limit, skip, take } = parsePagination({
      page: filters.page?.toString(),
      limit: filters.limit?.toString(),
    });

    const [profiles, count] = await query
      .orderBy("profile.submittedAt", "DESC", "NULLS LAST")
      .addOrderBy("profile.createdAt", "DESC")
      .skip(skip)
      .take(take)
      .getManyAndCount();

    return { organizers: profiles.map((p) => this.toSafeProfile(p)), pagination: buildPaginationMeta(count, page, limit) };
  }

  static async getForAdmin(id: string) {
    return this.toSafeProfile(await this.findById(id));
  }

  static async approve(id: string, adminId: string) {
    const profile = await this.findById(id);
    validateVerificationStatusTransition(profile.verificationStatus, OrganizerVerificationStatus.APPROVED);

    const db = await AppDataSource();
    await db.transaction(async (manager) => {
      const repo = manager.getRepository(OrganizerProfile);
      profile.verificationStatus = OrganizerVerificationStatus.APPROVED;
      profile.reviewedAt = new Date();
      profile.reviewedBy = { id: adminId } as User;
      profile.rejectionReason = undefined;
      await repo.save(profile);

      await writeAuditLog(
        {
          actorUserId: adminId,
          action: AuditAction.ORGANIZER_APPROVED,
          entityType: AuditEntityType.ORGANIZER_PROFILE,
          entityId: profile.id,
        },
        manager
      );
    });

    await EmailService.sendOrganizerApproved(profile.user.email);
    return this.toSafeProfile(profile);
  }

  static async reject(id: string, adminId: string, rawData: RejectOrganizerDTO) {
    validateRejectOrganizer(rawData);
    const profile = await this.findById(id);
    validateVerificationStatusTransition(profile.verificationStatus, OrganizerVerificationStatus.REJECTED);

    const db = await AppDataSource();
    await db.transaction(async (manager) => {
      const repo = manager.getRepository(OrganizerProfile);
      profile.verificationStatus = OrganizerVerificationStatus.REJECTED;
      profile.reviewedAt = new Date();
      profile.reviewedBy = { id: adminId } as User;
      profile.rejectionReason = rawData.rejectionReason.trim();
      await repo.save(profile);

      await writeAuditLog(
        {
          actorUserId: adminId,
          action: AuditAction.ORGANIZER_REJECTED,
          entityType: AuditEntityType.ORGANIZER_PROFILE,
          entityId: profile.id,
          metadata: { rejectionReason: profile.rejectionReason },
        },
        manager
      );
    });

    await EmailService.sendOrganizerRejected(profile.user.email, profile.rejectionReason!);
    return this.toSafeProfile(profile);
  }

  static async suspend(id: string, adminId: string) {
    const profile = await this.findById(id);
    validateVerificationStatusTransition(profile.verificationStatus, OrganizerVerificationStatus.SUSPENDED);

    const db = await AppDataSource();
    await db.transaction(async (manager) => {
      const repo = manager.getRepository(OrganizerProfile);
      profile.verificationStatus = OrganizerVerificationStatus.SUSPENDED;
      profile.reviewedAt = new Date();
      profile.reviewedBy = { id: adminId } as User;
      await repo.save(profile);

      await writeAuditLog(
        {
          actorUserId: adminId,
          action: AuditAction.ORGANIZER_SUSPENDED,
          entityType: AuditEntityType.ORGANIZER_PROFILE,
          entityId: profile.id,
        },
        manager
      );
    });

    await EmailService.sendOrganizerSuspended(profile.user.email);
    return this.toSafeProfile(profile);
  }

  // super_admin only — corrects a bad decision by any admin (including
  // super_admin themselves). Deliberately bypasses
  // validateVerificationStatusTransition's normal state machine — that's
  // the whole point of an override, e.g. reverting a wrongly-APPROVED
  // organizer straight back to REJECTED without going through PENDING
  // first. A reason is mandatory for accountability, same as a normal
  // rejection. Route-level requireRole enforces the super_admin
  // restriction; this method does not re-check the actor's role itself.
  static async overrideStatus(id: string, adminId: string, newStatus: OrganizerVerificationStatus, reason: string) {
    if (!Object.values(OrganizerVerificationStatus).includes(newStatus)) {
      throw new CustomAppError(
        `verificationStatus must be one of: ${Object.values(OrganizerVerificationStatus).join(", ")}`,
        400,
        ErrorCodes.VALIDATION_FAILED.code,
        ErrorCodes.VALIDATION_FAILED.label,
        "validation_failed"
      );
    }
    if (!reason?.trim()) {
      throw new CustomAppError("A reason is required to override an organizer's status", 400, ErrorCodes.VALIDATION_FAILED.code, ErrorCodes.VALIDATION_FAILED.label, "validation_failed");
    }

    const profile = await this.findById(id);
    const previousStatus = profile.verificationStatus;

    const db = await AppDataSource();
    await db.transaction(async (manager) => {
      const repo = manager.getRepository(OrganizerProfile);
      profile.verificationStatus = newStatus;
      profile.reviewedAt = new Date();
      profile.reviewedBy = { id: adminId } as User;
      profile.rejectionReason = newStatus === OrganizerVerificationStatus.REJECTED ? reason.trim() : undefined;
      await repo.save(profile);

      await writeAuditLog(
        {
          actorUserId: adminId,
          action: AuditAction.ORGANIZER_STATUS_OVERRIDDEN,
          entityType: AuditEntityType.ORGANIZER_PROFILE,
          entityId: profile.id,
          metadata: { from: previousStatus, to: newStatus, reason: reason.trim() },
        },
        manager
      );
    });

    // Reuse the same notification templates the normal flow uses where
    // they apply — an override should feel like a real decision to the
    // organizer, not a silent database change.
    if (newStatus === OrganizerVerificationStatus.APPROVED) {
      await EmailService.sendOrganizerApproved(profile.user.email);
    } else if (newStatus === OrganizerVerificationStatus.REJECTED) {
      await EmailService.sendOrganizerRejected(profile.user.email, reason.trim());
    } else if (newStatus === OrganizerVerificationStatus.SUSPENDED) {
      await EmailService.sendOrganizerSuspended(profile.user.email);
    }

    return this.toSafeProfile(profile);
  }

  // Used by ElectionService to authorize election creation/mutation —
  // always a fresh DB read, never trusts the JWT (which only carries role,
  // not verificationStatus).
  static async requireApprovedOrganizer(userId: string): Promise<OrganizerProfile> {
    const profile = await this.findByUserId(userId);

    if (profile.verificationStatus !== OrganizerVerificationStatus.APPROVED) {
      throw new CustomAppError(
        "Your organizer account must be approved before you can create or manage elections",
        403,
        ErrorCodes.PERMISSION_DENIED.code,
        ErrorCodes.PERMISSION_DENIED.label,
        "organizer_not_approved"
      );
    }

    return profile;
  }
}
