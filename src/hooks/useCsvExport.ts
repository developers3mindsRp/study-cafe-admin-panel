import { useCallback, useRef, useState } from "react";
import { exportRowsToCsv, type CsvColumn } from "../utils/exportToCsv";
import {
  formatExportProgressLabel,
  formatExportProgressTitle,
  type ExportProgress,
  type ExportProgressCallback,
} from "../utils/exportProgress";
import { exportErrorMessage } from "../utils/exportHelpers";
import { isExportAuthError, requireAuthForExport } from "../lib/exportAuth";

export interface UseCsvExportOptions<T> {
  /** Columns written to the CSV, in order. */
  columns: CsvColumn<T>[];
  /** Filename stem — the run date (and "-filtered") is appended automatically. */
  filename: string;
  /** Loads every row to export; call `onProgress` while paging large datasets. */
  fetchRows: (onProgress: ExportProgressCallback) => Promise<T[]>;
  /** Button text while idle. */
  idleLabel?: string;
}

export interface UseCsvExportResult {
  /** Runs the export; pass `filtered` to tag the filename with "-filtered". */
  runExport: (options?: { filtered?: boolean }) => Promise<void>;
  /** Feed straight into `<ExportProgressBar progress={...} />`. */
  progress: ExportProgress | null;
  isExporting: boolean;
  buttonLabel: string;
  buttonTitle: string | undefined;
}

/**
 * Export-button plumbing shared by the admin list pages: auth guard, progress
 * state, dated filename, CSV download, and error alerting.
 */
export function useCsvExport<T>({
  columns,
  filename,
  fetchRows,
  idleLabel = "Export CSV",
}: UseCsvExportOptions<T>): UseCsvExportResult {
  const [progress, setProgress] = useState<ExportProgress | null>(null);
  const runningRef = useRef(false);

  const runExport = useCallback(
    async (options?: { filtered?: boolean }) => {
      if (runningRef.current) return;
      runningRef.current = true;
      setProgress({ loaded: 0, total: null, phase: "fetching" });
      try {
        await requireAuthForExport();
        const rows = await fetchRows(setProgress);
        setProgress({ loaded: rows.length, total: rows.length, phase: "writing" });
        const datePart = new Date().toISOString().slice(0, 10);
        const filteredPart = options?.filtered ? "-filtered" : "";
        exportRowsToCsv({
          filename: `${filename}-${datePart}${filteredPart}`,
          columns,
          rows,
        });
      } catch (err: unknown) {
        if (isExportAuthError(err)) return;
        alert(exportErrorMessage(err));
      } finally {
        runningRef.current = false;
        setProgress(null);
      }
    },
    [columns, filename, fetchRows],
  );

  return {
    runExport,
    progress,
    isExporting: progress !== null,
    buttonLabel: formatExportProgressLabel(progress, idleLabel),
    buttonTitle: formatExportProgressTitle(progress),
  };
}
