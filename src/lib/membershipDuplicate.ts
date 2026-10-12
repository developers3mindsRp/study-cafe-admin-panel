import type { Plan } from "../api/plans";
import { planToFormData, type MembershipFormData } from "../pages/memberships/MembershipForm";
import { slugifyForSeo } from "./slug";

/**
 * Seed the create form from an existing membership. Price, features, linked courses and
 * categories, tier and commission are copied. The name gets a "(Copy)" suffix and the slug
 * is derived from it, so the slug keeps following the name while it is renamed (premium_plans
 * has a unique slug; the API rejects a clash on save). The copy starts Inactive so it never
 * shows on the public plans page before it is reviewed, and is never "Most Popular" — only
 * one plan holds that flag.
 *
 * Comparison-table ticks (plan_feature_availability) are not part of the form and are not
 * copied; set them on the Comparison Features page after saving.
 */
export function buildMembershipDuplicateInitial(source: Plan): Partial<MembershipFormData> {
  const name = `${source.name ?? ""} (Copy)`.trim();
  return {
    ...planToFormData(source),
    name,
    slug: slugifyForSeo(name),
    is_active: false,
    is_popular: false,
  };
}
