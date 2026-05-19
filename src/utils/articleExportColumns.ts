import type { ArticleRecord } from "../api/articles";
import type { ExcelColumn } from "./exportToExcel";
import { exportStr } from "./exportHelpers";

const str = exportStr;

function statusLabel(status: string): string {
  if (status === "publish" || status === "published") return "Published";
  if (status === "scheduled") return "Scheduled";
  if (status === "draft") return "Draft";
  return status || "";
}

/** Admin articles list export. */
export const ARTICLE_EXPORT_COLUMNS: ExcelColumn<ArticleRecord>[] = [
  { header: "ID", accessor: (r) => r.id },
  { header: "Title", accessor: (r) => str(r.title) },
  { header: "Slug", accessor: (r) => str(r.slug) },
  { header: "Status", accessor: (r) => statusLabel(str(r.status)) },
  { header: "Access Tier", accessor: (r) => str(r.blog_access_tier ?? "free") },
  { header: "Author", accessor: (r) => str(r.author_name) },
  { header: "Excerpt", accessor: (r) => str(r.excerpt) },
  { header: "Meta Title", accessor: (r) => str(r.meta_title) },
  { header: "Meta Description", accessor: (r) => str(r.meta_description) },
  { header: "Meta Keywords", accessor: (r) => str(r.meta_keywords) },
  { header: "Canonical URL", accessor: (r) => str(r.canonical_url) },
  { header: "Scheduled At", accessor: (r) => str(r.scheduled_publish_at) },
  { header: "Published At", accessor: (r) => str(r.published_at) },
  { header: "Created At", accessor: (r) => str(r.created_at) },
  { header: "Updated At", accessor: (r) => str(r.updated_at) },
];
