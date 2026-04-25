import axios, { type InternalAxiosRequestConfig } from "axios";
import { getStoredToken, clearStoredAuth } from "../lib/authStorage";

const baseURL =
  typeof import.meta !== "undefined" && import.meta.env?.VITE_API_BASE_URL
    ? String(import.meta.env.VITE_API_BASE_URL).replace(/\/$/, "")
    : "/api";

export const api = axios.create({
  baseURL,
  /** Slow DB / cold connections (e.g. remote MySQL); avoid false timeouts on admin lists */
  timeout: 120_000,
  headers: {
    "Content-Type": "application/json",
  },
});

/**
 * Request interceptor: add auth token from storage.
 */
api.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const token = getStoredToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

/**
 * Response interceptor: unwraps backend envelopes and handles 401s.
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
  (error) => {
    if (error.response?.status === 401 && typeof window !== "undefined") {
      clearStoredAuth();
      const redirect = encodeURIComponent(window.location.pathname + window.location.search);
      window.location.href = `/signin?redirect=${redirect}`;
    }
    return Promise.reject(error);
  }
);

export default api;
