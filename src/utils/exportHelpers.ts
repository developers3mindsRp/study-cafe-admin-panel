/** Shared cell formatters and error reporting for export column accessors. */
export function exportStr(v: unknown): string {
  if (v == null) return "";
  if (typeof v === "number") return Number.isFinite(v) ? String(v) : "";
  return String(v);
}

export function exportNum(v: string | number | null | undefined): number | string {
  if (v == null || v === "") return "";
  const n = Number(v);
  return Number.isFinite(n) ? n : "";
}

/** Yes / No for flag columns; blank when the field is absent. */
export function exportBool(v: boolean | null | undefined): string {
  if (v == null) return "";
  return v ? "Yes" : "No";
}

/** Unwraps the API/Error message every export handler surfaces on failure. */
export function exportErrorMessage(err: unknown, fallback = "Export failed"): string {
  if (err && typeof err === "object" && "response" in err) {
    const msg = (err as { response?: { data?: { message?: string; error?: string } } }).response
      ?.data;
    if (msg?.message || msg?.error) return msg.message ?? msg.error ?? fallback;
  }
  if (err instanceof Error && err.message) return err.message;
  return fallback;
}
