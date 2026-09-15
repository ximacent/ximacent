import { apiClientWithQuery } from "./client";
import type { Pagination, UserSummary } from "./types";

export interface AuditLog {
  id: string;
  actorUserId: string;
  actor?: UserSummary;
  action: string;
  entityType: string;
  entityId: string;
  metadata?: Record<string, unknown>;
  createdAt: string;
}

export interface ListAuditLogsResponse {
  auditLogs: AuditLog[];
  pagination: Pagination;
}

export function listAuditLogs(params: { actorUserId?: string; action?: string; entityType?: string; entityId?: string; page?: number; limit?: number } = {}) {
  return apiClientWithQuery<ListAuditLogsResponse>("/api/v1/audit-logs", params);
}
