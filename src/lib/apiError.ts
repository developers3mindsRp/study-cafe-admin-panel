import type { AxiosError } from "axios";

type ApiErrorBody = {
  error?: string;
  message?: string;
};

/**
 * Readable message from a failed axios/API call (envelope `{ error }` or `{ message }`).
 */
export function getApiErrorMessage(err: unknown, fallback: string): string {
  if (typeof err !== "object" || err === null) return fallback;
  const ax = err as AxiosError<ApiErrorBody>;
  const data = ax.response?.data;
  if (typeof data === "object" && data !== null) {
    if (typeof data.error === "string" && data.error.trim()) return data.error.trim();
    if (typeof data.message === "string" && data.message.trim()) return data.message.trim();
  }
  if (err instanceof Error && err.message.trim()) return err.message.trim();
  return fallback;
}
