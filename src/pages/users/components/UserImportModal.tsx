import { useEffect, useMemo, useRef, useState } from "react";
import { Modal } from "../../../components/ui/modal";
import Label from "../../../components/form/Label";
import Button from "../../../components/ui/button/Button";
import { plansApi, type Plan } from "../../../api/plans";
import {
  importUsersFromCsv,
  type UserImportFieldError,
  type UserImportResult,
} from "../../../api/users";
import { parseUsersCsv, type ParsedUserImportRow } from "../utils/parseUsersCsv";
import { USER_CSV_IMPORT_HEADERS } from "../utils/userCsvColumns";
import {
  buildPlanSlugSet,
  validateUserImportRows,
  type UserImportRowValidation,
} from "../utils/validateUserImportRows";
import { getApiErrorMessage } from "../../../lib/apiError";

interface UserImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImported?: () => void;
}

type Step = "form" | "results";

function toLocalDateString(date: Date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

const STATUS_STYLES: Record<UserImportResult["status"], string> = {
  created: "bg-success-50 text-success-700 dark:bg-success-500/10 dark:text-success-400",
  updated: "bg-brand-50 text-brand-700 dark:bg-brand-500/10 dark:text-brand-400",
  skipped: "bg-gray-100 text-gray-600 dark:bg-white/5 dark:text-gray-400",
  error: "bg-error-50 text-error-600 dark:bg-error-500/10 dark:text-error-400",
};

const STATUS_LABEL: Record<UserImportResult["status"], string> = {
  created: "Created",
  updated: "Updated",
  skipped: "No changes",
  error: "Not imported",
};

function flattenFieldErrors(
  results: UserImportResult[],
): { rowNumber: number; email: string; field: string; message: string }[] {
  const rows: { rowNumber: number; email: string; field: string; message: string }[] = [];

  for (const r of results) {
    if (r.status === "error" && r.fieldErrors?.length) {
      for (const e of r.fieldErrors) {
        rows.push({
          rowNumber: r.rowNumber ?? 0,
          email: r.email,
          field: e.field,
          message: e.message,
        });
      }
    } else if (r.status === "error" && r.message) {
      rows.push({
        rowNumber: r.rowNumber ?? 0,
        email: r.email,
        field: "row",
        message: r.message,
      });
    }
  }

  return rows;
}

export function UserImportModal({ isOpen, onClose, onImported }: UserImportModalProps) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [step, setStep] = useState<Step>("form");
  const [dragging, setDragging] = useState(false);
  const [csvError, setCsvError] = useState<string | null>(null);
  const [parsedRows, setParsedRows] = useState<ParsedUserImportRow[]>([]);
  const [fileName, setFileName] = useState<string | null>(null);

  const [plans, setPlans] = useState<Plan[]>([]);

  const today = toLocalDateString(new Date());
  const oneYearLater = toLocalDateString(new Date(Date.now() + 365 * 24 * 60 * 60 * 1000));
  const [startsAt, setStartsAt] = useState(today);
  const [expiresAt, setExpiresAt] = useState(oneYearLater);

  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [results, setResults] = useState<UserImportResult[]>([]);
  const [summary, setSummary] = useState({ imported: 0, failed: 0, skipped: 0 });
  const [clientValidation, setClientValidation] = useState<UserImportRowValidation[]>([]);

  useEffect(() => {
    if (!isOpen) return;
    plansApi
      .list({ limit: 100 })
      .then((res) => setPlans((res.data ?? []).filter((p) => p.is_active)))
      .catch(() => setPlans([]));
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) {
      setTimeout(() => {
        setStep("form");
        setCsvError(null);
        setParsedRows([]);
        setFileName(null);
        setStartsAt(today);
        setExpiresAt(oneYearLater);
        setResults([]);
        setSummary({ imported: 0, failed: 0, skipped: 0 });
        setSubmitError(null);
        setClientValidation([]);
      }, 300);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  const planSlugSet = useMemo(() => buildPlanSlugSet(plans), [plans]);

  const rowsNeedMembership = parsedRows.some((r) => r.membership?.trim());

  const clientValidations = useMemo(() => {
    if (parsedRows.length === 0) return [];
    return validateUserImportRows(parsedRows, {
      planSlugs: planSlugSet,
      requiresMembershipDates: rowsNeedMembership,
      startsAt,
      expiresAt,
    });
  }, [parsedRows, planSlugSet, rowsNeedMembership, startsAt, expiresAt]);

  useEffect(() => {
    setClientValidation(clientValidations);
  }, [clientValidations]);

  const clientInvalidCount = clientValidation.filter((v) => !v.valid).length;
  const clientValidCount = parsedRows.length - clientInvalidCount;

  const canSubmit =
    parsedRows.length > 0 &&
    (!rowsNeedMembership || (startsAt && expiresAt && expiresAt > startsAt)) &&
    !submitting;

  const processFile = (file: File) => {
    setCsvError(null);
    setParsedRows([]);
    setFileName(null);
    setClientValidation([]);

    if (!file.name.endsWith(".csv") && file.type !== "text/csv") {
      setCsvError("Please upload a .csv file.");
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const text = e.target?.result as string;
        const rows = parseUsersCsv(text);
        if (rows.length === 0) {
          setCsvError("No data rows found. Ensure the file has an email column and at least one data row.");
          return;
        }
        setParsedRows(rows);
        setFileName(file.name);
      } catch (err) {
        setCsvError(err instanceof Error ? err.message : "Failed to parse CSV.");
      }
    };
    reader.readAsText(file);
  };

  const handleSubmit = async () => {
    if (!canSubmit) return;
    setSubmitting(true);
    setSubmitError(null);
    try {
      const res = await importUsersFromCsv({
        rows: parsedRows,
        startsAt: rowsNeedMembership ? startsAt : undefined,
        expiresAt: rowsNeedMembership ? expiresAt : undefined,
      });
      setResults(res.results);
      setSummary({
        imported: res.imported,
        failed: res.failed,
        skipped: res.skipped,
      });
      setStep("results");
      if (res.imported > 0) onImported?.();
    } catch (err: unknown) {
      setSubmitError(getApiErrorMessage(err, "Import failed"));
    } finally {
      setSubmitting(false);
    }
  };

  const errorRows = useMemo(() => flattenFieldErrors(results), [results]);

  const successResults = results.filter(
    (r) => r.status === "created" || r.status === "updated",
  );

  const columnHint = USER_CSV_IMPORT_HEADERS.join(", ");

  return (
    <Modal isOpen={isOpen} onClose={onClose} className="max-w-3xl">
      <div className="p-6">
        <h2 className="mb-1 text-xl font-semibold text-gray-900 dark:text-white">
          Import users from CSV
        </h2>
        <p className="mb-6 text-sm text-gray-500 dark:text-gray-400">
          Valid rows are imported even when other rows fail. Set each user&apos;s plan in the{" "}
          <strong>membership</strong> column using a <code className="text-xs">premium_plans.slug</code>{" "}
          value; linked courses are enrolled automatically. Leave membership empty to create the user
          without a plan.
        </p>

        {step === "form" ? (
          <div className="space-y-5">
            {rowsNeedMembership && (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Membership starts</Label>
                  <input
                    type="date"
                    value={startsAt}
                    onChange={(e) => setStartsAt(e.target.value)}
                    className="mt-1.5 w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm dark:border-gray-700 dark:bg-transparent dark:text-white"
                  />
                </div>
                <div>
                  <Label>Membership expires</Label>
                  <input
                    type="date"
                    value={expiresAt}
                    onChange={(e) => setExpiresAt(e.target.value)}
                    className="mt-1.5 w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm dark:border-gray-700 dark:bg-transparent dark:text-white"
                  />
                </div>
              </div>
            )}

            <div>
              <Label>CSV file</Label>
              <div
                onDragOver={(e) => {
                  e.preventDefault();
                  setDragging(true);
                }}
                onDragLeave={() => setDragging(false)}
                onDrop={(e) => {
                  e.preventDefault();
                  setDragging(false);
                  const file = e.dataTransfer.files?.[0];
                  if (file) processFile(file);
                }}
                onClick={() => fileRef.current?.click()}
                className={`mt-1.5 flex cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed px-4 py-5 transition
                  ${
                    dragging
                      ? "border-brand-400 bg-brand-50 dark:border-brand-500 dark:bg-brand-500/10"
                      : "border-gray-300 hover:border-brand-400 hover:bg-gray-50 dark:border-gray-700 dark:hover:border-brand-500"
                  }`}
              >
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  <span className="font-medium text-brand-600 dark:text-brand-400">Upload CSV</span>
                  {" "}or drag & drop
                </p>
                <p className="max-w-md text-center text-xs text-gray-400">
                  Columns: {columnHint}
                </p>
                <a
                  href="/samples/sample-users-import.csv"
                  download
                  onClick={(e) => e.stopPropagation()}
                  className="text-xs text-brand-500 underline hover:text-brand-600"
                >
                  Download sample CSV
                </a>
              </div>
              <input
                ref={fileRef}
                type="file"
                accept=".csv,text/csv"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) processFile(file);
                  e.target.value = "";
                }}
              />
              {fileName && parsedRows.length > 0 && !csvError && (
                <div className="mt-2 space-y-1">
                  <p className="text-xs text-success-600 dark:text-success-400">
                    {parsedRows.length} row{parsedRows.length !== 1 ? "s" : ""} in {fileName}
                  </p>
                  {clientInvalidCount > 0 ? (
                    <p className="text-xs text-amber-600 dark:text-amber-400">
                      {clientValidCount} row{clientValidCount !== 1 ? "s" : ""} look valid,{" "}
                      {clientInvalidCount} have validation issues (will be skipped; valid rows still import).
                    </p>
                  ) : (
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      All rows passed client-side validation.
                    </p>
                  )}
                </div>
              )}
              {csvError && (
                <p className="mt-1.5 text-xs text-error-600 dark:text-error-400">{csvError}</p>
              )}

              {clientInvalidCount > 0 && (
                <div className="mt-3 max-h-40 overflow-y-auto rounded-lg border border-amber-200 bg-amber-50/50 dark:border-amber-500/30 dark:bg-amber-500/5">
                  <table className="w-full text-left text-xs">
                    <thead className="sticky top-0 bg-amber-50 text-amber-800 dark:bg-amber-500/10 dark:text-amber-300">
                      <tr>
                        <th className="px-2 py-1.5">Row</th>
                        <th className="px-2 py-1.5">Email</th>
                        <th className="px-2 py-1.5">Column</th>
                        <th className="px-2 py-1.5">Issue</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-amber-100 dark:divide-amber-500/10">
                      {clientValidation
                        .filter((v) => !v.valid)
                        .flatMap((v) =>
                          v.errors.map((e: UserImportFieldError) => (
                            <tr key={`${v.rowNumber}-${e.field}`}>
                              <td className="px-2 py-1.5">{v.rowNumber}</td>
                              <td className="px-2 py-1.5 font-mono">{v.email || "—"}</td>
                              <td className="px-2 py-1.5 font-medium">{e.field}</td>
                              <td className="px-2 py-1.5 text-amber-800 dark:text-amber-200">{e.message}</td>
                            </tr>
                          )),
                        )}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {submitError && (
              <p className="text-sm text-error-600 dark:text-error-400">{submitError}</p>
            )}

            <div className="flex justify-end gap-3 pt-2">
              <Button type="button" variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button type="button" onClick={handleSubmit} disabled={!canSubmit}>
                {submitting
                  ? "Importing…"
                  : `Import ${parsedRows.length} row${parsedRows.length === 1 ? "" : "s"}`}
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-5">
            <div className="rounded-lg border border-gray-200 bg-gray-50 px-4 py-3 text-sm dark:border-gray-700 dark:bg-white/[0.03]">
              <span className="font-medium text-success-700 dark:text-success-400">
                {summary.imported} imported
              </span>
              {" · "}
              <span className="font-medium text-error-600 dark:text-error-400">
                {summary.failed} not imported
              </span>
              {summary.skipped > 0 && (
                <>
                  {" · "}
                  <span className="text-gray-600 dark:text-gray-400">
                    {summary.skipped} unchanged
                  </span>
                </>
              )}
            </div>

            {errorRows.length > 0 && (
              <div>
                <h3 className="mb-2 text-sm font-semibold text-error-600 dark:text-error-400">
                  Rows / columns not imported
                </h3>
                <div className="max-h-52 overflow-y-auto rounded-lg border border-error-200 dark:border-error-500/30">
                  <table className="w-full text-left text-xs">
                    <thead className="sticky top-0 bg-error-50 text-error-800 dark:bg-error-500/10 dark:text-error-300">
                      <tr>
                        <th className="px-3 py-2">Row</th>
                        <th className="px-3 py-2">Email</th>
                        <th className="px-3 py-2">Column</th>
                        <th className="px-3 py-2">Reason</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-error-100 dark:divide-error-500/10">
                      {errorRows.map((e, i) => (
                        <tr key={`${e.rowNumber}-${e.field}-${i}`}>
                          <td className="px-3 py-2">{e.rowNumber || "—"}</td>
                          <td className="px-3 py-2 font-mono">{e.email || "—"}</td>
                          <td className="px-3 py-2 font-medium">{e.field}</td>
                          <td className="px-3 py-2">{e.message}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {successResults.length > 0 && (
              <div>
                <h3 className="mb-2 text-sm font-semibold text-gray-900 dark:text-white">
                  Successfully imported
                </h3>
                <div className="max-h-40 overflow-y-auto rounded-lg border border-gray-200 dark:border-gray-700">
                  <table className="w-full text-left text-sm">
                    <thead className="sticky top-0 bg-gray-50 text-xs uppercase text-gray-500 dark:bg-gray-800">
                      <tr>
                        <th className="px-3 py-2">Row</th>
                        <th className="px-3 py-2">Email</th>
                        <th className="px-3 py-2">Status</th>
                        <th className="px-3 py-2">Details</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                      {successResults.map((r) => (
                        <tr key={`${r.rowNumber}-${r.email}`}>
                          <td className="px-3 py-2 text-xs">{r.rowNumber ?? "—"}</td>
                          <td className="px-3 py-2 font-mono text-xs">{r.email}</td>
                          <td className="px-3 py-2">
                            <span
                              className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_STYLES[r.status]}`}
                            >
                              {STATUS_LABEL[r.status]}
                            </span>
                          </td>
                          <td className="px-3 py-2 text-xs text-gray-500 dark:text-gray-400">
                            {r.membershipGranted
                              ? `Membership + ${r.coursesEnrolled ?? 0} course(s)`
                              : r.userCreated
                                ? "User created"
                                : "Profile updated"}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            <div className="flex justify-end">
              <Button type="button" onClick={onClose}>
                Done
              </Button>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
}
