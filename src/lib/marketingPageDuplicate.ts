import type { MarketingPage, MarketingPageMeta } from "../api/marketingPages";
import type { MarketingPageFormData } from "../pages/marketing/MarketingPageForm";

/**
 * Deep copy, so the nested content of the copy (learning bullets, feature cards, bonus
 * items, testimonials, trainer) never shares references with the row fetched to seed it.
 * `meta` is plain JSON on the wire, so a round-trip is a faithful clone.
 */
function cloneMeta(meta: MarketingPageMeta | null | undefined): MarketingPageMeta {
  if (!meta || typeof meta !== "object") return {};
  try {
    return JSON.parse(JSON.stringify(meta)) as MarketingPageMeta;
  } catch {
    return {};
  }
}

/**
 * Seed the create form from an existing marketing page. The whole landing page body is
 * copied; course and slug are deliberately left blank because `marketing_pages` has a
 * unique key on `course_id` — a copy has to point at a course that has no page yet, and
 * the slug then refills from whichever course is picked. The copy starts as a draft so it
 * is reviewed before it goes live.
 */
export function buildMarketingPageDuplicateInitial(
  source: MarketingPage,
): Partial<MarketingPageFormData> {
  return {
    course_id: "",
    slug: "",
    is_published: false,
    meta: cloneMeta(source.meta),
  };
}
