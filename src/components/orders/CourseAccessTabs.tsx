export type CourseAccessScope = "active" | "expired";

interface CourseAccessTabsProps {
  value: CourseAccessScope;
  onChange: (scope: CourseAccessScope) => void;
}

export function CourseAccessTabs({ value, onChange }: CourseAccessTabsProps) {
  const tabClass = (scope: CourseAccessScope) =>
    `rounded-lg px-4 py-2 text-sm font-medium transition ${
      value === scope
        ? "bg-brand-500 text-white shadow-theme-xs"
        : "bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
    }`;

  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="text-xs font-medium text-gray-500 dark:text-gray-400">Course access:</span>
      <button type="button" className={tabClass("active")} onClick={() => onChange("active")}>
        Active
      </button>
      <button type="button" className={tabClass("expired")} onClick={() => onChange("expired")}>
        Expired
      </button>
    </div>
  );
}
