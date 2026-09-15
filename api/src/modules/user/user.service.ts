import { validateCreateUser, validatePasswordStrength, validateUserEnum } from "@/modules/user/user.validator";
import { validate as isUUID } from "uuid";
import { Brackets, In } from "typeorm";
import { AppDataSource } from "@/database/data-source";
import { User, UserRole } from "@/database/entities/User";
import { CreateUserDTO, FilterUserDTO, UpdateUserDTO, UserActor } from "@/types/user.type";
import { CustomAppError } from "@/lib/errors/customAppError";
import { ErrorCodes } from "@/lib/errors/errorCodes";
import bcrypt from "bcrypt";
import { UserSanitizer } from "./user.sanitizer";
import { buildPaginationMeta, parsePagination } from "@/lib/http/pagination";
import { PaginationQuery } from "@/types/pagination.type";

import { EmailService } from "@/lib/email/email.service";
import { writeAuditLog } from "@/lib/audit/writeAuditLog";
import { AuditAction, AuditEntityType } from "@/lib/audit/auditActions";

const ADMIN_TIER_ROLES: ReadonlySet<UserRole> = new Set([UserRole.ADMIN, UserRole.SUPER_ADMIN]);

export class UserService {

  private static withoutPassword(user: User) {
    const { passwordHash: _password, ...safeUser } = user;
    return safeUser;
  }

  private static async repo() {
    const db = await AppDataSource();
    return db.getRepository(User);
  }

  // The core authority rule for this whole module: a regular ADMIN may
  // manage voters and organizers, but never another admin or super_admin
  // account — only SUPER_ADMIN can do that. Acting on your own account is
  // always allowed regardless of role (so a normal user can still edit
  // their own name/phone via PATCH /users/:id, since there's no separate
  // "me" endpoint for that in this app).
  private static assertCanManageTarget(actor: UserActor, target: User) {
    if (actor.id === target.id) return;
    if (actor.role === UserRole.SUPER_ADMIN) return;

    if (ADMIN_TIER_ROLES.has(target.role)) {
      throw new CustomAppError(
        "Only a super admin can manage another admin or super admin account",
        403,
        ErrorCodes.PERMISSION_DENIED.code,
        ErrorCodes.PERMISSION_DENIED.label,
        "forbidden"
      );
    }
  }

  static async getUsers(filters: FilterUserDTO & PaginationQuery) {
      const repo = await this.repo();
      const usersQuery = repo
        .createQueryBuilder("user")
        .where("user.isDeleted = :isDeleted", { isDeleted: false });

      if (filters.phone) {
        usersQuery.andWhere("user.phone ILIKE :phone", {
          phone: `%${filters.phone.trim()}%`,
        });
      }
      if (filters.role) {
        usersQuery.andWhere("user.role = :role", { role: filters.role as UserRole });
      }
      if (filters.isVerified !== undefined) {
        usersQuery.andWhere("user.isVerified = :isVerified", {
          isVerified: filters.isVerified,
        });
      }

      const searchTerms = filters.search?.trim().split(/\s+/).filter(Boolean) ?? [];
      searchTerms.forEach((term, index) => {
        const parameter = `searchTerm${index}`;
        const pattern = `%${term}%`;

        usersQuery.andWhere(
          new Brackets((searchQuery) => {
            searchQuery
              .where(`user.firstName ILIKE :${parameter}`, { [parameter]: pattern })
              .orWhere(`user.lastName ILIKE :${parameter}`, { [parameter]: pattern })
              .orWhere(`user.email ILIKE :${parameter}`, { [parameter]: pattern });
          })
        );
      });

      const { page, limit, skip, take } = parsePagination({
        page: filters.page?.toString(),
        limit: filters.limit?.toString(),
      });

      const [users, count] = await usersQuery
        .orderBy("user.createdAt", "DESC")
        .skip(skip)
        .take(take)
        .getManyAndCount();

      return { users: users.map(this.withoutPassword), pagination: buildPaginationMeta(count, page, limit) };
  }

  // GET is intentionally not locked to admin-tier-only — self-access must
  // keep working (no separate "me" endpoint exists). Viewing another
  // admin/super_admin's basic record is allowed for any admin-tier actor;
  // view was deliberately not treated as the sensitive boundary here —
  // write access is (see assertCanManageTarget).
  static async getUser(id: string, actor: UserActor) {
    if (!id || !isUUID(id)) {
      throw new CustomAppError("Valid User ID is required", 400, ErrorCodes.ID_REQUIRED.code, ErrorCodes.ID_REQUIRED.label, "bad_request");
    }

    const repo = await this.repo();

    const user = await repo.findOne({
      where: { id, isDeleted: false },
    });

    if (!user) {
      throw new CustomAppError("No user found with the given ID", 404, ErrorCodes.USER_NOT_FOUND.code, ErrorCodes.USER_NOT_FOUND.label, "user_not_found");
    }

    if (actor.id !== user.id && !ADMIN_TIER_ROLES.has(actor.role)) {
      throw new CustomAppError(
        "You do not have permission to view this user",
        403,
        ErrorCodes.PERMISSION_DENIED.code,
        ErrorCodes.PERMISSION_DENIED.label,
        "forbidden"
      );
    }

    return this.withoutPassword(user);
  }

  static async create(data: CreateUserDTO, actor: UserActor) {
      const repo = await this.repo();

      const safeData = UserSanitizer.create(data);

      validateCreateUser(safeData); // now internally covers presence + enum + password strength

      // Only a super admin may mint a new admin or super_admin account
      // through this endpoint — a regular admin creating accounts is
      // limited to voter/organizer, same as the public registration path
      // is limited to voter/organizer.
      if (ADMIN_TIER_ROLES.has(safeData.role) && actor.role !== UserRole.SUPER_ADMIN) {
        throw new CustomAppError(
          "Only a super admin can create an admin or super admin account",
          403,
          ErrorCodes.PERMISSION_DENIED.code,
          ErrorCodes.PERMISSION_DENIED.label,
          "forbidden"
        );
      }

      const existingUser = await repo.findOne({
        where: { email: safeData.email, isDeleted: false },
      });

      if (existingUser) {
        throw new CustomAppError("User with this email already exists", 400, ErrorCodes.RECORD_ALREADY_EXISTS.code, ErrorCodes.RECORD_ALREADY_EXISTS.label, "user_exists");
      }

      const passwordHash = await bcrypt.hash(safeData.passwordHash, 10);

      const newUser = repo.create({
        firstName: safeData.firstName,
        lastName: safeData.lastName,
        phone: safeData.phone,
        email: safeData.email,
        role: safeData.role,
        passwordHash,
      });

      return this.withoutPassword(await repo.save(newUser));
  }

  static async update(id: string, data: UpdateUserDTO, actor: UserActor) {
    if (!id || !isUUID(id)) {
      throw new CustomAppError("Valid User ID is required", 400, ErrorCodes.ID_REQUIRED.code, ErrorCodes.ID_REQUIRED.label, "bad_request");
    }

    const safeData = UserSanitizer.update(data); // strips phoneNumber, email, role, passwordHash, isActive, anything not in the allowlist
    validateUserEnum(safeData);

    const repo = await this.repo();

    const existingUser = await repo.findOne({ where: { id, isDeleted: false } });
    if (!existingUser) {
      throw new CustomAppError("No user found with the given ID", 404, ErrorCodes.USER_NOT_FOUND.code, ErrorCodes.USER_NOT_FOUND.label, "user_not_found");
    }

    this.assertCanManageTarget(actor, existingUser);

    // A verified phone can never be changed here — it must go through
    // request-phone-change -> confirm-phone-change (AuthService), which
    // only ever overwrites `phone` once the OTP sent to the NEW number is
    // confirmed. This guarantees there's never a window where the account
    // shows an unverified number as if it were verified. Before the first
    // verification, phone stays freely editable here (fixing a typo
    // during onboarding shouldn't require the OTP dance).
    if (safeData.phone !== undefined && safeData.phone !== existingUser.phone && existingUser.phoneVerified) {
      throw new CustomAppError(
        "Your phone number is verified and can't be changed here. Use the change-phone flow instead.",
        400,
        ErrorCodes.INVALID_STATE.code,
        ErrorCodes.INVALID_STATE.label,
        "phone_change_requires_verification"
      );
    }

    const updatedUser = repo.merge(existingUser, safeData);
    return this.withoutPassword(await repo.save(updatedUser));
  }
  
  // Blocks any action that would leave zero super_admin accounts — the
  // same "can't lock everyone out of the top tier" rule GitHub orgs / AWS
  // root accounts enforce. Pass the ids of super_admin accounts that are
  // about to be removed/demoted; assumes the caller has already confirmed
  // each id is currently a super_admin.
  private static async assertSuperAdminsRemain(superAdminIdsBeingRemoved: string[]) {
    const repo = await this.repo();
    const totalSuperAdmins = await repo.count({
      where: { role: UserRole.SUPER_ADMIN, isDeleted: false },
    });

    if (totalSuperAdmins - superAdminIdsBeingRemoved.length <= 0) {
      throw new CustomAppError(
        "This action would leave the platform with no super admin accounts",
        400,
        ErrorCodes.INVALID_STATE.code,
        ErrorCodes.INVALID_STATE.label,
        "last_super_admin"
      );
    }
  }

  static async delete(ids: string[], actor: UserActor) {
    if (!Array.isArray(ids) || ids.length === 0) {
      throw new CustomAppError("Invalid request IDs", 400, ErrorCodes.ID_REQUIRED.code, ErrorCodes.ID_REQUIRED.label, "bad_request");
    }

    const repo = await this.repo();

    const records = await repo.find({
      where: { id: In(ids), isDeleted: false },
    });

    if (records.length === 0) {
      throw new CustomAppError("No matching records found to delete", 404, ErrorCodes.RECORD_NOT_FOUND.code, ErrorCodes.RECORD_NOT_FOUND.label, "not_found");
    }

    // All-or-nothing: if any targeted record is an admin/super_admin and
    // the actor isn't a super admin, reject the whole batch rather than
    // silently deleting the ones that were allowed. A partial silent skip
    // would be a confusing, easy-to-miss way to leave admin accounts
    // deleted alongside voters in the same request.
    if (actor.role !== UserRole.SUPER_ADMIN) {
      const blocked = records.filter((r) => ADMIN_TIER_ROLES.has(r.role) && r.id !== actor.id);
      if (blocked.length > 0) {
        throw new CustomAppError(
          "Only a super admin can delete an admin or super admin account",
          403,
          ErrorCodes.PERMISSION_DENIED.code,
          ErrorCodes.PERMISSION_DENIED.label,
          "forbidden"
        );
      }
    }

    const superAdminIdsInBatch = records.filter((r) => r.role === UserRole.SUPER_ADMIN).map((r) => r.id);
    if (superAdminIdsInBatch.length > 0) {
      await this.assertSuperAdminsRemain(superAdminIdsInBatch);
    }

    records.forEach(record => {
      record.isDeleted = true;
    });

    return repo.save(records);
  }

  // super_admin only (enforced at the route level, same convention as
  // organizer/election override endpoints — this method doesn't re-check
  // the actor's role itself). Handles both promotion and demotion, since
  // it's the same operation either direction: set a new role, guard
  // against ever having zero super_admin accounts, notify the affected
  // user, and audit-log who changed what.
  static async changeRole(targetId: string, newRole: UserRole, actor: UserActor) {
    if (!targetId || !isUUID(targetId)) {
      throw new CustomAppError("Valid User ID is required", 400, ErrorCodes.ID_REQUIRED.code, ErrorCodes.ID_REQUIRED.label, "bad_request");
    }
    if (!Object.values(UserRole).includes(newRole)) {
      throw new CustomAppError(`role must be one of: ${Object.values(UserRole).join(", ")}`, 400, ErrorCodes.VALIDATION_FAILED.code, ErrorCodes.VALIDATION_FAILED.label, "validation_failed");
    }

    const repo = await this.repo();
    const target = await repo.findOne({ where: { id: targetId, isDeleted: false } });
    if (!target) {
      throw new CustomAppError("No user found with the given ID", 404, ErrorCodes.USER_NOT_FOUND.code, ErrorCodes.USER_NOT_FOUND.label, "user_not_found");
    }

    if (target.role === newRole) {
      return this.withoutPassword(target); // no-op, not an error
    }

    // Guard: if the target currently IS super_admin and is being changed
    // to anything else, confirm at least one other super_admin exists —
    // covers both "someone demotes another super_admin" and "a super
    // admin demotes themselves" (self-changes are otherwise allowed).
    if (target.role === UserRole.SUPER_ADMIN && newRole !== UserRole.SUPER_ADMIN) {
      await this.assertSuperAdminsRemain([target.id]);
    }

    const previousRole = target.role;
    target.role = newRole;
    const saved = await repo.save(target);

    await writeAuditLog({
      actorUserId: actor.id,
      action: AuditAction.USER_ROLE_CHANGED,
      entityType: AuditEntityType.USER,
      entityId: target.id,
      metadata: { from: previousRole, to: newRole },
    });

    await EmailService.sendRoleChanged(target.email, newRole);

    return this.withoutPassword(saved);
  }
}