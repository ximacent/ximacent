import { validate as isUUID } from "uuid";
import { AppDataSource } from "@/database/data-source";
import { AuditLog } from "@/database/entities/AuditLog";
import { CustomAppError } from "@/lib/errors/customAppError";
import { ErrorCodes } from "@/lib/errors/errorCodes";
import { buildPaginationMeta, parsePagination } from "@/lib/http/pagination";
import { PaginationQuery } from "@/types/pagination.type";
import { FilterAuditLogDTO } from "@/types/auditLog.type";

export class AuditLogService {
  private static async repo() {
    const db = await AppDataSource();
    return db.getRepository(AuditLog);
  }

  static async list(filters: FilterAuditLogDTO & PaginationQuery) {
    if (filters.actorUserId && !isUUID(filters.actorUserId)) {
      throw new CustomAppError("Valid actorUserId is required", 400, ErrorCodes.VALIDATION_FAILED.code, ErrorCodes.VALIDATION_FAILED.label, "validation_failed");
    }

    const repo = await this.repo();

    // Explicit column selection on the actor relation — never
    // leftJoinAndSelect here, since that would pull passwordHash and
    // every other User column into an audit trail that other admins can
    // read. This is the same class of leak this project has already hit
    // twice (OrganizerProfile.user, Election.createdBy) — avoided here by
    // construction instead of by remembering to strip it afterward.
    const query = repo
      .createQueryBuilder("log")
      .leftJoin("log.actor", "actor")
      .addSelect(["actor.id", "actor.firstName", "actor.lastName", "actor.email", "actor.role"]);

    if (filters.actorUserId) {
      query.andWhere("actor.id = :actorUserId", { actorUserId: filters.actorUserId });
    }
    if (filters.action) {
      query.andWhere("log.action = :action", { action: filters.action });
    }
    if (filters.entityType) {
      query.andWhere("log.entityType = :entityType", { entityType: filters.entityType });
    }
    if (filters.entityId) {
      query.andWhere("log.entityId = :entityId", { entityId: filters.entityId });
    }

    const { page, limit, skip, take } = parsePagination({
      page: filters.page?.toString(),
      limit: filters.limit?.toString(),
    });

    const [logs, count] = await query
      .orderBy("log.createdAt", "DESC")
      .skip(skip)
      .take(take)
      .getManyAndCount();

    return { auditLogs: logs, pagination: buildPaginationMeta(count, page, limit) };
  }
}
