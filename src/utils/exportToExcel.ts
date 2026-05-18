import * as XLSX from "xlsx";

export type ExcelColumn<T> = {
  header: string;
  accessor: (row: T) => string | number;
};

/**
 * Build a single-sheet .xlsx from column definitions and rows, then trigger download.
 */
export function exportRowsToExcel<T>(options: {
  filename: string;
  sheetName?: string;
  columns: ExcelColumn<T>[];
  rows: T[];
  /** Optional extra worksheets as array-of-arrays (row 0 = headers). */
  extraSheets?: { name: string; aoa: (string | number)[][] }[];
}): void {
  const { columns, rows, filename, sheetName = "Sheet1", extraSheets = [] } = options;
  const headerRow = columns.map((c) => c.header);
  const dataRows = rows.map((row) =>
    columns.map((c) => {
      try {
        const v = c.accessor(row);
        if (v == null) return "";
        return v;
      } catch {
        return "";
      }
    })
  );
  const aoa = [headerRow, ...dataRows];
  const ws = XLSX.utils.aoa_to_sheet(aoa);
  const wb = XLSX.utils.book_new();
  const safeSheet = sheetName.replace(/[:\\/?*[\]]/g, "_").slice(0, 31) || "Sheet1";
  XLSX.utils.book_append_sheet(wb, ws, safeSheet);
  for (const extra of extraSheets) {
    const wsExtra = XLSX.utils.aoa_to_sheet(extra.aoa);
    const safeExtra =
      extra.name.replace(/[:\\/?*[\]]/g, "_").slice(0, 31) || "Sheet";
    XLSX.utils.book_append_sheet(wb, wsExtra, safeExtra);
  }
  const name = filename.toLowerCase().endsWith(".xlsx") ? filename : `${filename}.xlsx`;
  XLSX.writeFile(wb, name);
}
