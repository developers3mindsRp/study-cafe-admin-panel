import {
  ArrowDownIcon,
  ArrowUpIcon,
  BoxIconLine,
  DollarLineIcon,
  GroupIcon,
  IndianRupee,
  PageIcon,
  ShootingStarIcon,
} from "../../icons";
import type { StatCardData, StatIconKey } from "../../types/dashboard";

interface StatCardProps extends StatCardData {
  loading?: boolean;
}

const iconConfig: Record<
  StatIconKey,
  { icon: React.ReactNode; bg: string; color: string }
> = {
  users: {
    icon: <GroupIcon className="size-5" />,
    bg: "bg-brand-50 dark:bg-brand-500/15",
    color: "text-brand-500 dark:text-brand-400",
  },
  courses: {
    icon: <BoxIconLine className="size-5" />,
    bg: "bg-violet-50 dark:bg-violet-500/15",
    color: "text-violet-500 dark:text-violet-400",
  },
  articles: {
    icon: <PageIcon className="size-5" />,
    bg: "bg-orange-50 dark:bg-orange-500/15",
    color: "text-orange-500 dark:text-orange-400",
  },
  revenue: {
    icon: <IndianRupee className="size-5" />,
    bg: "bg-success-50 dark:bg-success-500/15",
    color: "text-success-600 dark:text-success-500",
  },
  memberships: {
    icon: <ShootingStarIcon className="size-5" />,
    bg: "bg-yellow-50 dark:bg-yellow-500/15",
    color: "text-yellow-600 dark:text-yellow-400",
  },
  orders: {
    icon: <DollarLineIcon className="size-5" />,
    bg: "bg-blue-light-50 dark:bg-blue-light-500/15",
    color: "text-blue-light-600 dark:text-blue-light-400",
  },
};

function StatCardSkeleton() {
  return (
    <div className="animate-pulse rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] md:p-6">
      <div className="h-10 w-10 rounded-xl bg-gray-200 dark:bg-gray-700" />
      <div className="mt-5 space-y-2">
        <div className="h-3.5 w-20 rounded-md bg-gray-200 dark:bg-gray-700" />
        <div className="h-7 w-28 rounded-md bg-gray-200 dark:bg-gray-700" />
        <div className="h-5 w-16 rounded-full bg-gray-200 dark:bg-gray-700" />
      </div>
    </div>
  );
}

export default function StatCard({
  label,
  value,
  delta,
  deltaLabel,
  iconKey,
  loading = false,
}: StatCardProps) {
  if (loading) return <StatCardSkeleton />;

  const { icon, bg, color } = iconConfig[iconKey] ?? iconConfig.orders;
  const isUp = delta >= 0;

  return (
    <div className="group rounded-2xl border border-gray-200 bg-white p-5 shadow-theme-xs transition-shadow duration-200 hover:shadow-md dark:border-gray-800 dark:bg-white/[0.03] md:p-6">
      {/* Icon */}
      <div
        className={`flex h-10 w-10 items-center justify-center rounded-xl ${bg} ${color}`}
      >
        {icon}
      </div>

      {/* Content */}
      <div className="mt-5">
        <span className="block text-sm text-gray-500 dark:text-gray-400">
          {label}
        </span>
        <h4 className="mt-1.5 text-2xl font-bold text-gray-900 dark:text-white">
          {value}
        </h4>

        {/* Delta badge */}
        <div className="mt-2 flex items-center gap-1.5">
          <span
            className={[
              "inline-flex items-center gap-0.5 rounded-full px-2 py-0.5 text-xs font-semibold",
              isUp
                ? "bg-success-50 text-success-700 dark:bg-success-500/15 dark:text-success-400"
                : "bg-error-50 text-error-700 dark:bg-error-500/15 dark:text-error-400",
            ].join(" ")}
          >
            {isUp ? (
              <ArrowUpIcon className="size-3" />
            ) : (
              <ArrowDownIcon className="size-3" />
            )}
            {Math.abs(delta)}%
          </span>
          {deltaLabel && (
            <span className="text-xs text-gray-400 dark:text-gray-500">
              {deltaLabel}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
