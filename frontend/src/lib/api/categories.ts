import { apiClient, apiClientWithQuery } from "./client";
import type { Category, CategoryResults, Pagination, PaginationQuery } from "./types";

export interface ListCategoriesParams extends PaginationQuery {
  name?: string;
  electionId?: string;
}

export interface ListCategoriesResponse {
  categories: Category[];
  pagination: Pagination;
}

export interface CreateCategoryBody {
  name: string;
  description?: string;
  displayOrder?: number;
  electionId: string;
}

export interface UpdateCategoryBody {
  name?: string;
  description?: string;
  displayOrder?: number;
}

export function listCategories(params: ListCategoriesParams = {}) {
  return apiClientWithQuery<ListCategoriesResponse>("/api/v1/categories", params);
}

export function getCategory(id: string) {
  return apiClient<Category>(`/api/v1/categories/${id}`);
}

export function createCategory(body: CreateCategoryBody) {
  return apiClient<Category>("/api/v1/categories", {
    method: "POST",
    body,
  });
}

export function updateCategory(id: string, body: UpdateCategoryBody) {
  return apiClient<Category>(`/api/v1/categories/${id}`, {
    method: "PATCH",
    body,
  });
}

export function deleteCategories(ids: string[]) {
  return apiClient<void>("/api/v1/categories", {
    method: "DELETE",
    body: { ids },
  });
}

/** Public category leaderboard — no auth. */
export function getCategoryResults(id: string) {
  return apiClient<CategoryResults>(`/api/v1/categories/${id}/results`, {
    public: true,
  });
}
