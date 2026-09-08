import type { UserSummary } from "./types";

const AUTH_TOKEN_KEY = "ximacent_access_token";
const REFRESH_TOKEN_KEY = "ximacent_refresh_token";
const AUTH_USER_KEY = "ximacent_auth_user";

export function getAccessToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(AUTH_TOKEN_KEY);
}

export function getRefreshToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(REFRESH_TOKEN_KEY);
}

export function setTokens(accessToken: string, refreshToken?: string): void {
  localStorage.setItem(AUTH_TOKEN_KEY, accessToken);
  if (refreshToken) {
    localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
  }
}

/** Persists the logged-in user's identity so the UI can show who's signed
 * in and gate role-specific screens without decoding the JWT client-side. */
export function setAuthUser(user: UserSummary): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(AUTH_USER_KEY, JSON.stringify(user));
}

export function getAuthUser(): UserSummary | null {
  if (typeof window === "undefined") return null;
  const raw = localStorage.getItem(AUTH_USER_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as UserSummary;
  } catch {
    // Corrupted/stale value — treat as logged out rather than throwing.
    localStorage.removeItem(AUTH_USER_KEY);
    return null;
  }
}

export const AUTH_CLEARED_EVENT = "ximacent:auth-cleared";

export function clearTokens(): void {
  localStorage.removeItem(AUTH_TOKEN_KEY);
  localStorage.removeItem(REFRESH_TOKEN_KEY);
  localStorage.removeItem(AUTH_USER_KEY);
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event(AUTH_CLEARED_EVENT));
  }
}

export function isAuthenticated(): boolean {
  return Boolean(getAccessToken());
}
