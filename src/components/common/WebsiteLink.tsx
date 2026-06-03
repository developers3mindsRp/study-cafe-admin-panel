/**
 * Reusable "View on Website" / "View" action buttons for admin list tables.
 *
 * - WebsiteViewLink  : opens the LIVE website URL in a new tab (green, external-link icon)
 * - AdminViewLink    : opens the ADMIN view/preview route (gray, eye icon — same as other tables)
 *
 * Usage:
 *   isPublished
 *     ? <WebsiteViewLink href={`https://studycafe.in/course/${slug}`} />
 *     : <AdminViewLink to={`/courses/${id}`} />
 */

import { Link } from "react-router";
import { EyeIcon } from "../../icons";

// ── Shared base class — whitespace-nowrap keeps icon + text on ONE line always ─
const BASE =
  "inline-flex items-center justify-center gap-1.5 whitespace-nowrap rounded-lg px-2.5 py-2 text-sm transition";

const WEBSITE_CLS =
  `${BASE} text-success-600 hover:bg-success-50 hover:text-success-700 dark:text-success-400 dark:hover:bg-success-500/10`;

const ADMIN_CLS =
  `${BASE} text-gray-600 hover:bg-gray-100 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-white`;

// ── External-link icon — simple arrow-out-of-box (24px viewBox, clean strokes) ─
function ExternalLinkIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className="size-4 shrink-0"
      aria-hidden="true"
    >
      {/* arrow pointing up-right */}
      <line x1="7" y1="17" x2="17" y2="7" />
      <polyline points="7 7 17 7 17 17" />
    </svg>
  );
}

// ── Components ───────────────────────────────────────────────────────────────

/** Opens the live website URL in a new tab. Shown for published items. */
export function WebsiteViewLink({
  href,
  label = "View",
  title = "View on Website",
}: {
  href: string;
  label?: string;
  title?: string;
}) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className={WEBSITE_CLS}
      title={title}
    >
      <ExternalLinkIcon />
      {label}
    </a>
  );
}

/** Opens the admin view/preview page (same-app navigation). Shown for drafts. */
export function AdminViewLink({
  to,
  label = "View",
  title = "View",
}: {
  to: string;
  label?: string;
  title?: string;
}) {
  return (
    <Link to={to} className={ADMIN_CLS} title={title}>
      <EyeIcon className="size-4 shrink-0 fill-current" />
      {label}
    </Link>
  );
}
