import React, { useState, useEffect } from "react";
import { Modal } from "../ui/modal";
import Button from "../ui/button/Button";
import { updateWithdrawalStatus, type WithdrawalRequest } from "../../api/affiliate";
import Badge from "../ui/badge/Badge";

interface UpdateWithdrawalModalProps {
  request: WithdrawalRequest | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const UpdateWithdrawalModal: React.FC<UpdateWithdrawalModalProps> = ({
  request,
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<"approved" | "rejected">("approved");
  const [remarks, setRemarks] = useState("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && request) {
      setRemarks(request.remarks || "");
      setStatus(request.status === "pending" ? "approved" : (request.status as any));
    }
  }, [isOpen, request]);

  if (!request) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await updateWithdrawalStatus(request.id, status, remarks);
      onSuccess();
      onClose();
    } catch (err) {
      setError("Failed to update status.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} className="max-w-[500px] p-6">
      <div className="mb-6">
        <h3 className="text-xl font-semibold text-gray-800 dark:text-white">
          Update Withdrawal Status
        </h3>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Process the withdrawal request for <strong>{request.affiliate_name}</strong>.
        </p>
      </div>

      <div className="mb-5 rounded-xl border border-gray-200 bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-800/50">
        <div className="flex justify-between mb-2">
          <span className="text-sm text-gray-500">Amount</span>
          <span className="text-sm font-semibold text-gray-800 dark:text-white">
            ₹ {Number(request.amount).toFixed(2)}
          </span>
        </div>
        <div className="flex justify-between">
          <span className="text-sm text-gray-500">Current Status</span>
          <Badge size="sm" color={request.status === "pending" ? "warning" : "success"}>
            {request.status.toUpperCase()}
          </Badge>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
            Action
          </label>
          <div className="flex gap-4">
            <label className="flex flex-1 cursor-pointer items-center justify-center gap-2 rounded-lg border border-gray-200 p-3 transition hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-800">
              <input
                type="radio"
                name="status"
                value="approved"
                checked={status === "approved"}
                onChange={() => setStatus("approved")}
                className="text-brand-500"
              />
              <span className="text-sm font-medium text-gray-800 dark:text-white">Approve</span>
            </label>
            <label className="flex flex-1 cursor-pointer items-center justify-center gap-2 rounded-lg border border-gray-200 p-3 transition hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-800">
              <input
                type="radio"
                name="status"
                value="rejected"
                checked={status === "rejected"}
                onChange={() => setStatus("rejected")}
                className="text-brand-500"
              />
              <span className="text-sm font-medium text-gray-800 dark:text-white">Reject</span>
            </label>
          </div>
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
            Remarks
          </label>
          <textarea
            value={remarks}
            onChange={(e) => setRemarks(e.target.value)}
            rows={3}
            placeholder="Add payment reference or reason for rejection..."
            className="w-full rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm outline-none transition focus:border-brand-500 dark:border-gray-700 dark:bg-gray-800"
          ></textarea>
        </div>

        {error && (
          <p className="text-sm text-error-500 font-medium">{error}</p>
        )}

        <div className="flex items-center justify-end gap-3 pt-2">
          <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button type="submit" disabled={loading} color={status === "approved" ? "primary" : "error"}>
            {loading ? "Updating..." : `Confirm ${status.charAt(0).toUpperCase() + status.slice(1)}`}
          </Button>
        </div>
      </form>
    </Modal>
  );
};
