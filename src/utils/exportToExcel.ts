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
}): void {
  const { columns, rows, filename, sheetName = "Sheet1" } = options;
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
  const name = filename.toLowerCase().endsWith(".xlsx") ? filename : `${filename}.xlsx`;
  XLSX.writeFile(wb, name);
}
