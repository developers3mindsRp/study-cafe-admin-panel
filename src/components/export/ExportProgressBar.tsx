import {
  exportProgressIsIndeterminate,
  exportProgressPercent,
  formatExportProgressMessage,
  type ExportProgress,
} from "../../utils/exportProgress";

interface ExportProgressBarProps {
  progress: ExportProgress | null;
  label?: string;
}

export function ExportProgressBar({ progress, label = "Export in progress" }: ExportProgressBarProps) {
  if (!progress) return null;

  const pct = exportProgressPercent(progress);
  const indeterminate = exportProgressIsIndeterminate(progress);
  const message = formatExportProgressMessage(progress);

  return (
    <div
      role="status"
      aria-live="polite"
      className="overflow-hidden rounded-xl border border-brand-200 bg-brand-50/80 dark:border-brand-500/30 dark:bg-brand-500/10"
    >
      <div className="flex flex-wrap items-center justify-between gap-2 px-4 py-2.5">
        <p className="text-sm font-medium text-brand-800 dark:text-brand-200">{label}</p>
        <p className="text-xs text-brand-700/90 dark:text-brand-300/90">{message}</p>
      </div>
      <div className="h-1.5 w-full overflow-hidden bg-brand-100 dark:bg-brand-900/40">
        {indeterminate ? (
          <div className="h-full w-2/5 animate-pulse rounded-r-full bg-brand-500 dark:bg-brand-400" />
        ) : (
          <div
            className="h-full rounded-r-full bg-brand-500 transition-[width] duration-300 ease-out dark:bg-brand-400"
            style={{ width: `${pct}%` }}
          />
        )}
      </div>
    </div>
  );
}
