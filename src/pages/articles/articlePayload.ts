import type { ArticleFormData } from "./ArticleForm";

/** Split comma-separated labels (trim, drop empties). Used for API `tag_labels` (server find-or-creates Tag rows). */
export function parseCommaSeparatedLabels(raw: string): string[] {
  return raw.split(",").map((s) => s.trim()).filter(Boolean);
}

/** Maps article editor state → platform-service article write payload (snake_case). */
export function articleFormToApiPayload(formData: ArticleFormData) {
  const trimmedOg = formData.meta.ogImageUrl?.trim();
  const trimmedFeatured = formData.featuredImage?.imageUrl?.trim();
  const chipTagIds = [...new Set(
    (formData.tag_ids ?? [])
      .map((id) => Number(id))
      .filter((n) => Number.isFinite(n) && n > 0),
  )];
  // Always send both: chip-selected tag_ids AND comma-separated tag_labels.
  // The server will find-or-create labels and merge them with the id-based tags.
  const tag_labels = parseCommaSeparatedLabels(formData.tagsCommaRaw ?? "");

  return {
    title: formData.meta.title,
    slug: formData.meta.slug || undefined,
    sub_heading: formData.meta.subHeading?.trim() || null,
    meta_title: formData.meta.metaTitle?.trim() || null,
    meta_description: formData.meta.metaDesc?.trim() || null,
    meta_keywords: formData.meta.metaKeywords?.trim() || null,
    canonical_url: formData.meta.canonicalUrl?.trim() || null,
    robots: formData.meta.robots ?? null,
    og_title: formData.meta.ogTitle?.trim() || null,
    og_description: formData.meta.ogDescription?.trim() || null,
    og_image_url: trimmedOg || trimmedFeatured || null,
    excerpt: formData.meta.description || null,
    content: formData.body || null,
    thumbnail_url: trimmedFeatured || null,
    thumbnail_alt: formData.featuredImage?.alt?.trim() || null,
    thumbnail_link_url: formData.featuredImage?.linkUrl?.trim() || null,
    thumbnail_caption: formData.featuredImage?.caption?.trim() || null,
    category_ids: formData.category_ids ?? [],
    tag_ids: chipTagIds,
    tag_labels,
    article_type_ids: formData.article_type_ids ?? [],
    court_ids: formData.court_ids ?? [],
    blog_access_tier: formData.blog_access_tier,
    rel_download_url: formData.rel_download_url?.trim() || null,
    noti_no: formData.notification?.noti_no?.trim() || null,
    noti_date: formData.notification?.noti_date?.trim() || null,
    type_of_tax: formData.notification?.type_of_tax?.trim() || null,
    // Ordered sections drive the public Table of Contents + composed body.
    // sort_order follows the editor order; blank rows are dropped.
    sections: (formData.sections ?? [])
      .map((s, i) => ({ title: s.title ?? "", content: s.content ?? "", sort_order: i }))
      .filter((s) => Boolean(s.title.trim() || s.content.trim())),
  };
}
