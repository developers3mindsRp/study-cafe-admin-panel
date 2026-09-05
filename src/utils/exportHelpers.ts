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

/**
 * Normalizes a stored mobile number to a single export format: `+91XXXXXXXXXX`.
 *
 * Buyer mobiles are captured from several checkout flows and admin imports, so the
 * same number can be stored as `9876543210`, `919876543210`, `+91 98765-43210` or
 * `09876543210`. Exports render them all identically.
 *
 * Numbers that don't match a recognizable Indian shape (already-international refs,
 * or plain bad data) keep their own digits rather than getting a fabricated country
 * code — an admin needs to see those as they are.
 */
export function exportPhone(v: unknown): string {
  if (v == null) return "";
  const raw = String(v).trim();
  if (!raw) return "";

  const hadPlus = raw.startsWith("+");
  let digits = raw.replace(/\D/g, "");
  if (!digits) return "";

  // Trunk/IDD prefixes only mean anything when the value wasn't already in +E.164 form.
  if (!hadPlus && digits.startsWith("00")) digits = digits.slice(2);
  else if (!hadPlus && digits.startsWith("0") && (digits.length === 11 || digits.length === 13)) {
    digits = digits.slice(1);
  }

  if (digits.length === 10) return `+91${digits}`;
  if (digits.length === 12 && digits.startsWith("91")) return `+${digits}`;
  return hadPlus ? `+${digits}` : digits;
}
