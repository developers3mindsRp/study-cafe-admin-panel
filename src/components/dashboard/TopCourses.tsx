import { Link } from "react-router";
import { ArrowDownIcon, ArrowUpIcon } from "../../icons";
import type { TopCourse } from "../../types/dashboard";

interface TopCoursesProps {
  courses?: TopCourse[];
  loading?: boolean;
}

function formatRevenue(amount: number): string {
  if (amount >= 100_000) {
    return `₹${(amount / 100_000).toFixed(1)}L`;
  }
  if (amount >= 1_000) {
    return `₹${(amount / 1_000).toFixed(1)}K`;
  }
  return `₹${amount}`;
}

const CATEGORY_COLORS: Record<string, string> = {
  GST: "bg-orange-50 text-orange-600 dark:bg-orange-500/10 dark:text-orange-400",
  CA: "bg-brand-50 text-brand-600 dark:bg-brand-500/10 dark:text-brand-400",
  Accounting: "bg-violet-50 text-violet-600 dark:bg-violet-500/10 dark:text-violet-400",
  "Income Tax": "bg-blue-light-50 text-blue-light-600 dark:bg-blue-light-500/10 dark:text-blue-light-400",
  CMA: "bg-success-50 text-success-600 dark:bg-success-500/10 dark:text-success-400",
};

function categoryColor(cat: string): string {
  return CATEGORY_COLORS[cat] ?? "bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300";
}

// ---------------------------------------------------------------------------
// Skeleton
// ---------------------------------------------------------------------------

function CoursesSkeleton() {
  return (
    <ul className="animate-pulse divide-y divide-gray-100 dark:divide-gray-800">
      {Array.from({ length: 5 }).map((_, i) => (
        <li key={i} className="flex items-center gap-3 py-3.5">
          <div className="h-7 w-7 shrink-0 rounded-full bg-gray-200 dark:bg-gray-700" />
          <div className="flex-1 space-y-1.5">
            <div className="h-3.5 w-4/5 rounded-md bg-gray-200 dark:bg-gray-700" />
            <div className="h-3 w-1/3 rounded-md bg-gray-200 dark:bg-gray-700" />
          </div>
          <div className="space-y-1 text-right">
            <div className="h-3.5 w-12 rounded-md bg-gray-200 dark:bg-gray-700" />
            <div className="h-3 w-10 rounded-md bg-gray-200 dark:bg-gray-700" />
          </div>
        </li>
      ))}
    </ul>
  );
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function TopCourses({ courses, loading = false }: TopCoursesProps) {
  return (
    <div className="flex h-full flex-col rounded-2xl border border-gray-200 bg-white shadow-theme-xs dark:border-gray-800 dark:bg-white/[0.03]">
      {/* Header */}
      <div className="flex items-center justify-between px-5 pb-0 pt-5 sm:px-6 sm:pt-6">
        <div>
          <h3 className="text-base font-semibold text-gray-900 dark:text-white">
            Top Courses
          </h3>
          <p className="mt-0.5 text-sm text-gray-500 dark:text-gray-400">
            By enrollments this period
          </p>
        </div>
      </div>

      {/* Column headers */}
      <div className="mt-4 flex items-center gap-3 border-b border-gray-100 px-5 pb-2 dark:border-gray-800 sm:px-6">
        <span className="w-7 shrink-0" />
        <span className="flex-1 text-xs font-medium uppercase tracking-wide text-gray-400 dark:text-gray-500">
          Course
        </span>
        <span className="w-16 shrink-0 text-right text-xs font-medium uppercase tracking-wide text-gray-400 dark:text-gray-500">
          Enrolled
        </span>
        <span className="w-16 shrink-0 text-right text-xs font-medium uppercase tracking-wide text-gray-400 dark:text-gray-500">
          Revenue
        </span>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto px-5 sm:px-6">
        {loading ? (
          <CoursesSkeleton />
        ) : (
          <ul className="divide-y divide-gray-100 dark:divide-gray-800">
            {(courses ?? []).map((course, index) => {
              const isUp = course.trend >= 0;
              return (
                <li key={course.id} className="flex items-center gap-3 py-3.5">
                  {/* Rank */}
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-gray-100 text-xs font-bold text-gray-600 dark:bg-gray-800 dark:text-gray-300">
                    {index + 1}
                  </span>

                  {/* Title + category */}
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-gray-800 dark:text-white/90">
                      {course.title}
                    </p>
                    <div className="mt-1 flex items-center gap-1.5">
                      <span
                        className={`rounded-full px-1.5 py-0.5 text-[10px] font-semibold ${categoryColor(course.category)}`}
                      >
                        {course.category}
                      </span>
                      {/* Trend badge */}
                      <span
                        className={[
                          "inline-flex items-center gap-0.5 text-xs font-medium",
                          isUp
                            ? "text-success-600 dark:text-success-400"
                            : "text-error-600 dark:text-error-400",
                        ].join(" ")}
                      >
                        {isUp ? (
                          <ArrowUpIcon className="size-3" />
                        ) : (
                          <ArrowDownIcon className="size-3" />
                        )}
                        {Math.abs(course.trend)}%
                      </span>
                    </div>
                  </div>

                  {/* Enrollments */}
                  <div className="w-16 shrink-0 text-right">
                    <span className="text-sm font-semibold text-gray-800 dark:text-white/90">
                      {course.enrollments.toLocaleString("en-IN")}
                    </span>
                  </div>

                  {/* Revenue */}
                  <div className="w-16 shrink-0 text-right">
                    <span className="text-sm font-semibold text-gray-800 dark:text-white/90">
                      {formatRevenue(course.revenue)}
                    </span>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      {/* Footer */}
      <div className="border-t border-gray-100 px-5 py-3 dark:border-gray-800 sm:px-6">
        <Link
          to="/courses"
          className="text-sm font-medium text-brand-500 transition-colors hover:text-brand-600 dark:text-brand-400 dark:hover:text-brand-300"
        >
          View all courses →
        </Link>
      </div>
    </div>
  );
}
