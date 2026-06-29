import { useEffect, useState } from "react";
import { Modal } from "../../../components/ui/modal";
import Label from "../../../components/form/Label";
import Input from "../../../components/form/input/InputField";
import { CsvEmailUpload } from "./CsvEmailUpload";
import { plansApi, bulkGrantMembershipByEmails, type Plan, type BulkMembershipResult } from "../../../api/plans";
import { formatDate as _formatDate } from "../../../utils/formatDate";

interface MembershipAllotmentModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type Step = "form" | "results";

const STATUS_STYLES: Record<BulkMembershipResult["status"], string> = {
  granted: "bg-success-50 text-success-700 dark:bg-success-500/10 dark:text-success-400",
  user_not_found: "bg-error-50 text-error-600 dark:bg-error-500/10 dark:text-error-400",
  error: "bg-error-50 text-error-600 dark:bg-error-500/10 dark:text-error-400",
};

const STATUS_LABEL: Record<BulkMembershipResult["status"], string> = {
  granted: "Granted",
  user_not_found: "User not found",
  error: "Error",
};

function formatDate(iso: string) { return _formatDate(iso); }

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

export function MembershipAllotmentModal({ isOpen, onClose }: MembershipAllotmentModalProps) {
  const [step, setStep] = useState<Step>("form");

  const [emailsRaw, setEmailsRaw] = useState("");
  const [plans, setPlans] = useState<Plan[]>([]);
  const [plansLoading, setPlansLoading] = useState(false);
  const [selectedPlanId, setSelectedPlanId] = useState<number | "">("");
  const [price, setPrice] = useState("");
  const [paymentId, setPaymentId] = useState("");
  const [dateOfPurchase, setDateOfPurchase] = useState(() => {
    const now = new Date();
    return now.toISOString().slice(0, 16).replace("T", " ");
  });

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

  useEffect(() => {
    if (!isOpen) {
      setTimeout(() => {
        setStep("form");
        setEmailsRaw("");
        setSelectedPlanId("");
        setPrice("");
        setPaymentId("");
        setDateOfPurchase(new Date().toISOString().slice(0, 16).replace("T", " "));
        setResults([]);
        setSubmitError(null);
        setGrantedExpiresAt("");
      }, 300);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  const uniqueEmails = [
    ...new Set(
      emailsRaw
        .split(/[\n,;]+/)
        .map((e) => e.trim().toLowerCase())
        .filter(Boolean)
    ),
  ];

  const selectedPlan = plans.find((p) => p.id === Number(selectedPlanId));
  const purchaseDate = dateOfPurchase ? new Date(dateOfPurchase.replace(" ", "T")) : new Date();
  const computedExpiry = selectedPlan ? computeExpiry(selectedPlan, isNaN(purchaseDate.getTime()) ? new Date() : purchaseDate) : null;

  const canSubmit = uniqueEmails.length > 0 && selectedPlanId !== "" && !submitting;

  const handleSubmit = async () => {
    if (!canSubmit || !selectedPlan || !computedExpiry) return;
    setSubmitting(true);
    setSubmitError(null);
    try {
      const startDate = dateOfPurchase && !isNaN(new Date(dateOfPurchase.replace(" ", "T")).getTime())
        ? new Date(dateOfPurchase.replace(" ", "T"))
        : new Date();
      const startsAt = startDate.toISOString();
      const expiresAt = computedExpiry.toISOString();
      // Store human-readable "YYYY-MM-DD HH:MM" in the plan JSON
      const planPurchasedFormatted = toDatetimeLocal(startDate);
      const planExpiryFormatted = toDatetimeLocal(computedExpiry);
      const planValidity = selectedPlan.is_lifetime
        ? undefined
        : selectedPlan.duration_days
          ? String(selectedPlan.duration_days)
          : undefined;
      const res = await bulkGrantMembershipByEmails({
        emails: uniqueEmails,
        membershipType: selectedPlan.slug,
        startsAt,
        expiresAt,
        price: price.trim() || undefined,
        paymentId: paymentId.trim() || undefined,
        planValidity,
        planPurchasedFormatted,
        planExpiryFormatted,
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
  const failed = results.filter((r) => r.status === "user_not_found" || r.status === "error").length;

  return (
    <Modal isOpen={isOpen} onClose={onClose} showCloseButton className="max-w-xl w-full">
      <div className="p-6 sm:p-8">
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Membership Allotment
          </h3>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Grant a membership plan to multiple users at once by entering their email addresses.
          </p>
        </div>

        {step === "form" && (
          <div className="space-y-5">
            {/* Emails */}
            <div>
              <Label htmlFor="membership-allotment-emails">
                Email Addresses
                {uniqueEmails.length > 0 && (
                  <span className="ml-2 text-xs font-normal text-gray-400">
                    ({uniqueEmails.length} unique)
                  </span>
                )}
              </Label>
              <div className="mt-1.5 space-y-2">
                <CsvEmailUpload
                  onEmails={(extracted) =>
                    setEmailsRaw((prev) => (prev.trim() ? `${prev.trim()}\n${extracted}` : extracted))
                  }
                />
                <textarea
                  id="membership-allotment-emails"
                  value={emailsRaw}
                  onChange={(e) => setEmailsRaw(e.target.value)}
                  rows={4}
                  placeholder={"user1@example.com\nuser2@example.com, user3@example.com"}
                  className="w-full rounded-lg border border-gray-300 bg-transparent px-4 py-3 text-sm text-gray-900 placeholder:text-gray-400 focus:border-brand-500 focus:outline-none dark:border-gray-700 dark:text-white dark:placeholder:text-gray-500"
                />
              </div>
              <p className="mt-1 text-xs text-gray-400">
                Or type/paste emails separated by newlines, commas, or semicolons.
              </p>
            </div>

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
            </div>

            {/* Price */}
            <div>
              <Label htmlFor="membership-allotment-price">Price</Label>
              <Input
                id="membership-allotment-price"
                type="text"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                placeholder="eg. 3999"
              />
            </div>

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
                  className="mt-1.5 w-full rounded-lg border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm text-gray-500 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400 cursor-not-allowed"
                />
                <p className="mt-1 text-xs text-gray-400">
                  Auto-computed from plan duration
                  {selectedPlan.is_lifetime ? " (lifetime — 10 yr)" : selectedPlan.duration_days ? ` (${selectedPlan.duration_days} days)` : ""}.
                </p>
              </div>
            )}

            {/* RazorPay Payment ID */}
            <div>
              <Label htmlFor="membership-allotment-payment-id">RazorPay Payment ID</Label>
              <Input
                id="membership-allotment-payment-id"
                type="text"
                value={paymentId}
                onChange={(e) => setPaymentId(e.target.value)}
                placeholder="Payment ID"
              />
            </div>

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
                  : `Grant to ${uniqueEmails.length > 0 ? uniqueEmails.length : ""} User${uniqueEmails.length !== 1 ? "s" : ""}`}
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
                {failed > 0 && (
                  <span className="font-medium text-error-600 dark:text-error-400">
                    {failed} failed
                  </span>
                )}
              </div>
            </div>

            {/* Per-email results */}
            <div className="max-h-72 space-y-2 overflow-y-auto pr-1">
              {results.map((r) => (
                <div
                  key={r.email}
                  className="flex items-center justify-between gap-3 rounded-lg border border-gray-100 bg-white px-4 py-2.5 dark:border-gray-800 dark:bg-gray-900/40"
                >
                  <span className="truncate text-sm text-gray-800 dark:text-gray-200">
                    {r.email}
                  </span>
                  <span
                    className={`shrink-0 rounded-md px-2 py-0.5 text-xs font-medium ${STATUS_STYLES[r.status]}`}
                  >
                    {STATUS_LABEL[r.status]}
                  </span>
                </div>
              ))}
            </div>

            <div className="flex justify-end gap-3 pt-1">
              <button
                type="button"
                onClick={() => {
                  setStep("form");
                  setEmailsRaw("");
                  setResults([]);
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
