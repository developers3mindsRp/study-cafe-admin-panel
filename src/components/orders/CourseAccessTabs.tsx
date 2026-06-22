export type CourseAccessScope = "active" | "expired";

/** `all` = no course-access filter (default). */
export type CourseAccessFilter = "all" | CourseAccessScope;

interface CourseAccessTabsProps {
  value: CourseAccessFilter;
  onChange: (scope: CourseAccessFilter) => void;
}

export function courseAccessFilterToApiParam(
  filter: CourseAccessFilter | undefined,
): CourseAccessScope | undefined {
  if (filter === "active" || filter === "expired") return filter;
  return undefined;
}

export function CourseAccessTabs({ value, onChange }: CourseAccessTabsProps) {
  const tabs: { key: CourseAccessFilter; label: string }[] = [
    { key: "all", label: "All" },
    { key: "active", label: "Active" },
    { key: "expired", label: "Expired" },
  ];

  const tabClass = (scope: CourseAccessFilter) =>
    `rounded-lg px-4 py-2 text-sm font-medium transition ${
      value === scope
        ? "bg-brand-500 text-white shadow-theme-xs"
        : "bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
    }`;

  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="text-xs font-medium text-gray-500 dark:text-gray-400">Course access:</span>
      {tabs.map(({ key, label }) => (
        <button key={key} type="button" className={tabClass(key)} onClick={() => onChange(key)}>
          {label}
        </button>
      ))}
    </div>
  );
}
