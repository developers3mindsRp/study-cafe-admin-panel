import { istCalendarYmd } from "./formatDate";
export { istCalendarYmd };

/**
 * Coupon start date from API (YYYY-MM-DD in UTC date prefix).
 * e.g. 2026-01-17T18:30:00.000Z → 2026-01-17 (not 18 Jan in local TZ).
 */
export function couponStartYmd(iso?: string | null): string {
  if (!iso) return "";
  const m = /^(\d{4}-\d{2}-\d{2})/.exec(String(iso).trim());
  return m ? m[1] : "";
}

/** Coupon expiry inclusive last valid day in IST. */
export function couponExpireYmd(iso?: string | null): string {
  return istCalendarYmd(iso);
}

function formatYmdEnIn(ymd: string): string {
  const [y, m, day] = ymd.split("-").map(Number);
  return new Date(y, m - 1, day).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export function formatCouponStartDate(iso?: string | null): string {
  const ymd = couponStartYmd(iso);
  return ymd ? formatYmdEnIn(ymd) : "—";
}

export function formatCouponExpireDate(iso?: string | null): string {
  const ymd = couponExpireYmd(iso);
  return ymd ? formatYmdEnIn(ymd) : "—";
}

/** Published (created_at) date in IST for listing. */
export function formatPublishedDate(iso?: string | null): string {
  const ymd = istCalendarYmd(iso);
  return ymd ? formatYmdEnIn(ymd) : "—";
}

/** Joined date — same as published (users.created_at). */
export const formatJoinedDate = formatPublishedDate;

/** True when created_at falls on an IST calendar day within [filterFrom, filterTo] (inclusive). */
export function publishedDateInRange(
  createdAt: string | null | undefined,
  filterFrom: string,
  filterTo: string,
): boolean {
  const day = istCalendarYmd(createdAt);
  if (!day) return false;
  const from = filterFrom || "0000-01-01";
  const to = filterTo || "9999-12-31";
  return day >= from && day <= to;
}
