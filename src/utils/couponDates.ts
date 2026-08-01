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

/** Today's calendar day in IST — the reference point for coupon validity. */
export function todayIstYmd(): string {
  return new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Kolkata" });
}

/**
 * Effective state of a coupon, as opposed to its stored status.
 * A `publish` coupon whose expiry has passed is no longer usable at checkout —
 * this surfaces that instead of showing it as plainly "Published".
 * Compared on the same YMD values the Validity column renders, so the badge can
 * never contradict the dates shown next to it.
 */
export type CouponState = "active" | "expired" | "scheduled" | "draft";

export function couponState(coupon: {
  status?: string | null;
  start_date?: string | null;
  expire_date?: string | null;
}): CouponState {
  if (coupon.status !== "publish") return "draft";
  const today = todayIstYmd();
  const start = couponStartYmd(coupon.start_date);
  const expire = couponExpireYmd(coupon.expire_date);
  if (expire && today > expire) return "expired";
  if (start && today < start) return "scheduled";
  return "active";
}

export const COUPON_STATE_LABELS: Record<CouponState, string> = {
  active: "Active",
  expired: "Expired",
  scheduled: "Scheduled",
  draft: "Draft",
};

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
