import { AuditLogService } from "./auditLog.service";
import { FilterAuditLogDTO } from "@/types/auditLog.type";
import { PaginationQuery } from "@/types/pagination.type";

export class AuditLogController {
  static async list(filters: FilterAuditLogDTO & PaginationQuery) {
    return await AuditLogService.list(filters);
  }
}
