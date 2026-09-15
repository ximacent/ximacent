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

export interface RegisterBody {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  phone: string;
  role: "voter" | "organizer";
}

export interface VerifyEmailBody {
  email: string;
  otp: string;
}

export interface VerifyPhoneBody {
  otp: string;
}

export interface RequestPhoneChangeBody {
  newPhone: string;
}

export interface ConfirmPhoneChangeBody {
  otp: string;
}

export interface ChangePasswordBody {
  currentPassword: string;
  newPassword: string;
}

export async function register(body: RegisterBody) {
  const data = await apiClient<LoginResponse>("/api/v1/auth/register", {
    method: "POST",
    body,
    public: true,
  });
  setTokens(data.accessToken, data.refreshToken);
  setAuthUser(data.user);
  return data;
}

export function verifyEmail(body: VerifyEmailBody) {
  return apiClient<UserSummary>("/api/v1/auth/verify-email", {
    method: "POST",
    body,
    public: true,
  });
}

export function resendEmailVerification(email: string) {
  return apiClient<void>("/api/v1/auth/resend-verification", {
    method: "POST",
    body: { email },
    public: true,
  });
}

export function requestPhoneVerification() {
  return apiClient<UserSummary>("/api/v1/auth/request-phone-verification", {
    method: "POST",
  });
}

export function verifyPhone(body: VerifyPhoneBody) {
  return apiClient<UserSummary>("/api/v1/auth/verify-phone", {
    method: "POST",
    body,
  });
}

export function requestPhoneChange(body: RequestPhoneChangeBody) {
  return apiClient<UserSummary>("/api/v1/auth/request-phone-change", {
    method: "POST",
    body,
  });
}

export function confirmPhoneChange(body: ConfirmPhoneChangeBody) {
  return apiClient<UserSummary>("/api/v1/auth/confirm-phone-change", {
    method: "POST",
    body,
  });
}

export function changePassword(body: ChangePasswordBody) {
  return apiClient<void>("/api/v1/auth/change-password", {
    method: "POST",
    body,
  });
}

export function requestPasswordReset(email: string) {
  return apiClient<void>("/api/v1/auth/request-password-reset", {
    method: "POST",
    body: { email },
    public: true,
  });
}

export function resetPassword(body: { email: string; otp: string; newPassword: string }) {
  return apiClient<void>("/api/v1/auth/reset-password", {
    method: "POST",
    body,
    public: true,
  });
}

export function getUser(id: string) {
  return apiClient<UserSummary>(`/api/v1/users/${id}`);
}

export function updateUser(id: string, body: Partial<Pick<UserSummary, "firstName" | "lastName" | "phone">>) {
  return apiClient<UserSummary>(`/api/v1/users/${id}`, {
    method: "PATCH",
    body,
  });
}

export function changeUserRole(id: string, role: UserRole) {
  return apiClient<UserSummary>(`/api/v1/users/${id}/role`, {
    method: "PATCH",
    body: { role },
  });
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
