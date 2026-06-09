export type TrashScope = "active" | "trash";

interface TrashScopeTabsProps {
  value: TrashScope;
  onChange: (scope: TrashScope) => void;
  activeLabel?: string;
  trashLabel?: string;
}

export function TrashScopeTabs({
  value,
  onChange,
  activeLabel = "Active",
  trashLabel = "Trash",
}: TrashScopeTabsProps) {
  const tabClass = (scope: TrashScope) =>
    `rounded-lg px-4 py-2 text-sm font-medium transition ${
      value === scope
        ? "bg-brand-500 text-white shadow-theme-xs"
        : "bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
    }`;

  return (
    <div className="flex flex-wrap items-center gap-2">
      <button type="button" className={tabClass("active")} onClick={() => onChange("active")}>
        {activeLabel}
      </button>
      <button type="button" className={tabClass("trash")} onClick={() => onChange("trash")}>
        {trashLabel}
      </button>
    </div>
  );
}

export function trashedQueryParam(scope: TrashScope): Record<string, string> | undefined {
  return scope === "trash" ? { trashed: "1" } : undefined;
}
