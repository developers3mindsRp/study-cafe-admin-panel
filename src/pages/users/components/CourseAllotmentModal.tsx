import { useEffect, useMemo, useState } from "react";
import { Modal } from "../../../components/ui/modal";
import Label from "../../../components/form/Label";
import SearchableSelect from "../../../components/form/SearchableSelect";
import { CsvEmailUpload, type AllotmentRow } from "./CsvEmailUpload";
import {
  fetchCourses,
  fetchCourseBatches,
  bulkEnrollByEmails,
  type Course,
  type BulkEnrollResult,
} from "../../../api/courses";

interface CourseAllotmentModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type Step = "form" | "results";

const STATUS_STYLES: Record<BulkEnrollResult["status"], string> = {
  enrolled: "bg-success-50 text-success-700 dark:bg-success-500/10 dark:text-success-400",
  already_enrolled: "bg-warning-50 text-warning-700 dark:bg-warning-500/10 dark:text-warning-400",
  user_not_found: "bg-error-50 text-error-600 dark:bg-error-500/10 dark:text-error-400",
  error: "bg-error-50 text-error-600 dark:bg-error-500/10 dark:text-error-400",
  invalid: "bg-error-50 text-error-600 dark:bg-error-500/10 dark:text-error-400",
};

const STATUS_LABEL: Record<BulkEnrollResult["status"], string> = {
  enrolled: "Enrolled",
  already_enrolled: "Already enrolled",
  user_not_found: "User not found",
  error: "Error",
  invalid: "Rejected",
};

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MAX_PAYMENT_ID_LENGTH = 128;

/**
 * Review-row layout. Fields stack into a single column on phones and only line up as
 * columns from `sm` — fixed pixel widths here would push the modal into a horizontal
 * scroll on any narrow screen. `minmax(0,1fr)` lets the email column actually shrink.
 */
const REVIEW_GRID = "sm:grid-cols-[minmax(0,1fr)_6.5rem_10rem_1.5rem]";
const ROW_INPUT =
  "w-full rounded-md border border-gray-200 bg-transparent px-2 py-1.5 text-sm text-gray-800 placeholder:text-gray-300 focus:border-brand-400 focus:outline-none dark:border-gray-700 dark:text-gray-200 dark:placeholder:text-gray-600";

/**
 * Mirror of the server's amount parsing. "₹12,979" and "Rs. 999" are accepted and cleaned
 * up; anything still unparseable returns null and is flagged here, instead of collapsing
 * to a ₹0 free allotment further down the stack.
 */
function normalizeAmount(raw: string): number | null {
  const trimmed = raw.trim();
  if (!trimmed) return 0;
  const cleaned = trimmed.replace(/^(?:rs\.?|inr)\s*/i, "").replace(/[₹,\s]/g, "");
  if (!cleaned) return 0;
  if (!/^-?\d+(?:\.\d+)?$/.test(cleaned)) return null;
  const num = Number(cleaned);
  return Number.isFinite(num) ? num : null;
}

/**
 * Validate every row before submit. Same rules as the server so nothing reaches the API
 * that would be rejected there — the admin fixes the file once, with the offending row
 * pointed out, rather than discovering failures scattered through a results list.
 */
function validateRows(
  rows: AllotmentRow[],
  defaultPrice: string,
  defaultPaymentId: string,
): (string | null)[] {
  const errors: (string | null)[] = new Array(rows.length).fill(null);
  const seenEmails = new Set<string>();
  const seenPaymentIds = new Set<string>();
  // One Razorpay id can only ever back one order, so the form-level id is a usable
  // default only when the upload is a single row.
  const effectiveDefaultPaymentId = rows.length === 1 ? defaultPaymentId.trim() : "";

  rows.forEach((row, i) => {
    const fail = (message: string) => { errors[i] = message; };

    const email = row.email.trim().toLowerCase();
    if (!email) return fail("Email is required");
    if (!EMAIL_RE.test(email)) return fail("Not a valid email address");
    if (seenEmails.has(email)) return fail("Duplicate email — remove this row");
    seenEmails.add(email);

    const amount = normalizeAmount(row.amount.trim() || defaultPrice);
    if (amount === null) {
      return fail(`"${row.amount.trim() || defaultPrice}" is not a valid amount — use a number like 12979`);
    }
    if (amount < 0) return fail("Amount cannot be negative");

    // Recorded whatever the amount — a ₹0 order still gets the real capture reference.
    const paymentId = (row.paymentId.trim() || effectiveDefaultPaymentId).trim();
    if (!paymentId) return;
    if (paymentId.length > MAX_PAYMENT_ID_LENGTH) {
      return fail(`Payment ID must be ${MAX_PAYMENT_ID_LENGTH} characters or fewer`);
    }
    if (seenPaymentIds.has(paymentId)) {
      return fail("This payment ID is already used on another row");
    }
    seenPaymentIds.add(paymentId);
  });

  return errors;
}

function csvCell(value: string): string {
  return /[",\n]/.test(value) ? `"${value.replace(/"/g, '""')}"` : value;
}

function downloadCsv(filename: string, header: string[], rows: string[][]) {
  const body = [header, ...rows].map((r) => r.map(csvCell).join(",")).join("\n");
  const url = URL.createObjectURL(new Blob([body], { type: "text/csv;charset=utf-8;" }));
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export function CourseAllotmentModal({ isOpen, onClose }: CourseAllotmentModalProps) {
  const [step, setStep] = useState<Step>("form");

  // Form state — `rows` is the single source of truth for who gets allotted and for how much.
  const [rows, setRows] = useState<AllotmentRow[]>([]);
  const [pasteRaw, setPasteRaw] = useState("");
  const [courses, setCourses] = useState<Course[]>([]);
  const [coursesLoading, setCoursesLoading] = useState(false);
  const [selectedCourseId, setSelectedCourseId] = useState<number | "">("");
  const [batches, setBatches] = useState<{ id: number; name: string }[]>([]);
  const [batchesLoading, setBatchesLoading] = useState(false);
  const [selectedBatchId, setSelectedBatchId] = useState<number | "">("");
  const [price, setPrice] = useState("");
  const [paymentId, setPaymentId] = useState("");

  // Submit state
  const [submitting, setSubmitting] = useState(false);
  const [results, setResults] = useState<BulkEnrollResult[]>([]);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // Load courses when modal opens
  useEffect(() => {
    if (!isOpen) return;
    setCoursesLoading(true);
    fetchCourses()
      .then(setCourses)
      .catch(() => setCourses([]))
      .finally(() => setCoursesLoading(false));
  }, [isOpen]);

  // Load batches when course changes
  useEffect(() => {
    if (!selectedCourseId) {
      setBatches([]);
      setSelectedBatchId("");
      return;
    }
    setBatchesLoading(true);
    fetchCourseBatches(Number(selectedCourseId))
      .then((b) => {
        setBatches(b);
        setSelectedBatchId(b[0]?.id ?? "");
      })
      .catch(() => setBatches([]))
      .finally(() => setBatchesLoading(false));
  }, [selectedCourseId]);

  const resetForm = () => {
    setRows([]);
    setPasteRaw("");
    setPrice("");
    setPaymentId("");
    setResults([]);
    setSubmitError(null);
  };

  // Reset on close
  useEffect(() => {
    if (!isOpen) {
      setTimeout(() => {
        setStep("form");
        setSelectedCourseId("");
        setBatches([]);
        setSelectedBatchId("");
        resetForm();
      }, 300);
    }
  }, [isOpen]);

  const rowErrors = useMemo(
    () => validateRows(rows, price, paymentId),
    [rows, price, paymentId],
  );
  const errorCount = rowErrors.filter(Boolean).length;
  const hasCsvPaymentData = rows.some((r) => r.amount.trim() !== "" || r.paymentId.trim() !== "");

  const addPastedEmails = () => {
    const parsed = pasteRaw
      .split(/[\n,;]+/)
      .map((e) => e.trim().toLowerCase())
      .filter((e) => e.length > 0);
    if (parsed.length === 0) return;
    setRows((prev) => {
      const existing = new Set(prev.map((r) => r.email.trim().toLowerCase()));
      const fresh = parsed
        .filter((e) => !existing.has(e))
        .map((email) => ({ email, amount: "", paymentId: "" }));
      return [...prev, ...fresh];
    });
    setPasteRaw("");
  };

  const updateRow = (index: number, patch: Partial<AllotmentRow>) => {
    setRows((prev) => prev.map((r, i) => (i === index ? { ...r, ...patch } : r)));
  };

  const removeRow = (index: number) => {
    setRows((prev) => prev.filter((_, i) => i !== index));
  };

  const canSubmit =
    rows.length > 0 &&
    errorCount === 0 &&
    selectedCourseId !== "" &&
    selectedBatchId !== "" &&
    !submitting;

  const handleSubmit = async () => {
    if (!canSubmit) return;
    setSubmitting(true);
    setSubmitError(null);
    try {
      const res = await bulkEnrollByEmails(
        Number(selectedBatchId),
        rows.map((r) => ({
          email: r.email.trim().toLowerCase(),
          price: r.amount.trim() || undefined,
          paymentId: r.paymentId.trim() || undefined,
        })),
        {
          price: price.trim() || undefined,
          paymentId: paymentId.trim() || undefined,
          courseId: Number(selectedCourseId),
        },
      );
      setResults(res);
      setStep("results");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to allot courses. Please try again.";
      setSubmitError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const enrolled = results.filter((r) => r.status === "enrolled").length;
  const failed = results.filter(
    (r) => r.status === "user_not_found" || r.status === "error" || r.status === "invalid",
  ).length;
  const skipped = results.filter((r) => r.status === "already_enrolled").length;
  const orderIssues = results.filter((r) => r.status === "enrolled" && r.orderCreated === false).length;

  const selectedCourse = courses.find((c) => c.id === Number(selectedCourseId));
  const selectedBatch = batches.find((b) => b.id === Number(selectedBatchId));

  /** Rows that need the admin's attention, re-exported in the same shape they uploaded. */
  const needsAttention = results.filter(
    (r) => r.status !== "enrolled" || r.orderCreated === false,
  );

  const downloadFailedRows = () => {
    const originalByEmail = new Map(rows.map((r) => [r.email.trim().toLowerCase(), r]));
    downloadCsv(
      "allotment-rows-to-fix.csv",
      ["email", "amount_paid", "payment_id", "reason"],
      needsAttention.map((r) => {
        const original = originalByEmail.get(r.email);
        return [
          r.email,
          original?.amount ?? (r.amount != null ? String(r.amount) : ""),
          original?.paymentId ?? r.paymentId ?? "",
          r.orderError || r.message || STATUS_LABEL[r.status],
        ];
      }),
    );
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      showCloseButton
      className="max-w-2xl w-full m-4 max-h-[90vh] overflow-y-auto"
    >
      <div className="p-5 sm:p-8">
        {/* Header */}
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Course Allotment
          </h3>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Enroll multiple users into a course batch, recording the amount paid and payment ID for each.
          </p>
        </div>

        {step === "form" && (
          <div className="space-y-5">
            {/* Row input */}
            <div>
              <Label htmlFor="allotment-emails">
                Users
                {rows.length > 0 && (
                  <span className="ml-2 text-xs font-normal text-gray-400">
                    ({rows.length} row{rows.length !== 1 ? "s" : ""})
                  </span>
                )}
              </Label>
              <div className="mt-1.5 space-y-2">
                <CsvEmailUpload
                  withPayment
                  onRows={(incoming) =>
                    setRows((prev) => {
                      const existing = new Set(prev.map((r) => r.email.trim().toLowerCase()));
                      return [
                        ...prev,
                        ...incoming.filter((r) => !existing.has(r.email.trim().toLowerCase())),
                      ];
                    })
                  }
                />
                <div className="flex flex-col gap-2 sm:flex-row">
                  <textarea
                    id="allotment-emails"
                    value={pasteRaw}
                    onChange={(e) => setPasteRaw(e.target.value)}
                    rows={2}
                    placeholder={"Or paste emails: user1@example.com, user2@example.com"}
                    className="w-full rounded-lg border border-gray-300 bg-transparent px-4 py-3 text-sm text-gray-900 placeholder:text-gray-400 focus:border-brand-500 focus:outline-none dark:border-gray-700 dark:text-white dark:placeholder:text-gray-500"
                  />
                  <button
                    type="button"
                    onClick={addPastedEmails}
                    disabled={!pasteRaw.trim()}
                    className="shrink-0 rounded-lg border border-gray-300 px-4 py-2.5 text-sm font-medium text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50 sm:self-start dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800"
                  >
                    Add
                  </button>
                </div>
              </div>
            </div>

            {/* Review table */}
            {rows.length > 0 && (
              <div>
                <div className="mb-1.5 flex items-center justify-between">
                  <Label>Review</Label>
                  {errorCount > 0 ? (
                    <span className="text-xs font-medium text-error-600 dark:text-error-400">
                      {errorCount} row{errorCount !== 1 ? "s" : ""} need fixing before you can submit
                    </span>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setRows([])}
                      className="text-xs text-gray-400 underline hover:text-gray-600 dark:hover:text-gray-300"
                    >
                      Clear all
                    </button>
                  )}
                </div>
                <div className="max-h-64 overflow-y-auto rounded-xl border border-gray-200 sm:max-h-72 dark:border-gray-700">
                  {/* Column headings only make sense once the row lays out horizontally —
                      below `sm` each field carries its own inline label instead. */}
                  <div className={`${REVIEW_GRID} sticky top-0 z-10 hidden gap-2 bg-gray-50 px-3 py-2 text-xs font-medium uppercase tracking-wide text-gray-500 sm:grid dark:bg-gray-800 dark:text-gray-400`}>
                    <span>Email</span>
                    <span>Amount Paid</span>
                    <span>Payment ID</span>
                    <span />
                  </div>
                  {rows.map((row, i) => (
                    <div
                      key={`${row.email}-${i}`}
                      className={`${REVIEW_GRID} grid gap-2 border-t border-gray-100 px-3 py-2 sm:items-start dark:border-gray-800 ${
                        rowErrors[i] ? "bg-error-50/50 dark:bg-error-500/5" : ""
                      }`}
                    >
                      <div className="min-w-0">
                        <span className="mb-0.5 block text-xs text-gray-400 sm:hidden">Email</span>
                        <input
                          value={row.email}
                          onChange={(e) => updateRow(i, { email: e.target.value })}
                          className={ROW_INPUT}
                        />
                        {rowErrors[i] && (
                          <p className="mt-1 text-xs text-error-600 dark:text-error-400">
                            {rowErrors[i]}
                          </p>
                        )}
                      </div>
                      <div className="min-w-0">
                        <span className="mb-0.5 block text-xs text-gray-400 sm:hidden">Amount paid</span>
                        <input
                          value={row.amount}
                          onChange={(e) => updateRow(i, { amount: e.target.value })}
                          inputMode="decimal"
                          placeholder="0"
                          className={ROW_INPUT}
                        />
                      </div>
                      <div className="min-w-0">
                        <span className="mb-0.5 block text-xs text-gray-400 sm:hidden">Payment ID</span>
                        <input
                          value={row.paymentId}
                          onChange={(e) => updateRow(i, { paymentId: e.target.value })}
                          placeholder="—"
                          className={`${ROW_INPUT} font-mono text-xs`}
                        />
                      </div>
                      <button
                        type="button"
                        onClick={() => removeRow(i)}
                        title="Remove row"
                        aria-label={`Remove ${row.email || "row"}`}
                        className="justify-self-end px-2 text-lg leading-none text-gray-300 transition hover:text-error-500 sm:mt-1.5 sm:px-0"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
                <p className="mt-1 text-xs text-gray-400">
                  Amount and Payment ID are both optional. Leave Payment ID blank and a reference is
                  generated automatically; blank amount records ₹0. Every row creates an order and a
                  payment record either way. A Payment ID you do enter must be unique.
                </p>
              </div>
            )}

            {/* Course select */}
            <div>
              <Label htmlFor="allotment-course">Course</Label>
              {coursesLoading ? (
                <p className="mt-1.5 text-sm text-gray-400">Loading courses…</p>
              ) : (
                <div className="mt-1.5">
                  <SearchableSelect
                    id="allotment-course"
                    options={courses.map((c) => ({
                      value: String(c.id),
                      text: c.title || `Course #${c.id}`,
                    }))}
                    value={selectedCourseId === "" ? "" : String(selectedCourseId)}
                    onChange={(v) => setSelectedCourseId(v === "" ? "" : Number(v))}
                    placeholder="Select a course"
                    searchPlaceholder="Search courses by name…"
                    emptyMessage="No courses found."
                  />
                </div>
              )}
            </div>

            {/* Batch select */}
            {selectedCourseId !== "" && (
              <div>
                <Label htmlFor="allotment-batch">Batch</Label>
                {batchesLoading ? (
                  <p className="mt-1.5 text-sm text-gray-400">Loading batches…</p>
                ) : batches.length === 0 ? (
                  <p className="mt-1.5 text-sm text-gray-400 italic">
                    No batches available for this course.
                  </p>
                ) : (
                  <select
                    id="allotment-batch"
                    value={selectedBatchId}
                    onChange={(e) =>
                      setSelectedBatchId(e.target.value === "" ? "" : Number(e.target.value))
                    }
                    className="mt-1.5 w-full rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm text-gray-900 focus:border-brand-500 focus:outline-none dark:border-gray-700 dark:text-white"
                  >
                    <option value="">Select a batch</option>
                    {batches.map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.name}
                      </option>
                    ))}
                  </select>
                )}
              </div>
            )}

            <div className="grid gap-5 sm:grid-cols-2">
              {/* Default price */}
              <div>
                <Label htmlFor="allotment-price">Default Amount Paid</Label>
                <p className="mb-1.5 text-xs text-brand-500 italic">
                  Used only for rows with a blank amount.
                </p>
                <input
                  id="allotment-price"
                  type="number"
                  min="0"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  placeholder="e.g. 12979"
                  className="w-full rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:border-brand-500 focus:outline-none dark:border-gray-700 dark:text-white dark:placeholder:text-gray-500"
                />
              </div>

              {/* Default payment id */}
              <div>
                <Label htmlFor="allotment-payment-id">Default RazorPay Payment ID</Label>
                <p className="mb-1.5 text-xs text-brand-500 italic">
                  {rows.length > 1
                    ? "Ignored — a payment ID can only apply to one user. Use the CSV column."
                    : "Only applies to a single-user allotment."}
                </p>
                <input
                  id="allotment-payment-id"
                  type="text"
                  value={paymentId}
                  onChange={(e) => setPaymentId(e.target.value)}
                  disabled={rows.length > 1}
                  placeholder="e.g. pay_SqLNksiHVGuUeJ"
                  className="w-full rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:border-brand-500 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-700 dark:text-white dark:placeholder:text-gray-500"
                />
              </div>
            </div>

            {hasCsvPaymentData && (
              <p className="rounded-lg bg-brand-50 px-4 py-2.5 text-xs text-brand-600 dark:bg-brand-500/10 dark:text-brand-400">
                Values from your CSV take priority over the defaults above.
              </p>
            )}

            {submitError && (
              <p className="rounded-lg bg-error-50 px-4 py-3 text-sm text-error-600 dark:bg-error-500/10 dark:text-error-400">
                {submitError}
              </p>
            )}

            {/* Actions */}
            <div className="flex justify-end gap-3 pt-1">
              <button
                type="button"
                onClick={onClose}
                className="rounded-lg border border-gray-300 px-4 py-2.5 text-sm font-medium text-gray-700 transition hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSubmit}
                disabled={!canSubmit}
                className="rounded-lg bg-brand-500 px-5 py-2.5 text-sm font-medium text-white shadow-theme-xs transition hover:bg-brand-600 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {submitting
                  ? "Enrolling…"
                  : `Enroll ${rows.length > 0 ? rows.length : ""} User${rows.length !== 1 ? "s" : ""}`}
              </button>
            </div>
          </div>
        )}

        {step === "results" && (
          <div className="space-y-5">
            {/* Summary strip */}
            <div className="rounded-xl border border-gray-200 bg-gray-50 p-4 dark:border-gray-700 dark:bg-white/[0.02]">
              <p className="mb-1 text-sm font-medium text-gray-700 dark:text-gray-300">
                {selectedCourse?.title}
                {selectedBatch && (
                  <span className="ml-1 font-normal text-gray-400">· {selectedBatch.name}</span>
                )}
              </p>
              <div className="mt-2 flex flex-wrap gap-4 text-sm">
                <span className="text-success-600 dark:text-success-400 font-medium">
                  {enrolled} enrolled
                </span>
                {skipped > 0 && (
                  <span className="text-warning-600 dark:text-warning-400 font-medium">
                    {skipped} already enrolled
                  </span>
                )}
                {failed > 0 && (
                  <span className="text-error-600 dark:text-error-400 font-medium">
                    {failed} failed
                  </span>
                )}
              </div>
              {orderIssues > 0 && (
                <p className="mt-2 text-xs text-warning-600 dark:text-warning-400">
                  {orderIssues} user{orderIssues !== 1 ? "s" : ""} enrolled with access, but the payment record
                  couldn’t be created — these won’t show under Orders / “Purchased Course”. Fix the reason shown
                  below and create the order manually; re-uploading will skip them as already enrolled.
                </p>
              )}
            </div>

            {/* Per-row results */}
            <div className="max-h-72 space-y-2 overflow-y-auto pr-1">
              {results.map((r, i) => (
                <div
                  key={`${r.email}-${i}`}
                  className="rounded-lg border border-gray-100 bg-white px-4 py-2.5 dark:border-gray-800 dark:bg-gray-900/40"
                >
                  <div className="flex items-center justify-between gap-3">
                    <span className="truncate text-sm text-gray-800 dark:text-gray-200">
                      {r.email || <span className="italic text-gray-400">(blank email)</span>}
                    </span>
                    <div className="flex shrink-0 items-center gap-1.5">
                      {r.status === "enrolled" && r.orderCreated === false && (
                        <span
                          title="Enrolled and granted access, but the order/payment record wasn't created."
                          className="rounded-md bg-warning-50 px-2 py-0.5 text-xs font-medium text-warning-700 dark:bg-warning-500/10 dark:text-warning-400"
                        >
                          No payment record
                        </span>
                      )}
                      <span
                        className={`rounded-md px-2 py-0.5 text-xs font-medium ${STATUS_STYLES[r.status]}`}
                      >
                        {STATUS_LABEL[r.status]}
                      </span>
                    </div>
                  </div>
                  {(r.orderError || r.message) && (
                    <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                      {r.orderError || r.message}
                    </p>
                  )}
                </div>
              ))}
            </div>

            {/* Actions */}
            <div className="flex flex-col-reverse gap-3 pt-1 sm:flex-row sm:flex-wrap sm:justify-end">
              {needsAttention.length > 0 && (
                <button
                  type="button"
                  onClick={downloadFailedRows}
                  className="rounded-lg border border-gray-300 px-4 py-2.5 text-sm font-medium text-gray-700 transition hover:bg-gray-50 sm:mr-auto dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800"
                >
                  Download {needsAttention.length} row{needsAttention.length !== 1 ? "s" : ""} to fix
                </button>
              )}
              <button
                type="button"
                onClick={() => {
                  setStep("form");
                  resetForm();
                }}
                className="rounded-lg border border-gray-300 px-4 py-2.5 text-sm font-medium text-gray-700 transition hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800"
              >
                Allot More
              </button>
              <button
                type="button"
                onClick={onClose}
                className="rounded-lg bg-brand-500 px-5 py-2.5 text-sm font-medium text-white shadow-theme-xs transition hover:bg-brand-600"
              >
                Done
              </button>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
}
