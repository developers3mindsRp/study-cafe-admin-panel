import { useRef, useState } from "react";
import * as XLSX from "xlsx";

/** One parsed row. `amount`/`paymentId` are raw strings — "" means the cell was blank. */
export interface AllotmentRow {
  email: string;
  amount: string;
  paymentId: string;
}

interface CsvEmailUploadProps {
  /** Receives newline-joined emails. Used where only addresses matter. */
  onEmails?: (emails: string) => void;
  /** Receives full rows including amount paid + payment id. Takes precedence over onEmails. */
  onRows?: (rows: AllotmentRow[]) => void;
  /** Advertise the amount/payment columns in the hint text and sample download. */
  withPayment?: boolean;
  /** Sample file offered for download. Defaults by `withPayment`. */
  sampleHref?: string;
}

const ACCEPTED_EXTENSIONS = [".csv", ".xlsx", ".xls"];

function fileExtension(name: string): string {
  const dot = name.lastIndexOf(".");
  return dot === -1 ? "" : name.slice(dot).toLowerCase();
}

const EMAIL_HEADERS = ["email", "email address", "emailaddress", "email_address", "e-mail", "e mail"];
const AMOUNT_HEADERS = ["amount_paid", "amount paid", "amountpaid", "amount", "price", "paid"];
const PAYMENT_HEADERS = [
  "payment_id",
  "payment id",
  "paymentid",
  "razorpay payment id",
  "razorpay_payment_id",
  "razorpay id",
  "transaction id",
  "txn id",
];

/**
 * Character-level CSV parse honouring quoted fields (`"1,299"`, embedded newlines and
 * doubled quotes). A plain `line.split(",")` shreds any comma-formatted amount, which is
 * exactly how gateway exports and Excel write them — and the damage is silent, since a
 * mangled amount lands in the wrong column instead of erroring.
 */
function parseCsv(text: string, delimiter: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let inQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (inQuotes) {
      if (ch === '"') {
        if (text[i + 1] === '"') {
          field += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        field += ch;
      }
      continue;
    }
    if (ch === '"') {
      inQuotes = true;
    } else if (ch === delimiter) {
      row.push(field);
      field = "";
    } else if (ch === "\n") {
      row.push(field);
      rows.push(row);
      row = [];
      field = "";
    } else if (ch !== "\r") {
      field += ch;
    }
  }
  row.push(field);
  rows.push(row);

  return rows.filter((r) => r.some((c) => c.trim() !== ""));
}

function findColumn(headers: string[], aliases: string[]): number {
  return headers.findIndex((h) => aliases.includes(h));
}

function tableFromCsv(text: string): string[][] {
  // Excel writes a UTF-8 BOM, which would otherwise glue itself to the first header name.
  const clean = text.replace(/^\uFEFF/, "");
  const firstLine = clean.split(/\r?\n/)[0] ?? "";
  const delimiter = firstLine.includes(";") && !firstLine.includes(",") ? ";" : ",";
  return parseCsv(clean, delimiter);
}

/**
 * First sheet of a real .xlsx/.xls workbook as a plain table.
 *
 * `raw: true` reads each cell's underlying value rather than its displayed text. That
 * matters for the payment id column: a purely numeric reference (a UTR or bank txn id
 * typed into a General-formatted cell) renders as "1.23457E+15" under `raw: false`, and
 * would be stored as that corrupted string. The underlying number stringifies exactly.
 * Amounts are unaffected \u2014 a currency-formatted cell yields the plain number, which
 * normalizeAmount parses the same as the "\u20B912,979.00" text would have.
 */
function tableFromWorkbook(buffer: ArrayBuffer): string[][] {
  const workbook = XLSX.read(buffer, { type: "array" });
  const firstSheetName = workbook.SheetNames[0];
  if (!firstSheetName) return [];
  const sheet = workbook.Sheets[firstSheetName];
  const table = XLSX.utils.sheet_to_json<string[]>(sheet, {
    header: 1,
    raw: true,
    defval: "",
    blankrows: false,
  });
  return table
    .map((row) => (Array.isArray(row) ? row.map((cell) => String(cell ?? "")) : []))
    .filter((row) => row.some((cell) => cell.trim() !== ""));
}

function rowsFromTable(table: string[][]): AllotmentRow[] {
  if (table.length === 0) return [];

  const headers = table[0].map((h) => h.trim().toLowerCase());
  const emailCol = findColumn(headers, EMAIL_HEADERS);

  // No recognisable header — treat every cell that looks like an address as an email-only
  // row. Guessing which unlabelled column holds money would be worse than not supporting it.
  if (emailCol === -1) {
    const rows: AllotmentRow[] = [];
    for (const cols of table) {
      for (const col of cols) {
        const val = col.trim().toLowerCase();
        if (val.includes("@") && val.includes(".")) {
          rows.push({ email: val, amount: "", paymentId: "" });
        }
      }
    }
    return rows;
  }

  const amountCol = findColumn(headers, AMOUNT_HEADERS);
  const paymentCol = findColumn(headers, PAYMENT_HEADERS);
  const cell = (cols: string[], index: number) => (index === -1 ? "" : (cols[index] ?? "").trim());

  const rows: AllotmentRow[] = [];
  for (let i = 1; i < table.length; i++) {
    const cols = table[i];
    const email = cell(cols, emailCol).toLowerCase();
    const amount = cell(cols, amountCol);
    const paymentId = cell(cols, paymentCol);
    // Keep invalid addresses: the modal reports them per row so the admin can see which
    // line of their file is wrong, rather than having them vanish during parsing.
    if (email || amount || paymentId) rows.push({ email, amount, paymentId });
  }
  return rows;
}

export function CsvEmailUpload({
  onEmails,
  onRows,
  withPayment = false,
  sampleHref: sampleHrefProp,
}: CsvEmailUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const [csvError, setCsvError] = useState<string | null>(null);
  const [lastCount, setLastCount] = useState<number | null>(null);

  const emitRows = (rows: AllotmentRow[], fileLabel: string) => {
    if (rows.length === 0) {
      setCsvError(`No rows found in this ${fileLabel} file.`);
      return;
    }
    if (onRows) {
      setLastCount(rows.length);
      onRows(rows);
      return;
    }
    if (onEmails) {
      const emails = [...new Set(rows.map((r) => r.email).filter((e) => e.includes("@")))];
      if (emails.length === 0) {
        setCsvError(`No valid emails found in this ${fileLabel} file.`);
        setLastCount(null);
        return;
      }
      setLastCount(emails.length);
      onEmails(emails.join("\n"));
    }
  };

  const processFile = (file: File) => {
    setCsvError(null);
    setLastCount(null);

    const ext = fileExtension(file.name);
    const isExcel = ext === ".xlsx" || ext === ".xls";
    const isCsv = ext === ".csv" || file.type === "text/csv";
    if (!isExcel && !isCsv) {
      setCsvError("Please upload a .xlsx, .xls or .csv file.");
      return;
    }

    const reader = new FileReader();
    reader.onerror = () => setCsvError("Could not read that file. Please try again.");
    reader.onload = (e) => {
      try {
        if (isExcel) {
          const buffer = e.target?.result as ArrayBuffer;
          emitRows(rowsFromTable(tableFromWorkbook(buffer)), "Excel");
        } else {
          const text = (e.target?.result as string) ?? "";
          emitRows(rowsFromTable(tableFromCsv(text)), "CSV");
        }
      } catch {
        setCsvError(
          isExcel
            ? "That Excel file could not be read. Re-save it as .xlsx or export it as CSV."
            : "That CSV file could not be read.",
        );
      }
    };

    if (isExcel) {
      reader.readAsArrayBuffer(file);
    } else {
      reader.readAsText(file);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processFile(file);
    e.target.value = "";
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) processFile(file);
  };

  const sampleHref =
    sampleHrefProp ??
    (withPayment ? "/samples/sample-course-allotment.csv" : "/samples/sample-email-upload.csv");
  const sampleLabel = sampleHref.endsWith(".csv") ? "Download sample CSV" : "Download sample file";

  return (
    <div>
      <div
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
        className={`flex cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed px-4 py-5 transition
          ${dragging
            ? "border-brand-400 bg-brand-50 dark:border-brand-500 dark:bg-brand-500/10"
            : "border-gray-300 hover:border-brand-400 hover:bg-gray-50 dark:border-gray-700 dark:hover:border-brand-500 dark:hover:bg-white/[0.02]"
          }`}
      >
        <svg className="size-7 text-gray-400 dark:text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
        </svg>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          <span className="font-medium text-brand-600 dark:text-brand-400">Upload Excel or CSV</span>
          {" "}or drag & drop
        </p>
        <p className="px-2 text-center text-xs text-gray-400">
          {withPayment
            ? "Only \"email\" is required. \"amount_paid\" and \"payment_id\" are optional."
            : "Must have an \"email\" column, or be a single column of emails"}
        </p>
        <a
          href={sampleHref}
          download
          onClick={(e) => e.stopPropagation()}
          className="text-xs text-brand-500 underline hover:text-brand-600 dark:text-brand-400"
        >
          {sampleLabel}
        </a>
      </div>

      <input
        ref={inputRef}
        type="file"
        accept={ACCEPTED_EXTENSIONS.join(",")}
        className="hidden"
        onChange={handleFileChange}
      />

      {lastCount !== null && !csvError && (
        <p className="mt-1.5 text-xs text-success-600 dark:text-success-400">
          {lastCount} row{lastCount !== 1 ? "s" : ""} read from file.
        </p>
      )}
      {csvError && (
        <p className="mt-1.5 text-xs text-error-600 dark:text-error-400">{csvError}</p>
      )}
    </div>
  );
}
