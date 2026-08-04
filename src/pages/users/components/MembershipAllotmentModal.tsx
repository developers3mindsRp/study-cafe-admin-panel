import { useEffect, useMemo, useState } from "react";
import { Modal } from "../../../components/ui/modal";
import Label from "../../../components/form/Label";
import { CsvEmailUpload, type AllotmentRow } from "./CsvEmailUpload";
import {
  plansApi,
  bulkGrantMembershipByEmails,
  type Plan,
  type BulkMembershipResult,
} from "../../../api/plans";
import { formatDate as _formatDate } from "../../../utils/formatDate";

interface MembershipAllotmentModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type Step = "form" | "results";

const STATUS_STYLES: Record<BulkMembershipResult["status"], string> = {
  granted: "bg-success-50 text-success-700 dark:bg-success-500/10 dark:text-success-400",
  granted_expired: "bg-warning-50 text-warning-700 dark:bg-warning-500/10 dark:text-warning-400",
  already_member: "bg-warning-50 text-warning-700 dark:bg-warning-500/10 dark:text-warning-400",
  user_not_found: "bg-error-50 text-error-600 dark:bg-error-500/10 dark:text-error-400",
  error: "bg-error-50 text-error-600 dark:bg-error-500/10 dark:text-error-400",
  invalid: "bg-error-50 text-error-600 dark:bg-error-500/10 dark:text-error-400",
};

const STATUS_LABEL: Record<BulkMembershipResult["status"], string> = {
  granted: "Granted",
  granted_expired: "Granted — expired",
  already_member: "Already a member",
  user_not_found: "User not found",
  error: "Error",
  invalid: "Rejected",
};

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MAX_PAYMENT_ID_LENGTH = 128;

/**
 * Above this many rows the editable review grid is replaced by a summary plus the rows
 * that need fixing. A 1000-row upload would otherwise mount ~3,000 controlled inputs and
 * re-validate all of them on every keystroke, which makes the modal unusable — and at
 * that size nobody is hand-editing rows anyway; they fix the file and re-upload.
 */
const MAX_EDITABLE_ROWS = 200;

/** Review-row layout — see CourseAllotmentModal; stacks below `sm`. */
const REVIEW_GRID = "sm:grid-cols-[minmax(0,1fr)_6.5rem_10rem_1.5rem]";
const ROW_INPUT =
  "w-full rounded-md border border-gray-200 bg-transparent px-2 py-1.5 text-sm text-gray-800 placeholder:text-gray-300 focus:border-brand-400 focus:outline-none dark:border-gray-700 dark:text-gray-200 dark:placeholder:text-gray-600";

function formatDate(iso: string) {
  return _formatDate(iso);
}

function toDatetimeLocal(d: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function computeExpiry(plan: Plan, from: Date): Date {
  if (plan.is_lifetime || !plan.duration_days) {
    return new Date(from.getFullYear() + 10, from.getMonth(), from.getDate());
  }
  return new Date(from.getTime() + plan.duration_days * 24 * 60 * 60 * 1000);
}

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
 *
 * Unlike course allotment, a payment id may repeat across rows: one Razorpay settlement
 * commonly covers a whole membership allotment, and these orders record that reference
 * per order rather than as a unique capture ref. The form-level id therefore applies to
 * every row, not just a single-row upload.
 */
function validateRows(
  rows: AllotmentRow[],
  defaultPrice: string,
  defaultPaymentId: string,
): (string | null)[] {
  const errors: (string | null)[] = new Array(rows.length).fill(null);
  const seenEmails = new Set<string>();
  const effectiveDefaultPaymentId = defaultPaymentId.trim();

  rows.forEach((row, i) => {
    const fail = (message: string) => {
      errors[i] = message;
    };

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

    // Recorded whatever the amount — a ₹0 order still carries the real reference.
    const paymentId = (row.paymentId.trim() || effectiveDefaultPaymentId).trim();
    if (paymentId.length > MAX_PAYMENT_ID_LENGTH) {
      return fail(`Payment ID must be ${MAX_PAYMENT_ID_LENGTH} characters or fewer`);
    }
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

export function MembershipAllotmentModal({ isOpen, onClose }: MembershipAllotmentModalProps) {
  const [step, setStep] = useState<Step>("form");

  // Form state — `rows` is the single source of truth for who gets allotted and for how much.
  const [rows, setRows] = useState<AllotmentRow[]>([]);
  const [pasteRaw, setPasteRaw] = useState("");
  const [plans, setPlans] = useState<Plan[]>([]);
  const [plansLoading, setPlansLoading] = useState(false);
  const [selectedPlanId, setSelectedPlanId] = useState<number | "">("");
  const [price, setPrice] = useState("");
  const [paymentId, setPaymentId] = useState("");
  const [dateOfPurchase, setDateOfPurchase] = useState(() =>
    new Date().toISOString().slice(0, 16).replace("T", " "),
  );
  /** Explicit acknowledgement that an already-expired allotment is intended. */
  const [expiredAcknowledged, setExpiredAcknowledged] = useState(false);

  // Submit state
  const [submitting, setSubmitting] = useState(false);
  const [results, setResults] = useState<BulkMembershipResult[]>([]);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [grantedExpiresAt, setGrantedExpiresAt] = useState<string>("");

  useEffect(() => {
    if (!isOpen) return;
    setPlansLoading(true);
    plansApi
      .list({ limit: 50 })
      .then((res) => setPlans(res.data ?? []))
      .catch(() => setPlans([]))
      .finally(() => setPlansLoading(false));
  }, [isOpen]);

  const resetForm = () => {
    setRows([]);
    setPasteRaw("");
    setPrice("");
    setPaymentId("");
    setResults([]);
    setSubmitError(null);
    setGrantedExpiresAt("");
    setExpiredAcknowledged(false);
  };

  useEffect(() => {
    if (!isOpen) {
      setTimeout(() => {
        setStep("form");
        setSelectedPlanId("");
        setDateOfPurchase(new Date().toISOString().slice(0, 16).replace("T", " "));
        resetForm();
      }, 300);
    }
  }, [isOpen]);

  const rowErrors = useMemo(() => validateRows(rows, price, paymentId), [rows, price, paymentId]);
  const errorCount = rowErrors.filter(Boolean).length;
  const hasFilePaymentData = rows.some((r) => r.amount.trim() !== "" || r.paymentId.trim() !== "");
  const showEditableGrid = rows.length > 0 && rows.length <= MAX_EDITABLE_ROWS;

  const selectedPlan = plans.find((p) => p.id === Number(selectedPlanId));
  const purchaseDate = dateOfPurchase ? new Date(dateOfPurchase.replace(" ", "T")) : new Date();
  const validPurchaseDate = isNaN(purchaseDate.getTime()) ? new Date() : purchaseDate;
  const computedExpiry = selectedPlan ? computeExpiry(selectedPlan, validPurchaseDate) : null;

  /**
   * Backdating further than the plan lasts computes an expiry that has already passed.
   * Such an allotment books a paid order but confers no access, and re-running the file
   * books another order every time (the duplicate guard only sees active memberships).
   * Legitimate for recording a lapsed historical purchase, so it is confirmable rather
   * than blocked — but never silent. The server enforces the same rule.
   */
  const allotmentIsExpired = !!computedExpiry && computedExpiry.getTime() <= Date.now();

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
    selectedPlanId !== "" &&
    (!allotmentIsExpired || expiredAcknowledged) &&
    !submitting;

  const handleSubmit = async () => {
    if (!canSubmit || !selectedPlan || !computedExpiry) return;
    setSubmitting(true);
    setSubmitError(null);
    try {
      const startsAt = validPurchaseDate.toISOString();
      const expiresAt = computedExpiry.toISOString();
      // Store human-readable "YYYY-MM-DD HH:MM" in the plan JSON
      const planPurchasedFormatted = toDatetimeLocal(validPurchaseDate);
      const planExpiryFormatted = toDatetimeLocal(computedExpiry);
      const planValidity = selectedPlan.is_lifetime
        ? undefined
        : selectedPlan.duration_days
          ? String(selectedPlan.duration_days)
          : undefined;

      const res = await bulkGrantMembershipByEmails({
        entries: rows.map((r) => ({
          email: r.email.trim().toLowerCase(),
          price: r.amount.trim() || undefined,
          paymentId: r.paymentId.trim() || undefined,
        })),
        membershipType: selectedPlan.slug,
        startsAt,
        expiresAt,
        price: price.trim() || undefined,
        paymentId: paymentId.trim() || undefined,
        planValidity,
        planPurchasedFormatted,
        planExpiryFormatted,
        allowExpired: allotmentIsExpired || undefined,
      });
      setGrantedExpiresAt(expiresAt);
      setResults(res);
      setStep("results");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to grant memberships. Please try again.";
      setSubmitError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const granted = results.filter((r) => r.status === "granted").length;
  const grantedExpired = results.filter((r) => r.status === "granted_expired").length;
  const skipped = results.filter((r) => r.status === "already_member").length;
  const failed = results.filter(
    (r) => r.status === "user_not_found" || r.status === "error" || r.status === "invalid",
  ).length;
  const replaced = results.filter(
    (r) => (r.status === "granted" || r.status === "granted_expired") && r.replacedPlan,
  ).length;

  /**
   * Rows that need the admin's attention. `granted_expired` is excluded — it was
   * explicitly confirmed, so it is an intended outcome rather than something to fix.
   */
  const needsAttention = results.filter(
    (r) => r.status !== "granted" && r.status !== "granted_expired",
  );

  const downloadFailedRows = () => {
    const originalByEmail = new Map(rows.map((r) => [r.email.trim().toLowerCase(), r]));
    downloadCsv(
      "membership-allotment-rows-to-fix.csv",
      ["email", "amount_paid", "payment_id", "reason"],
      needsAttention.map((r) => {
        const original = originalByEmail.get(r.email);
        return [
          r.email,
          original?.amount ?? (r.amount != null ? String(r.amount) : ""),
          original?.paymentId ?? r.paymentId ?? "",
          r.message || STATUS_LABEL[r.status],
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
            Membership Allotment
          </h3>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Grant a membership plan to multiple users at once, recording the amount paid and
            payment ID for each.
          </p>
        </div>

        {step === "form" && (
          <div className="space-y-5">
            {/* Row input */}
            <div>
              <Label htmlFor="membership-allotment-emails">
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
                  sampleHref="/samples/sample-membership-allotment.csv"
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
                    id="membership-allotment-emails"
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

                {showEditableGrid ? (
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
                ) : (
                  /* Large upload — summarise, and surface only what blocks submission. */
                  <div className="rounded-xl border border-gray-200 dark:border-gray-700">
                    <p className="border-b border-gray-100 px-4 py-3 text-sm text-gray-600 dark:border-gray-800 dark:text-gray-300">
                      {rows.length} rows loaded — too many to edit here. Rows with a problem are
                      listed below; fix them in your file and re-upload.
                    </p>
                    {errorCount === 0 ? (
                      <p className="px-4 py-3 text-sm text-success-600 dark:text-success-400">
                        No problems found. Ready to allot.
                      </p>
                    ) : (
                      <div className="max-h-56 divide-y divide-gray-100 overflow-y-auto dark:divide-gray-800">
                        {rows.map((row, i) =>
                          rowErrors[i] ? (
                            <div key={`${row.email}-${i}`} className="px-4 py-2">
                              <p className="truncate text-sm text-gray-800 dark:text-gray-200">
                                {row.email || <span className="italic text-gray-400">(blank email)</span>}
                              </p>
                              <p className="text-xs text-error-600 dark:text-error-400">
                                {rowErrors[i]}
                              </p>
                            </div>
                          ) : null,
                        )}
                      </div>
                    )}
                  </div>
                )}

                <p className="mt-1 text-xs text-gray-400">
                  Amount and Payment ID are both optional. Leave Payment ID blank and a reference is
                  generated automatically; blank amount records ₹0 as a free allotment. Every row
                  creates an order and a payment record either way. The same Payment ID may be used
                  on any number of rows — one settlement can cover the whole allotment.
                </p>
              </div>
            )}

            {/* Plan */}
            <div>
              <Label htmlFor="membership-allotment-plan">Membership Plan</Label>
              {plansLoading ? (
                <p className="mt-1.5 text-sm text-gray-400">Loading plans…</p>
              ) : (
                <select
                  id="membership-allotment-plan"
                  value={selectedPlanId}
                  onChange={(e) =>
                    setSelectedPlanId(e.target.value === "" ? "" : Number(e.target.value))
                  }
                  className="mt-1.5 w-full rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm text-gray-900 focus:border-brand-500 focus:outline-none dark:border-gray-700 dark:text-white"
                >
                  <option value="">Select a plan</option>
                  {plans.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                      {p.is_lifetime ? " — Lifetime" : p.duration_days ? ` — ${p.duration_days} days` : ""}
                    </option>
                  ))}
                </select>
              )}
              <p className="mt-1 text-xs text-gray-400">
                Users already on this plan are skipped. Users on a different plan are moved to this one.
              </p>
            </div>

            <div className="grid gap-5 sm:grid-cols-2">
              {/* Default price */}
              <div>
                <Label htmlFor="membership-allotment-price">Default Amount Paid</Label>
                <p className="mb-1.5 text-xs text-brand-500 italic">
                  Used only for rows with a blank amount. Blank = free allotment.
                </p>
                <input
                  id="membership-allotment-price"
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
                <Label htmlFor="membership-allotment-payment-id">Default RazorPay Payment ID</Label>
                <p className="mb-1.5 text-xs text-brand-500 italic">
                  Used for rows with a blank payment ID. The same ID may cover every user.
                </p>
                <input
                  id="membership-allotment-payment-id"
                  type="text"
                  value={paymentId}
                  onChange={(e) => setPaymentId(e.target.value)}
                  placeholder="e.g. pay_SqLNksiHVGuUeJ"
                  className="w-full rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:border-brand-500 focus:outline-none dark:border-gray-700 dark:text-white dark:placeholder:text-gray-500"
                />
              </div>
            </div>

            {hasFilePaymentData && (
              <p className="rounded-lg bg-brand-50 px-4 py-2.5 text-xs text-brand-600 dark:bg-brand-500/10 dark:text-brand-400">
                Values from your file take priority over the defaults above.
              </p>
            )}

            {/* Date of Purchase */}
            <div>
              <Label htmlFor="membership-allotment-dop">Date of Purchase</Label>
              <input
                id="membership-allotment-dop"
                type="text"
                value={dateOfPurchase}
                onChange={(e) => setDateOfPurchase(e.target.value)}
                placeholder="YYYY-MM-DD HH:MM"
                className="mt-1.5 w-full rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm text-gray-900 focus:border-brand-500 focus:outline-none dark:border-gray-700 dark:text-white"
              />
              <p className="mt-1 text-xs text-gray-400">Format: YYYY-MM-DD HH:MM. Auto-filled to now.</p>
            </div>

            {/* Plan Expiry (read-only, computed) */}
            {selectedPlan && computedExpiry && (
              <div>
                <Label>Plan Expiry</Label>
                <input
                  type="text"
                  readOnly
                  value={formatDate(computedExpiry.toISOString())}
                  className={`mt-1.5 w-full cursor-not-allowed rounded-lg border px-4 py-2.5 text-sm dark:bg-gray-800 ${
                    allotmentIsExpired
                      ? "border-warning-300 bg-warning-50 text-warning-700 dark:border-warning-500/40 dark:text-warning-400"
                      : "border-gray-200 bg-gray-50 text-gray-500 dark:border-gray-700 dark:text-gray-400"
                  }`}
                />
                <p className="mt-1 text-xs text-gray-400">
                  Auto-computed from plan duration
                  {selectedPlan.is_lifetime
                    ? " (lifetime — 10 yr)"
                    : selectedPlan.duration_days
                      ? ` (${selectedPlan.duration_days} days)`
                      : ""}
                  .
                </p>
              </div>
            )}

            {/* Already-expired allotment — must be acknowledged before submitting. */}
            {allotmentIsExpired && computedExpiry && (
              <div className="rounded-xl border border-warning-300 bg-warning-50 p-4 dark:border-warning-500/40 dark:bg-warning-500/10">
                <p className="text-sm font-medium text-warning-700 dark:text-warning-400">
                  This membership expired on {formatDate(computedExpiry.toISOString())}
                </p>
                <p className="mt-1 text-xs text-warning-700/80 dark:text-warning-400/80">
                  The date of purchase is further back than the plan lasts, so all{" "}
                  {rows.length || 0} user{rows.length !== 1 ? "s" : ""} would get a paid order and{" "}
                  <strong>no access</strong>. No membership email is sent. Re-uploading this file
                  will book another order each time, because the duplicate check only sees active
                  memberships. Move the date of purchase forward unless you are deliberately
                  recording a lapsed past purchase.
                </p>
                <label className="mt-3 flex cursor-pointer items-start gap-2 text-xs text-warning-700 dark:text-warning-400">
                  <input
                    type="checkbox"
                    checked={expiredAcknowledged}
                    onChange={(e) => setExpiredAcknowledged(e.target.checked)}
                    className="mt-0.5 size-3.5 shrink-0 accent-warning-500"
                  />
                  <span>Record this as an expired backfill — orders only, no access.</span>
                </label>
              </div>
            )}

            {submitError && (
              <p className="rounded-lg bg-error-50 px-4 py-3 text-sm text-error-600 dark:bg-error-500/10 dark:text-error-400">
                {submitError}
              </p>
            )}

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
                  ? "Granting…"
                  : `Grant to ${rows.length > 0 ? rows.length : ""} User${rows.length !== 1 ? "s" : ""}`}
              </button>
            </div>
          </div>
        )}

        {step === "results" && (
          <div className="space-y-5">
            {/* Summary */}
            <div className="rounded-xl border border-gray-200 bg-gray-50 p-4 dark:border-gray-700 dark:bg-white/[0.02]">
              <p className="mb-1 text-sm font-medium text-gray-700 dark:text-gray-300">
                {selectedPlan?.name}
                {grantedExpiresAt && (
                  <span className="ml-1 font-normal text-gray-400">
                    · expires {formatDate(grantedExpiresAt)}
                  </span>
                )}
              </p>
              <div className="mt-2 flex flex-wrap gap-4 text-sm">
                <span className="font-medium text-success-600 dark:text-success-400">
                  {granted} granted
                </span>
                {grantedExpired > 0 && (
                  <span className="font-medium text-warning-600 dark:text-warning-400">
                    {grantedExpired} recorded expired
                  </span>
                )}
                {skipped > 0 && (
                  <span className="font-medium text-warning-600 dark:text-warning-400">
                    {skipped} already a member
                  </span>
                )}
                {failed > 0 && (
                  <span className="font-medium text-error-600 dark:text-error-400">
                    {failed} failed
                  </span>
                )}
              </div>
              {grantedExpired > 0 && (
                <p className="mt-2 text-xs text-warning-600 dark:text-warning-400">
                  {grantedExpired} allotment{grantedExpired !== 1 ? "s were" : " was"} recorded with
                  an expiry already in the past — those users have a paid order but no access, and
                  were not emailed.
                </p>
              )}
              {replaced > 0 && (
                <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                  {replaced} user{replaced !== 1 ? "s were" : " was"} moved from a different plan —
                  their previous membership has been expired.
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
                      {(r.status === "granted" || r.status === "granted_expired") && r.replacedPlan && (
                        <span
                          title={`Previous "${r.replacedPlan}" membership was expired.`}
                          className="rounded-md bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-600 dark:bg-gray-800 dark:text-gray-400"
                        >
                          was {r.replacedPlan}
                        </span>
                      )}
                      <span
                        className={`rounded-md px-2 py-0.5 text-xs font-medium ${STATUS_STYLES[r.status]}`}
                      >
                        {STATUS_LABEL[r.status]}
                      </span>
                    </div>
                  </div>
                  {r.message && (
                    <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">{r.message}</p>
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
