import type { DashboardPeriod } from "../../types/dashboard";

interface DashboardHeaderProps {
  period: DashboardPeriod;
  onPeriodChange: (period: DashboardPeriod) => void;
}

const PERIODS: { value: DashboardPeriod; label: string }[] = [
  { value: "7d", label: "7d" },
  { value: "30d", label: "30d" },
  { value: "90d", label: "90d" },
];

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

function formatDate(): string {
  return new Date().toLocaleDateString("en-IN", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export default function DashboardHeader({ period, onPeriodChange }: DashboardHeaderProps) {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      {/* Left — title + greeting */}
      <div>
        <h1 className="text-xl font-semibold text-gray-900 dark:text-white">
          {getGreeting()}, Admin
        </h1>
        <p className="mt-0.5 text-sm text-gray-500 dark:text-gray-400">
          {formatDate()}
        </p>
      </div>

      {/* Right — period toggle */}
      <div className="flex items-center gap-1 rounded-xl border border-gray-200 bg-gray-50 p-1 dark:border-gray-700 dark:bg-gray-800/60">
        {PERIODS.map(({ value, label }) => {
          const isActive = period === value;
          return (
            <button
              key={value}
              onClick={() => onPeriodChange(value)}
              className={[
                "rounded-lg px-4 py-1.5 text-sm font-medium transition-all duration-200",
                isActive
                  ? "bg-white text-gray-900 shadow-sm dark:bg-gray-700 dark:text-white"
                  : "text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200",
              ].join(" ")}
            >
              {label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
