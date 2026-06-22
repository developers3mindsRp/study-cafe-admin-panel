import { normalizeAdminSeoPath } from "./slug";

const ARTICLE_BLOG_PATH_RE = /^\/blogs\/.+$/i;
const COURSE_DETAIL_PATH_RE = /^\/course\/.+$/i;
const ARTICLE_HTML_PATH_RE = /^\/(.+)\.html$/i;

/** Paths managed from Articles or Courses edit screens — not SEO Metadata. */
export function isModuleManagedSeoPath(pageSlug: string): boolean {
  const key = normalizeAdminSeoPath(pageSlug);
  if (!key) return false;
  return (
    ARTICLE_BLOG_PATH_RE.test(key)
    || COURSE_DETAIL_PATH_RE.test(key)
    || ARTICLE_HTML_PATH_RE.test(key)
  );
}
