import axios, { type AxiosError, type InternalAxiosRequestConfig } from "axios";
import { accessTokenExpiryMs } from "../lib/accessTokenExpiry";
import {
  clearStoredAuth,
  getStoredAuth,
  getStoredRefreshToken,
  getStoredToken,
  updateStoredAccessToken,
} from "../lib/authStorage";

/** Refresh access JWT this many ms before it expires so idle tabs stay signed in. */
const ACCESS_TOKEN_REFRESH_BUFFER_MS = 5 * 60 * 1000;

import { getApiBaseUrl } from "../config/env";

const baseURL = getApiBaseUrl();

export const api = axios.create({
  baseURL,
  /** Slow DB / cold connections (e.g. remote MySQL); avoid false timeouts on admin lists */
  timeout: 120_000,
  /**
   * Do not set a default Content-Type here. Axios merges instance headers before
   * transformRequest; if `application/json` stays set, FormData is JSON-stringified
   * (see axios defaults transformRequest) and uploads never reach multer as multipart.
   * Plain object bodies still get `application/json` from transformRequest.
   */
});

let refreshInFlight: Promise<string | null> | null = null;

function postAuthRefresh(): Promise<string | null> {
  if (refreshInFlight) return refreshInFlight;
  refreshInFlight = (async () => {
    const refresh = getStoredRefreshToken();
    if (!refresh) return null;
    try {
      const { data: envelope } = await axios.post<{
        success?: boolean;
        data?: { accessToken?: string; token?: string };
      }>(`${baseURL}/auth/refresh`, { refreshToken: refresh }, {
        headers: { "Content-Type": "application/json" },
        timeout: 30_000,
      });
      const inner =
        envelope && typeof envelope === "object" && envelope.success === true && envelope.data != null
          ? envelope.data
          : (envelope as { accessToken?: string; token?: string } | undefined);
      const accessToken = inner?.accessToken ?? inner?.token;
      if (!accessToken) return null;
      updateStoredAccessToken(accessToken);
      return accessToken;
    } catch {
      return null;
    } finally {
      refreshInFlight = null;
    }
  })();
  return refreshInFlight;
}

/**
 * Renew access JWT when missing, expired, or close to expiry. Returns null if no session.
 */
export async function ensureValidAccessToken(): Promise<string | null> {
  const stored = getStoredAuth();
  if (!stored?.token) return null;

  const expiresAt =
    stored.expiresAt ?? accessTokenExpiryMs(stored.token);
  const stillValid =
    expiresAt != null && Date.now() < expiresAt - ACCESS_TOKEN_REFRESH_BUFFER_MS;
  if (stillValid) return stored.token;

  if (!stored.refreshToken) return stored.token;

  return postAuthRefresh();
}

/**
 * Request interceptor: add auth token from storage.
 */
api.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const token = getStoredToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  if (config.data instanceof FormData) {
    config.headers.delete("Content-Type");
  }
  return config;
});

/**
 * Response interceptor: unwraps backend envelopes and handles 401s (refresh access JWT when possible).
 */
api.interceptors.response.use(
  (response) => {
    // Unwrap standard envelope: { success: true, data: ..., meta?: ... }
    if (response.data && typeof response.data === "object" && response.data.success === true && "data" in response.data) {
      if ("meta" in response.data) {
        // Flatten meta properties into root for apiFactory compatibility
        response.data = { data: response.data.data, ...response.data.meta };
      } else {
        // Standard payload unwrap
        response.data = response.data.data;
      }
    }
    return response;
  },
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };
    const status = error.response?.status;
    const url = originalRequest?.url ?? "";

    const isAuthPath =
      url.includes("/auth/login") ||
      url.includes("/auth/register") ||
      url.includes("/auth/refresh");

    if (
      status === 401 &&
      !originalRequest._retry &&
      !isAuthPath &&
      typeof window !== "undefined"
    ) {
      originalRequest._retry = true;
      const newAccess = await postAuthRefresh();
      if (newAccess) {
        if (originalRequest.headers) {
          originalRequest.headers.Authorization = `Bearer ${newAccess}`;
        }
        return api(originalRequest);
      }
      clearStoredAuth();
      const redirect = encodeURIComponent(window.location.pathname + window.location.search);
      window.location.href = `/signin?redirect=${redirect}`;
    }
    return Promise.reject(error);
  }
);

export default api;
