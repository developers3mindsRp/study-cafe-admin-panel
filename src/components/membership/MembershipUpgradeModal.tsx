import React, { useState, useEffect } from "react";
import { Modal } from "../ui/modal";
import Button from "../ui/button/Button";
import {
  fetchUpgradeSummary,
  createMembershipOrder,
  type Plan,
  type UpgradeSummaryResponse,
} from "../../api/plans";

interface MembershipUpgradeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  targetPlan: Plan | null;
}

function fmt(amount: number): string {
  return amount.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export const MembershipUpgradeModal: React.FC<MembershipUpgradeModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  targetPlan,
}) => {
  const [summary, setSummary] = useState<UpgradeSummaryResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (!isOpen || !targetPlan) return;
    setSummary(null);
    setError(null);
    setSuccess(false);
    setLoading(true);

    fetchUpgradeSummary(targetPlan.id)
      .then((data) => setSummary(data))
      .catch((err) => {
        const msg =
          err?.response?.data?.message ||
          err?.response?.data?.error ||
          err?.message ||
          "Failed to load upgrade summary.";
        setError(msg);
      })
      .finally(() => setLoading(false));
  }, [isOpen, targetPlan]);

  const handleConfirm = async () => {
    if (!targetPlan || !summary) return;
    setConfirming(true);
    setError(null);
    try {
      await createMembershipOrder(targetPlan.id);
      setSuccess(true);
      onSuccess();
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string; error?: string } }; message?: string };
      const msg =
        e?.response?.data?.message ||
        e?.response?.data?.error ||
        e?.message ||
        "Order creation failed.";
      setError(msg);
    } finally {
      setConfirming(false);
    }
  };

  const handleClose = () => {
    if (confirming) return;
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} className="max-w-md m-4">
      <div className="p-6 sm:p-8">
        <h3 className="mb-1 text-lg font-semibold text-gray-800 dark:text-white/90">
          Membership Upgrade
        </h3>
        {targetPlan && (
          <p className="mb-5 text-sm text-gray-500 dark:text-gray-400">
            Upgrading to <span className="font-medium text-gray-700 dark:text-white/80">{targetPlan.name}</span>
          </p>
        )}

        {loading && (
          <div className="flex items-center justify-center py-10 text-gray-400 text-sm">
            Loading pricing…
          </div>
        )}

        {error && !loading && (
          <div className="mb-4 rounded-lg border border-red-200 bg-red-50 dark:border-red-900/40 dark:bg-red-900/10 px-4 py-3 text-sm text-red-700 dark:text-red-400">
            {error}
          </div>
        )}

        {success && (
          <div className="mb-4 rounded-lg border border-green-200 bg-green-50 dark:border-green-900/40 dark:bg-green-900/10 px-4 py-3 text-sm text-green-700 dark:text-green-400">
            Order created successfully!
          </div>
        )}

        {summary && !loading && (
          <div className="mb-5 space-y-3">
            {summary.currentPlan && (
              <div className="rounded-lg border border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 px-4 py-3 text-sm text-gray-600 dark:text-gray-300">
                <p>
                  Current plan:{" "}
                  <span className="font-medium text-gray-800 dark:text-white/90">
                    {summary.currentPlan.name}
                  </span>
                </p>
                <p>
                  Remaining validity:{" "}
                  <span className="font-medium text-gray-800 dark:text-white/90">
                    {summary.currentPlan.remainingDays} day{summary.currentPlan.remainingDays !== 1 ? "s" : ""}
                  </span>
                </p>
              </div>
            )}

            <div className="rounded-lg border border-gray-200 dark:border-gray-700 divide-y divide-gray-100 dark:divide-gray-700 overflow-hidden text-sm">
              <div className="flex items-center justify-between px-4 py-2.5 bg-white dark:bg-gray-900">
                <span className="text-gray-600 dark:text-gray-300">
                  {summary.targetPlan.name} Plan Price
                </span>
                <span className="font-medium text-gray-800 dark:text-white/90">
                  ₹{fmt(summary.pricing.targetAmount)}
                </span>
              </div>

              {summary.pricing.deductAmount > 0 && summary.currentPlan && (
                <div className="flex items-center justify-between px-4 py-2.5 bg-white dark:bg-gray-900">
                  <span className="text-gray-600 dark:text-gray-300">
                    Unused {summary.currentPlan.name} Value
                  </span>
                  <span className="font-medium text-green-600 dark:text-green-400">
                    &minus;₹{fmt(summary.pricing.deductAmount)}
                  </span>
                </div>
              )}

              <div className="flex items-center justify-between px-4 py-2.5 bg-gray-50 dark:bg-gray-800">
                <span className="text-gray-700 dark:text-gray-200 font-medium">Subtotal</span>
                <span className="font-semibold text-gray-800 dark:text-white/90">
                  ₹{fmt(summary.pricing.finalAmount)}
                </span>
              </div>

              <div className="flex items-center justify-between px-4 py-2.5 bg-white dark:bg-gray-900">
                <span className="text-gray-600 dark:text-gray-300">GST (18%)</span>
                <span className="text-gray-700 dark:text-white/80">
                  ₹{fmt(summary.pricing.gstAmount)}
                </span>
              </div>

              <div className="flex items-center justify-between px-4 py-3 bg-brand-50 dark:bg-brand-900/20">
                <span className="font-semibold text-gray-800 dark:text-white/90">Grand Total</span>
                <span className="text-lg font-bold text-brand-600 dark:text-brand-400">
                  ₹{fmt(summary.pricing.grandTotal)}
                </span>
              </div>
            </div>
          </div>
        )}

        <div className="flex flex-wrap items-center justify-end gap-3">
          <Button variant="outline" size="sm" onClick={handleClose} disabled={confirming}>
            Cancel
          </Button>
          {summary && !success && (
            <button
              type="button"
              onClick={handleConfirm}
              disabled={confirming || loading}
              className="inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium text-white transition bg-brand-500 shadow-theme-xs hover:bg-brand-600 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {confirming ? "Processing…" : "Confirm Upgrade"}
            </button>
          )}
        </div>
      </div>
    </Modal>
  );
};
