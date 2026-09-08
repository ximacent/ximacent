"use client";

import {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
} from "react";
import type { UserSummary } from "@/lib/api/types";
import {
  getAccessToken,
  getAuthUser,
  setAuthUser as persistAuthUser,
  clearTokens,
  AUTH_CLEARED_EVENT,
} from "@/lib/api/auth-storage";

interface AuthContextValue {
  user: UserSummary | null;
  isAuthenticated: boolean;
  /** True until the initial localStorage read completes — prevents a flash
   * of "logged out" UI before we've actually checked. */
  isLoading: boolean;
  setUser: (user: UserSummary) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUserState] = useState<UserSummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Runs once on mount, client-side only — localStorage isn't available
    // during SSR, so initial state can't be read synchronously up front.
    const token = getAccessToken();
    const storedUser = getAuthUser();
    if (token && storedUser) {
      setUserState(storedUser);
    }
    setIsLoading(false);
  }, []);

  useEffect(() => {
    // client.ts clears tokens on any 401 (e.g. an expired session mid-use).
    // Without this listener, React state wouldn't know until some unrelated
    // re-render — this makes the UI react to session expiry immediately.
    function handleAuthCleared() {
      setUserState(null);
    }
    window.addEventListener(AUTH_CLEARED_EVENT, handleAuthCleared);
    return () => window.removeEventListener(AUTH_CLEARED_EVENT, handleAuthCleared);
  }, []);

  const setUser = useCallback((next: UserSummary) => {
    persistAuthUser(next);
    setUserState(next);
  }, []);

  const logout = useCallback(() => {
    clearTokens();
    setUserState(null);
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: Boolean(user),
        isLoading,
        setUser,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return ctx;
}
