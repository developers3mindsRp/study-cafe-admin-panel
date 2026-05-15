import { useRef, useState } from "react";

interface CsvEmailUploadProps {
  onEmails: (emails: string) => void;
}

function extractEmailsFromCsv(text: string): string[] {
  const lines = text.split(/\r?\n/);
  if (lines.length === 0) return [];

  // Detect delimiter: comma or semicolon
  const delimiter = lines[0].includes(";") ? ";" : ",";

  // Parse header row to find email column index
  const headers = lines[0].split(delimiter).map((h) => h.trim().toLowerCase().replace(/^"|"$/g, ""));
  const emailColIndex = headers.findIndex((h) => h === "email" || h === "email address" || h === "e-mail");

  const emails: string[] = [];

  if (emailColIndex !== -1) {
    // Structured CSV with header
    for (let i = 1; i < lines.length; i++) {
      const cols = lines[i].split(delimiter);
      const val = (cols[emailColIndex] ?? "").trim().replace(/^"|"$/g, "").toLowerCase();
      if (val && val.includes("@")) emails.push(val);
    }
  } else {
    // No header / single-column — treat every cell that looks like an email
    for (const line of lines) {
      const cols = line.split(delimiter);
      for (const col of cols) {
        const val = col.trim().replace(/^"|"$/g, "").toLowerCase();
        if (val && val.includes("@") && val.includes(".")) emails.push(val);
      }
    }
  }

  return [...new Set(emails)];
}

export function CsvEmailUpload({ onEmails }: CsvEmailUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const [csvError, setCsvError] = useState<string | null>(null);
  const [lastCount, setLastCount] = useState<number | null>(null);

  const processFile = (file: File) => {
    setCsvError(null);
    setLastCount(null);

    if (!file.name.endsWith(".csv") && file.type !== "text/csv") {
      setCsvError("Please upload a .csv file.");
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      const emails = extractEmailsFromCsv(text);
      if (emails.length === 0) {
        setCsvError("No valid emails found in this CSV file.");
        return;
      }
      setLastCount(emails.length);
      onEmails(emails.join("\n"));
    };
    reader.readAsText(file);
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
          <span className="font-medium text-brand-600 dark:text-brand-400">Upload CSV</span>
          {" "}or drag & drop
        </p>
        <p className="text-xs text-gray-400">Must have an "email" column, or be a single column of emails</p>
        <a
          href="/samples/sample-email-upload.csv"
          download
          onClick={(e) => e.stopPropagation()}
          className="text-xs text-brand-500 underline hover:text-brand-600 dark:text-brand-400"
        >
          Download sample CSV
        </a>
      </div>

      <input
        ref={inputRef}
        type="file"
        accept=".csv,text/csv"
        className="hidden"
        onChange={handleFileChange}
      />

      {lastCount !== null && !csvError && (
        <p className="mt-1.5 text-xs text-success-600 dark:text-success-400">
          {lastCount} email{lastCount !== 1 ? "s" : ""} extracted from CSV and added below.
        </p>
      )}
      {csvError && (
        <p className="mt-1.5 text-xs text-error-600 dark:text-error-400">{csvError}</p>
      )}
    </div>
  );
}
