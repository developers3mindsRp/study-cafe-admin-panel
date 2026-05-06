/**
 * Decode a slug for display in the UI (e.g. Hindi/Unicode stored or sent as percent-encoded).
 * Use this whenever showing a slug to the user so they see readable text, not %e0%a4%...
 */
export function decodeSlugForDisplay(slug: string | null | undefined): string {
  if (slug == null || slug === "") return "";
  try {
    return decodeURIComponent(slug);
  } catch {
    return slug;
  }
}

const MAX_SLUG_LEN = 120;

/**
 * SEO-friendly URL segment: lowercase, hyphen-separated, no leading/trailing dashes.
 * Strips accents (café → cafe), collapses punctuation and whitespace to hyphens.
 */
export function slugifyForSeo(input: string): string {
  if (input == null) return "";
  const trimmed = input.trim();
  if (!trimmed) return "";

  const base = trimmed
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^\p{L}\p{N}]+/gu, "-")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "");

  return base.length <= MAX_SLUG_LEN ? base : base.slice(0, MAX_SLUG_LEN).replace(/-+$/g, "");
}

/**
 * Normalizes a static site path: `/About Us` → `/about-us`, preserves `/` root.
 * Slugifies each path segment; keeps leading slash.
 */
export function slugifyUrlPath(input: string): string {
  if (input == null) return "";
  const t = input.trim();
  if (!t) return "";
  if (t === "/") return "/";

  const segments = t.split("/").filter((s) => s.length > 0);
  if (segments.length === 0) return "/";

  const slugged = segments
    .map((seg) => {
      try {
        return slugifyForSeo(decodeURIComponent(seg));
      } catch {
        return slugifyForSeo(seg);
      }
    })
    .filter(Boolean);

  return slugged.length > 0 ? `/${slugged.join("/")}` : "/";
}

/**
 * Keep auto-updating the slug while the user types the title/name only if the slug still
 * matches what we would derive from the **previous** source text. Otherwise the first
 * character would "lock" the slug (e.g. title "test" stuck at slug "t").
 */
export function shouldResyncSlugFromSource(
  currentSlug: string,
  previousSource: string,
  slugFromPreviousSource: (prev: string) => string,
): boolean {
  if (!currentSlug.trim()) return true;
  return currentSlug === slugFromPreviousSource(previousSource);
}
