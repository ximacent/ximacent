// GET /api/v1/audit-logs — super_admin only.
// This is the actual point of the super_admin tier's existence: the
// ability to see what every admin has done, not just review things
// yourself. Filter by ?actorUserId=... to audit one admin specifically.

import { AuditLogController } from "@/modules/audit-log/auditLog.controller";
import { customResponse } from "@/lib/http/response";
import { SuccessCodes } from "@/lib/http/successCodes";
import { handleError } from "@/lib/errors/globalError";
import { withAuth, AuthedHandler } from "@/middleware/withAuth";
import { UserRole } from "@/database/entities/User";
import { FilterAuditLogDTO } from "@/types/auditLog.type";
import { PaginationQuery } from "@/types/pagination.type";

const getHandler: AuthedHandler = async (req, _ctx) => {
  try {
    const params = req.nextUrl.searchParams;
    const filters: FilterAuditLogDTO & PaginationQuery = {
      actorUserId: params.get("actorUserId") ?? undefined,
      action: params.get("action") ?? undefined,
      entityType: params.get("entityType") ?? undefined,
      entityId: params.get("entityId") ?? undefined,
      page: params.get("page") ? Number(params.get("page")) : undefined,
      limit: params.get("limit") ? Number(params.get("limit")) : undefined,
    };

    const result = await AuditLogController.list(filters);
    return customResponse(SuccessCodes.RECORD_FETCHED.code, SuccessCodes.RECORD_FETCHED.message, 200, result);
  } catch (error) {
    return handleError(error);
  }
};

export const GET = withAuth(getHandler, { requireRole: UserRole.SUPER_ADMIN });
