import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import axios from "axios";
import { authApi } from "../api/auth";
import { ensureValidAccessToken } from "../api/axios";
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
        refreshToken: res.refreshToken,
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
    let cancelled = false;
    const stored = getStoredAuth();
    if (!stored) {
      setIsInitialized(true);
      setIsLoading(false);
      return;
    }
    setToken(stored.token);

    void (async () => {
      try {
        const accessToken = (await ensureValidAccessToken()) ?? stored.token;
        if (cancelled) return;
        setToken(accessToken);

        const freshUser = await authApi.getMe();
        if (cancelled) return;

        const user = {
          ...freshUser,
          id: String(freshUser.id),
          permissions: freshUser.permissions ?? [],
        };
        const latest = getStoredAuth();
        const activeToken = latest?.token ?? accessToken;
        const jwtExpMs = accessTokenExpiryMs(activeToken);
        setStoredAuth({
          token: activeToken,
          user,
          refreshToken: latest?.refreshToken ?? stored.refreshToken,
          expiresAt: jwtExpMs ?? latest?.expiresAt ?? stored.expiresAt,
        });
        setUser(user);
      } catch (err: unknown) {
        if (cancelled) return;
        if (axios.isAxiosError(err) && err.response?.status === 401) {
          clearStoredAuth();
          setToken(null);
          setUser(null);
          return;
        }
        setUser(stored.user);
      } finally {
        if (!cancelled) {
          setIsInitialized(true);
          setIsLoading(false);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  /** Keep access JWT fresh while the tab is open (idle admin sessions). */
  useEffect(() => {
    if (!token) return;

    const refreshIfNeeded = () => {
      void ensureValidAccessToken().then((next) => {
        if (next) setToken(next);
      });
    };

    const interval = window.setInterval(refreshIfNeeded, 60_000);
    const onVisible = () => {
      if (document.visibilityState === "visible") refreshIfNeeded();
    };
    document.addEventListener("visibilitychange", onVisible);

    return () => {
      window.clearInterval(interval);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [token]);

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
