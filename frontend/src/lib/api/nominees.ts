import { apiClient, apiClientWithQuery } from "./client";
import type { Nominee, NomineeVotes, Pagination, PaginationQuery, PublicNominee } from "./types";

export interface ListNomineesParams extends PaginationQuery {
  name?: string;
  categoryId?: string;
  code?: string;
}

export interface ListNomineesResponse {
  nominees: Nominee[];
  pagination: Pagination;
}

export interface NomineeFormFields {
  name: string;
  bio?: string;
  categoryId: string;
  image?: File | null;
}

function toNomineeFormData(fields: Partial<NomineeFormFields>): FormData {
  const form = new FormData();
  if (fields.name !== undefined) form.append("name", fields.name);
  if (fields.bio !== undefined) form.append("bio", fields.bio);
  if (fields.categoryId !== undefined) form.append("categoryId", fields.categoryId);
  if (fields.image) form.append("image", fields.image);
  return form;
}

export function listNominees(params: ListNomineesParams = {}) {
  return apiClientWithQuery<ListNomineesResponse>("/api/v1/nominees", params);
}

export function getNominee(id: string) {
  return apiClient<Nominee>(`/api/v1/nominees/${id}`);
}

/** multipart/form-data — never JSON. */
export function createNominee(fields: NomineeFormFields) {
  return apiClient<Nominee>("/api/v1/nominees", {
    method: "POST",
    formData: toNomineeFormData(fields),
  });
}

/** multipart/form-data — never JSON. */
export function updateNominee(id: string, fields: Partial<NomineeFormFields>) {
  return apiClient<Nominee>(`/api/v1/nominees/${id}`, {
    method: "PATCH",
    formData: toNomineeFormData(fields),
  });
}

export function deleteNominees(ids: string[]) {
  return apiClient<void>("/api/v1/nominees", {
    method: "DELETE",
    body: { ids },
  });
}

/** Public vote count for a nominee. */
export function getNomineeVotes(id: string) {
  return apiClient<NomineeVotes>(`/api/v1/nominees/${id}/votes`, {
    public: true,
  });
}

/**
 * Public nominee profile — backend to be added:
 * GET /api/v1/public/nominees/:id
 */
export function getPublicNominee(id: string) {
  return apiClient<PublicNominee & { category?: { id: string; name: string }; election?: { id: string; title: string; slug: string } }>(
    `/api/v1/public/nominees/${id}`,
    { public: true }
  );
}
