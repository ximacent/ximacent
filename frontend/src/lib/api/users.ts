import { apiClient, apiClientWithQuery } from "./client";
import type { LoginResponse, Pagination, PaginationQuery, UserRole, UserSummary } from "./types";
import { setTokens, setAuthUser, clearTokens } from "./auth-storage";

export interface ListUsersParams extends PaginationQuery {
  search?: string;
  phone?: string;
  role?: UserRole;
  isVerified?: boolean;
}

export interface ListUsersResponse {
  users: UserSummary[];
  pagination: Pagination;
}

export interface CreateUserBody {
  firstName: string;
  lastName: string;
  email: string;
  /** Plaintext password — backend field is poorly named `passwordHash`. */
  passwordHash: string;
  phone: string;
  role: UserRole;
}

export interface LoginBody {
  email: string;
  password: string;
}

export function listUsers(params: ListUsersParams = {}) {
  const { isVerified, ...rest } = params;
  return apiClientWithQuery<ListUsersResponse>("/api/v1/users", {
    ...rest,
    isVerified:
      isVerified === undefined ? undefined : isVerified ? "true" : "false",
  });
}

export function createUser(body: CreateUserBody) {
  return apiClient<UserSummary>("/api/v1/users", {
    method: "POST",
    body,
  });
}

export function deleteUsers(ids: string[]) {
  return apiClient<void>("/api/v1/users", {
    method: "DELETE",
    body: { ids },
  });
}

export async function login(body: LoginBody) {
  const data = await apiClient<LoginResponse>("/api/v1/auth/login", {
    method: "POST",
    body,
    public: true,
  });
  setTokens(data.accessToken, data.refreshToken);
  setAuthUser(data.user);
  return data;
}

/** Client-side only — clears local session state. The backend has no logout
 * endpoint (JWTs are stateless); this just forgets the tokens locally. */
export function logout(): void {
  clearTokens();
}
