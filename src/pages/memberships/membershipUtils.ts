import { getWebsiteUrl } from "../../config/env";

/**
 * Public website link for a plan (/plans/<slug>), shareable even when the plan is
 * unlisted (hide_from_public). Null for inactive plans — the website shows "Plan not found".
 */
export function planWebsiteUrl(plan: { is_active?: boolean | number | null; slug?: string | null }): string | null {
  if (!plan.is_active || !plan.slug) return null;
  return `${getWebsiteUrl()}/plans/${encodeURIComponent(plan.slug)}`;
}

/**
 * Whether a membership plan should be shown as "Lifetime" in the admin UI.
 * Handles MySQL booleans as 0/1, string values, and legacy rows that used a long
 * duration_days placeholder (e.g. 3650) without is_lifetime set in the DB.
 */
export function planIsLifetime(plan: {
  is_lifetime?: boolean | number | string | null | undefined;
  duration_days?: number | string | null | undefined;
  name?: string | null;
  slug?: string | null;
}): boolean {
  const v = plan.is_lifetime;
  if (v === true || v === 1) return true;
  if (typeof v === "string") {
    const s = v.trim().toLowerCase();
    if (s === "1" || s === "true" || s === "yes") return true;
  }

  const days = Number(plan.duration_days);
  if (!Number.isFinite(days) || days < 3650) return false;
  const label = `${plan.name ?? ""} ${plan.slug ?? ""}`.toLowerCase();
  if (label.includes("lifetime")) return true;

  return false;
}
