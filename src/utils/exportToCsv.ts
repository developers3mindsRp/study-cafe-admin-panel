export type CsvColumn<T> = {
  header: string;
  accessor: (row: T) => string | number;
};

function escapeCsvCell(value: string | number): string {
  const s = value == null ? "" : String(value);
  if (/[",\r\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

function rowToCsvLine<T>(columns: CsvColumn<T>[], row: T): string {
  const cells = new Array<string>(columns.length);
  for (let i = 0; i < columns.length; i += 1) {
    try {
      const v = columns[i].accessor(row);
      cells[i] = escapeCsvCell(v == null ? "" : v);
    } catch {
      cells[i] = "";
    }
  }
  return cells.join(",");
}

/**
 * Build a UTF-8 CSV from column definitions and rows, then trigger download.
 * Lighter than .xlsx — no SheetJS dependency on the export path.
 */
export function exportRowsToCsv<T>(options: {
  filename: string;
  columns: CsvColumn<T>[];
  rows: T[];
}): void {
  const { columns, rows, filename } = options;
  const headerLine = columns.map((c) => escapeCsvCell(c.header)).join(",");
  const bodyLines = new Array<string>(rows.length);
  for (let i = 0; i < rows.length; i += 1) {
    bodyLines[i] = rowToCsvLine(columns, rows[i]);
  }
  const csv = `\uFEFF${headerLine}\r\n${bodyLines.join("\r\n")}`;
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename.toLowerCase().endsWith(".csv") ? filename : `${filename}.csv`;
  anchor.click();
  URL.revokeObjectURL(url);
}
