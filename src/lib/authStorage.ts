import type { PersistedAuth } from "../types/auth";
import { AUTH_STORAGE_KEY } from "../types/auth";
import { accessTokenExpiryMs } from "./accessTokenExpiry";

export function getStoredAuth(): PersistedAuth | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(AUTH_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as PersistedAuth;
    if (!parsed?.token || !parsed?.user) return null;
    // Access JWT may be past exp while refresh token remains valid; do not wipe session in that case.
    if (parsed.expiresAt != null && Date.now() > parsed.expiresAt && !parsed.refreshToken) {
      clearStoredAuth();
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

export function getStoredToken(): string | null {
  return getStoredAuth()?.token ?? null;
}

export function getStoredRefreshToken(): string | null {
  return getStoredAuth()?.refreshToken ?? null;
}

export function setStoredAuth(auth: PersistedAuth): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(auth));
}

export function clearStoredAuth(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(AUTH_STORAGE_KEY);
}

/**
 * After `/auth/refresh`, persist new access JWT while keeping user + refresh token.
 */
export function updateStoredAccessToken(accessToken: string): void {
  if (typeof window === "undefined") return;
  try {
    const raw = localStorage.getItem(AUTH_STORAGE_KEY);
    if (!raw) return;
    const parsed = JSON.parse(raw) as PersistedAuth;
    if (!parsed?.user) return;
    const next: PersistedAuth = {
      ...parsed,
      token: accessToken,
      expiresAt: accessTokenExpiryMs(accessToken) ?? parsed.expiresAt,
    };
    localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(next));
  } catch {
    /* ignore */
  }
}
