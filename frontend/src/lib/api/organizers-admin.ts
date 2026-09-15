import { apiClient, apiClientWithQuery } from "./client";
import type { Pagination } from "./types";
import type { OrganizerProfile, OrganizerVerificationStatus } from "./organizers";

export interface ListOrganizersResponse {
  organizers: OrganizerProfile[];
  pagination: Pagination;
}

export function listOrganizers(params: { verificationStatus?: OrganizerVerificationStatus; search?: string; page?: number; limit?: number } = {}) {
  return apiClientWithQuery<ListOrganizersResponse>("/api/v1/organizers", params);
}

export function getOrganizer(id: string) {
  return apiClient<OrganizerProfile>(`/api/v1/organizers/${id}`);
}

export function approveOrganizer(id: string) {
  return apiClient<OrganizerProfile>(`/api/v1/organizers/${id}/approve`, { method: "PATCH" });
}

export function rejectOrganizer(id: string, rejectionReason: string) {
  return apiClient<OrganizerProfile>(`/api/v1/organizers/${id}/reject`, { method: "PATCH", body: { rejectionReason } });
}

export function suspendOrganizer(id: string) {
  return apiClient<OrganizerProfile>(`/api/v1/organizers/${id}/suspend`, { method: "PATCH" });
}

export function overrideOrganizerStatus(id: string, verificationStatus: OrganizerVerificationStatus, reason: string) {
  return apiClient<OrganizerProfile>(`/api/v1/organizers/${id}/override-status`, {
    method: "PATCH",
    body: { verificationStatus, reason },
  });
}
