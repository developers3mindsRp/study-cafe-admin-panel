import type { Course } from "../api/courses";
import { decodeSlugForDisplay, slugifyForSeo } from "./slug";

const MAX_SLUG_LEN = 120;

/**
 * Slug for a duplicate: keeps the original URL segment as the base (not re-derived from a
 * renamed title) so editing the title does not auto-overwrite the slug. Appends a short
 * random segment; the API still enforces global uniqueness on save.
 */
function duplicateCourseSlug(source: Course): string {
  const fromSlug = decodeSlugForDisplay(source.slug ?? "").trim();
  const base =
    slugifyForSeo(fromSlug) ||
    slugifyForSeo(source.title ?? "") ||
    "course";
  const tag = `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
  let out = `${base}-dup-${tag}`.toLowerCase();
  if (out.length > MAX_SLUG_LEN) {
    const keep = Math.max(8, MAX_SLUG_LEN - 1 - tag.length - 5);
    out = `${base.slice(0, keep)}-d-${tag}`.toLowerCase().slice(0, MAX_SLUG_LEN).replace(/-+$/g, "");
  }
  return out;
}

/**
 * Map a fetched course into values suitable for the create form: same title/short title as
 * the source, new unique slug, draft, cleared engagement stats and canonical URL.
 */
export function buildCourseDuplicateInitial(source: Course): Course {
  return {
    ...source,
    id: 0,
    slug: duplicateCourseSlug(source),
    is_published: false,
    enrolled_count: 0,
    ratings: null,
    rating_users: 0,
    canonical_url: null,
    created_at: undefined,
    updated_at: undefined,
  };
}
