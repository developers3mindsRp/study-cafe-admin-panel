import type { Course } from "../api/courses";
import type { CsvColumn } from "./exportToCsv";
import { exportBool, exportNum, exportStr } from "./exportHelpers";

const str = exportStr;
const num = exportNum;
const bool = exportBool;

function categoryNames(r: Course): string {
  if (r.categories?.length) return r.categories.map((c) => c.name).join(" | ");
  return "";
}

function categoryIds(r: Course): string {
  if (r.course_cat_ids?.length) return r.course_cat_ids.join(" | ");
  if (r.categories?.length) return r.categories.map((c) => c.id).join(" | ");
  return "";
}

/** Co-authors beyond the primary author, as "Name (Role)". */
function authorNames(r: Course): string {
  if (!r.authors?.length) return "";
  return r.authors
    .map((a) => (a.role ? `${a.name ?? ""} (${a.role})` : (a.name ?? "")))
    .filter(Boolean)
    .join(" | ");
}

function validityLabel(r: Course): string {
  if (r.validity === "lifetime" || r.is_lifetime) return "Lifetime";
  if (r.validity === "1year") return "1 year";
  return "";
}

/**
 * Admin courses list export — every field the list API returns.
 * Rich-text and JSON columns are exported raw; the CSV writer quotes them.
 */
export const COURSE_EXPORT_COLUMNS: CsvColumn<Course>[] = [
  { header: "ID", accessor: (r) => r.id },
  { header: "Title", accessor: (r) => str(r.title) },
  { header: "Short title", accessor: (r) => str(r.short_title) },
  { header: "Slug", accessor: (r) => str(r.slug) },
  { header: "Status", accessor: (r) => str(r.status) },
  { header: "Published", accessor: (r) => bool(r.is_published) },
  { header: "Hidden from public", accessor: (r) => bool(r.hide_from_public) },
  { header: "Price", accessor: (r) => num(r.price) },
  { header: "Sale price", accessor: (r) => num(r.sale_price) },
  { header: "Taxable", accessor: (r) => bool(r.taxable) },
  { header: "Affiliate commission (%)", accessor: (r) => num(r.affiliate_commission) },
  { header: "Gateway", accessor: (r) => str(r.gateway) },
  { header: "Course type", accessor: (r) => str(r.course_type) },
  { header: "Language", accessor: (r) => str(r.language) },
  { header: "Validity", accessor: (r) => validityLabel(r) },
  { header: "Certificate enabled", accessor: (r) => bool(r.certificate_enabled) },
  { header: "Categories", accessor: (r) => categoryNames(r) },
  { header: "Category IDs", accessor: (r) => categoryIds(r) },
  { header: "Start date", accessor: (r) => str(r.start_date) },
  { header: "End date", accessor: (r) => str(r.end_date) },
  { header: "Enrolled count", accessor: (r) => num(r.enrolled_count) },
  { header: "Rating", accessor: (r) => num(r.ratings) },
  { header: "Rating users", accessor: (r) => num(r.rating_users) },
  { header: "Author user ID", accessor: (r) => num(r.author_user_id) },
  { header: "Author name", accessor: (r) => str(r.author_name) },
  { header: "Author role", accessor: (r) => str(r.author_role) },
  { header: "Author bio", accessor: (r) => str(r.author_bio) },
  { header: "Author image", accessor: (r) => str(r.author_image) },
  { header: "Authors", accessor: (r) => authorNames(r) },
  { header: "Brief description", accessor: (r) => str(r.brief_description) },
  { header: "Description", accessor: (r) => str(r.description) },
  { header: "Duration", accessor: (r) => str(r.duration) },
  { header: "Curriculum", accessor: (r) => str(r.curriculum) },
  { header: "Learn outcomes", accessor: (r) => str(r.learn_outcomes) },
  { header: "Requirements", accessor: (r) => str(r.requirements) },
  { header: "Terms & conditions", accessor: (r) => str(r.terms_conditions) },
  { header: "Course includes", accessor: (r) => str(r.course_includes) },
  { header: "Includes info", accessor: (r) => str(r.includes_info) },
  { header: "Certifications", accessor: (r) => str(r.certifications) },
  { header: "FAQs", accessor: (r) => str(r.faqs) },
  { header: "Feedback", accessor: (r) => str(r.feedback) },
  { header: "Detail sections", accessor: (r) => str(r.detail_sections) },
  { header: "Thumbnail URL", accessor: (r) => str(r.thumbnail_url) },
  { header: "YouTube URL", accessor: (r) => str(r.youtube_url) },
  { header: "Keywords", accessor: (r) => str(r.keywords) },
  { header: "Meta title", accessor: (r) => str(r.meta_title) },
  { header: "Meta description", accessor: (r) => str(r.meta_description) },
  { header: "Meta keywords", accessor: (r) => str(r.meta_keywords) },
  { header: "Canonical URL", accessor: (r) => str(r.canonical_url) },
  { header: "Robots", accessor: (r) => str(r.robots) },
  { header: "OG title", accessor: (r) => str(r.og_title) },
  { header: "OG description", accessor: (r) => str(r.og_description) },
  { header: "OG image URL", accessor: (r) => str(r.og_image_url) },
  { header: "Created at", accessor: (r) => str(r.created_at) },
  { header: "Updated at", accessor: (r) => str(r.updated_at) },
];
