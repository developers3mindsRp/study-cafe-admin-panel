import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { authApi } from "../api/auth";
import { accessTokenExpiryMs } from "../lib/accessTokenExpiry";
import { getStoredAuth, setStoredAuth, clearStoredAuth } from "../lib/authStorage";
import type { AdminUser, LoginCredentials, PersistedAuth } from "../types/auth";

interface AuthContextValue {
  user: AdminUser | null;
  token: string | null;
  isAuthenticated: boolean;
  isInitialized: boolean;
  isLoading: boolean;
  login: (credentials: LoginCredentials) => Promise<void>;
  logout: () => Promise<void>;
  hasPermission: (permission: string) => boolean;
  hasAnyPermission: (permissions: string[]) => boolean;
  hasRole: (role: string) => boolean;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AdminUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const isAuthenticated = Boolean(token && user);

  const login = useCallback(async (credentials: LoginCredentials) => {
    setIsLoading(true);
    try {
      const res = await authApi.login(credentials);
      const token = res.token ?? (res as { accessToken?: string }).accessToken;
      if (!token || !res.user) throw new Error("Invalid login response");
      const user = {
        ...res.user,
        id: String(res.user.id),
        permissions: res.user.permissions ?? [],
      };
      const payload: PersistedAuth = {
        token,
        user,
        expiresAt:
          accessTokenExpiryMs(token) ??
          (res.expiresIn != null ? Date.now() + res.expiresIn * 1000 : undefined),
      };
      setStoredAuth(payload);
      setToken(token);
      setUser(user);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const logout = useCallback(async () => {
    setIsLoading(true);
    try {
      await authApi.logout();
    } finally {
      clearStoredAuth();
      setToken(null);
      setUser(null);
      setIsLoading(false);
    }
  }, []);

  const hasPermission = useCallback(
    (permission: string): boolean => {
      if (!user) return false;
      if (user.role === "super_admin") return true;
      return user.permissions?.includes(permission) ?? false;
    },
    [user]
  );

  const hasAnyPermission = useCallback(
    (permissions: string[]): boolean =>
      permissions.some((p) => hasPermission(p)),
    [hasPermission]
  );

  const hasRole = useCallback(
    (role: string): boolean => {
      if (!user) return false;
      if (user.role === role) return true;
      return user.roles?.includes(role as AdminUser["role"]) ?? false;
    },
    [user]
  );

  useEffect(() => {
    const stored = getStoredAuth();
    if (!stored) {
      setIsInitialized(true);
      setIsLoading(false);
      return;
    }
    // Restore token immediately so axios interceptor can attach it
    setToken(stored.token);
    // Re-fetch fresh user + permissions from server on every app load
    authApi
      .getMe()
      .then((freshUser) => {
        const user = {
          ...freshUser,
          id: String(freshUser.id),
          permissions: freshUser.permissions ?? [],
        };
        const jwtExpMs = accessTokenExpiryMs(stored.token);
        setStoredAuth({
          token: stored.token,
          user,
          expiresAt: jwtExpMs ?? stored.expiresAt,
        });
        setUser(user);
      })
      .catch(() => {
        // Token invalid/expired — clear and force re-login
        clearStoredAuth();
        setToken(null);
        setUser(null);
      })
      .finally(() => {
        setIsInitialized(true);
        setIsLoading(false);
      });
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      token,
      isAuthenticated,
      isInitialized,
      isLoading,
      login,
      logout,
      hasPermission,
      hasAnyPermission,
      hasRole,
    }),
    [
      user,
      token,
      isAuthenticated,
      isInitialized,
      isLoading,
      login,
      logout,
      hasPermission,
      hasAnyPermission,
      hasRole,
    ]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (ctx == null) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return ctx;
}

export function useAuthOptional(): AuthContextValue | null {
  return useContext(AuthContext);
}
