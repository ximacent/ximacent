import { apiClient, apiClientWithQuery } from "./client";
import type {
  Election,
  ElectionResults,
  ElectionStatus,
  Pagination,
  PaginationQuery,
} from "./types";

export interface ListElectionsParams extends PaginationQuery {
  title?: string;
  status?: ElectionStatus;
  createdById?: string;
}

export interface ListElectionsResponse {
  elections: Election[];
  pagination: Pagination;
}

export interface CreateElectionBody {
  title: string;
  description?: string;
  startDate: string;
  endDate: string;
  status?: "draft";
  pricePerVote: string;
}

export interface UpdateElectionBody {
  title?: string;
  description?: string;
  startDate?: string;
  endDate?: string;
  pricePerVote?: string;
}

export interface UpdateElectionStatusBody {
  status: "active" | "closed";
}

/** Authenticated election list (admin). */
export function listElections(params: ListElectionsParams = {}) {
  return apiClientWithQuery<ListElectionsResponse>("/api/v1/elections", params);
}

export function getElection(id: string) {
  return apiClient<Election>(`/api/v1/elections/${id}`);
}

export function createElection(body: CreateElectionBody) {
  return apiClient<Election>("/api/v1/elections", {
    method: "POST",
    body,
  });
}

export function updateElection(id: string, body: UpdateElectionBody) {
  return apiClient<Election>(`/api/v1/elections/${id}`, {
    method: "PATCH",
    body,
  });
}

export function updateElectionStatus(id: string, body: UpdateElectionStatusBody) {
  return apiClient<Election>(`/api/v1/elections/${id}/status`, {
    method: "PATCH",
    body,
  });
}

export function deleteElections(ids: string[]) {
  return apiClient<void>("/api/v1/elections", {
    method: "DELETE",
    body: { ids },
  });
}

/** multipart/form-data — never JSON. Field name is "banner". */
export function updateElectionBanner(id: string, banner: File) {
  const form = new FormData();
  form.append("banner", banner);
  return apiClient<Election>(`/api/v1/elections/${id}/banner`, {
    method: "PATCH",
    formData: form,
  });
}

/** Public results — no auth. */
export function getElectionResults(id: string) {
  return apiClient<ElectionResults>(`/api/v1/elections/${id}/results`, {
    public: true,
  });
}

export interface ListPublicElectionsResponse {
  elections: Election[];
  pagination: Pagination;
}

export interface ListPublicElectionsParams extends PaginationQuery {
  title?: string;
}

/** Public — active elections only. Supports title search. No auth. */
export function listPublicElections(params: ListPublicElectionsParams = {}) {
  return apiClientWithQuery<ListPublicElectionsResponse>(
    "/api/v1/public/elections",
    params,
    { public: true }
  );
}

/** Public — draft ("upcoming") elections. No search — small dataset, browse-only. No auth. */
export function listUpcomingElections(params: PaginationQuery = {}) {
  return apiClientWithQuery<ListPublicElectionsResponse>(
    "/api/v1/public/elections/upcoming",
    params,
    { public: true }
  );
}

/** Public — past (closed) elections. Supports title search. No auth. */
export function listPastElections(params: ListPublicElectionsParams = {}) {
  return apiClientWithQuery<ListPublicElectionsResponse>(
    "/api/v1/public/elections/past",
    params,
    { public: true }
  );
}

/** Public election detail with categories + nominees, by id or slug. No auth. */
export function getPublicElection(idOrSlug: string) {
  return apiClient<import("./types").PublicElectionDetail>(
    `/api/v1/public/elections/${encodeURIComponent(idOrSlug)}`,
    { public: true }
  );
}

/** Public category detail with its nominees, for the drill-down page. No auth. */
export function getPublicCategory(categoryId: string) {
  return apiClient<import("./types").PublicCategoryDetail>(
    `/api/v1/public/categories/${encodeURIComponent(categoryId)}`,
    { public: true }
  );
}
