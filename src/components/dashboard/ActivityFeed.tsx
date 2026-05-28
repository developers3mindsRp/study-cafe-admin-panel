import { Link } from "react-router";
import type { ActivityItem, ActivityStatus, ActivityType } from "../../types/dashboard";

interface ActivityFeedProps {
  items?: ActivityItem[];
  loading?: boolean;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function relativeTime(isoString: string): string {
  const diff = Date.now() - new Date(isoString).getTime();
  const minutes = Math.floor(diff / 60_000);
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

const TYPE_META: Record<ActivityType, { label: string; dot: string; bg: string; text: string }> = {
  enrollment: {
    label: "Enrollment",
    dot: "bg-brand-500",
    bg: "bg-brand-50 dark:bg-brand-500/10",
    text: "text-brand-600 dark:text-brand-400",
  },
  order: {
    label: "Order",
    dot: "bg-blue-light-500",
    bg: "bg-blue-light-50 dark:bg-blue-light-500/10",
    text: "text-blue-light-600 dark:text-blue-light-400",
  },
  article: {
    label: "Article",
    dot: "bg-orange-500",
    bg: "bg-orange-50 dark:bg-orange-500/10",
    text: "text-orange-600 dark:text-orange-400",
  },
  membership: {
    label: "Membership",
    dot: "bg-yellow-500",
    bg: "bg-yellow-50 dark:bg-yellow-500/10",
    text: "text-yellow-600 dark:text-yellow-400",
  },
  course: {
    label: "Course",
    dot: "bg-violet-500",
    bg: "bg-violet-50 dark:bg-violet-500/10",
    text: "text-violet-600 dark:text-violet-400",
  },
};

const STATUS_STYLES: Record<ActivityStatus, string> = {
  success: "bg-success-50 text-success-700 dark:bg-success-500/15 dark:text-success-400",
  pending: "bg-warning-50 text-warning-700 dark:bg-warning-500/15 dark:text-orange-400",
  failed: "bg-error-50 text-error-700 dark:bg-error-500/15 dark:text-error-400",
};

// ---------------------------------------------------------------------------
// Skeleton
// ---------------------------------------------------------------------------

function FeedSkeleton() {
  return (
    <ul className="animate-pulse divide-y divide-gray-100 dark:divide-gray-800">
      {Array.from({ length: 6 }).map((_, i) => (
        <li key={i} className="flex items-start gap-3 py-3.5">
          <div className="mt-0.5 h-8 w-8 shrink-0 rounded-lg bg-gray-200 dark:bg-gray-700" />
          <div className="flex-1 space-y-2">
            <div className="h-3.5 w-4/5 rounded-md bg-gray-200 dark:bg-gray-700" />
            <div className="h-3 w-1/3 rounded-md bg-gray-200 dark:bg-gray-700" />
          </div>
          <div className="h-3 w-10 shrink-0 rounded-md bg-gray-200 dark:bg-gray-700" />
        </li>
      ))}
    </ul>
  );
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function ActivityFeed({ items, loading = false }: ActivityFeedProps) {
  return (
    <div className="flex h-full flex-col rounded-2xl border border-gray-200 bg-white shadow-theme-xs dark:border-gray-800 dark:bg-white/[0.03]">
      {/* Header */}
      <div className="flex items-center justify-between px-5 pb-0 pt-5 sm:px-6 sm:pt-6">
        <div>
          <h3 className="text-base font-semibold text-gray-900 dark:text-white">
            Recent Activity
          </h3>
          <p className="mt-0.5 text-sm text-gray-500 dark:text-gray-400">
            Latest events across your platform
          </p>
        </div>
      </div>

      {/* Feed */}
      <div className="flex-1 overflow-y-auto px-5 sm:px-6">
        {loading ? (
          <FeedSkeleton />
        ) : (
          <ul className="divide-y divide-gray-100 dark:divide-gray-800">
            {(items ?? []).map((item) => {
              const type = TYPE_META[item.type] ?? TYPE_META.order;
              return (
                <li key={item.id} className="flex items-start gap-3 py-3.5">
                  {/* Type icon pill */}
                  <div
                    className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-xs font-bold ${type.bg} ${type.text}`}
                  >
                    {type.label.charAt(0)}
                  </div>

                  {/* Content */}
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-gray-800 dark:text-white/90">
                      {item.title}
                    </p>
                    <div className="mt-1 flex items-center gap-2">
                      <span className="text-xs text-gray-400 dark:text-gray-500">
                        {item.meta}
                      </span>
                      <span
                        className={`inline-flex rounded-full px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${STATUS_STYLES[item.status]}`}
                      >
                        {item.status}
                      </span>
                    </div>
                  </div>

                  {/* Timestamp */}
                  <span className="shrink-0 text-xs text-gray-400 dark:text-gray-500">
                    {relativeTime(item.timestamp)}
                  </span>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      {/* Footer */}
      <div className="border-t border-gray-100 px-5 py-3 dark:border-gray-800 sm:px-6">
        <Link
          to="/orders"
          className="text-sm font-medium text-brand-500 transition-colors hover:text-brand-600 dark:text-brand-400 dark:hover:text-brand-300"
        >
          View all orders →
        </Link>
      </div>
    </div>
  );
}
