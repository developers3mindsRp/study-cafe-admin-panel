export type ExportProgress = {
  loaded: number;
  total: number | null;
  phase?: "fetching" | "writing";
};

export type ExportProgressCallback = (progress: ExportProgress) => void;

/** Short label for export buttons while a job is running. */
export function formatExportProgressLabel(
  progress: ExportProgress | null,
  idleLabel: string,
): string {
  if (!progress) return idleLabel;
  if (progress.phase === "writing") return "Writing file…";
  if (progress.total != null && progress.total > 0) {
    const pct = Math.min(100, Math.round((progress.loaded / progress.total) * 100));
    return `Exporting… ${pct}%`;
  }
  if (progress.loaded > 0) {
    return `Exporting… ${progress.loaded.toLocaleString()}`;
  }
  return "Exporting…";
}

/** 0–100 for the progress bar fill. */
export function exportProgressPercent(progress: ExportProgress | null): number {
  if (!progress) return 0;
  if (progress.phase === "writing") return 100;
  if (progress.total != null && progress.total > 0) {
    return Math.min(100, Math.round((progress.loaded / progress.total) * 100));
  }
  return 0;
}

export function exportProgressIsIndeterminate(progress: ExportProgress | null): boolean {
  if (!progress || progress.phase === "writing") return false;
  return progress.total == null || progress.total <= 0;
}

/** Status line shown beside the progress bar. */
export function formatExportProgressMessage(progress: ExportProgress | null): string {
  if (!progress) return "";
  if (progress.phase === "writing") {
    return progress.total != null
      ? `Writing file (${progress.loaded.toLocaleString()} rows)…`
      : "Writing file…";
  }
  if (progress.total != null && progress.total > 0) {
    const pct = exportProgressPercent(progress);
    return `Fetching rows… ${progress.loaded.toLocaleString()} / ${progress.total.toLocaleString()} (${pct}%)`;
  }
  if (progress.loaded > 0) {
    return `Fetching rows… ${progress.loaded.toLocaleString()} loaded`;
  }
  return "Preparing export…";
}

/** Tooltip / title with full row counts when available. */
export function formatExportProgressTitle(progress: ExportProgress | null): string | undefined {
  if (!progress) return undefined;
  if (progress.phase === "writing") {
    return progress.total != null
      ? `Building file (${progress.loaded.toLocaleString()} rows)`
      : "Building file";
  }
  if (progress.total != null && progress.total > 0) {
    return `Fetched ${progress.loaded.toLocaleString()} of ${progress.total.toLocaleString()} rows`;
  }
  if (progress.loaded > 0) {
    return `Fetched ${progress.loaded.toLocaleString()} rows`;
  }
  return "Export in progress";
}
