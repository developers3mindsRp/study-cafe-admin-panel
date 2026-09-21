/**
 * Central date formatting utility for the admin panel.
 *
 * All datetime values from the API are IST-aware ISO strings (e.g. "2026-06-26T13:58:05+05:30").
 * All formatters here pin timeZone to "Asia/Kolkata" so the displayed time matches
 * the database wall-clock value regardless of the browser's local timezone.
 */

const IST = "Asia/Kolkata";

/**
 * Format a datetime string as "26/06/2026, 01:58:05 PM" (date + time, IST).
 * Use for order lists, payment records, audit logs — anywhere you need both date and time.
 */
export function formatDateTime(iso?: string | null): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleString("en-IN", {
    timeZone: IST,
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

/**
 * Format a datetime string as "26 Jun 2026, 01:58 PM" (human-readable, IST).
 * Use for order detail views and other places that need a longer label.
 */
export function formatDateTimeLong(iso?: string | null): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleString("en-IN", {
    timeZone: IST,
    day: "2-digit",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/**
 * Format a datetime string as a date-only label "26 Jun 2026" (IST).
 * Use for tables that only show date (no time needed).
 */
export function formatDate(iso?: string | null): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("en-IN", {
    timeZone: IST,
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

/**
 * Format a datetime string as a short date "26/06/2026" (IST).
 * Use for compact table cells.
 */
export function formatDateShort(iso?: string | null): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("en-IN", {
    timeZone: IST,
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

/**
 * Return the YYYY-MM-DD calendar day in IST for a given ISO string.
 * Use for date-based comparisons and filter ranges.
 */
export function istCalendarYmd(iso?: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleDateString("en-CA", { timeZone: IST });
}

/**
 * Format a datetime string as "2026-09-21 17:29" (IST) for spreadsheet exports.
 * Sortable, unambiguous, and matches the IST wall-clock shown in the admin tables —
 * the raw API value is an instant (UTC-suffixed), so it must not be written as-is.
 * Returns "" (not "—") because export cells are blank when a value is missing.
 */
export function formatDateTimeExport(iso?: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const date = d.toLocaleDateString("en-CA", { timeZone: IST });
  const time = d.toLocaleTimeString("en-GB", {
    timeZone: IST,
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  });
  return `${date} ${time}`;
}
