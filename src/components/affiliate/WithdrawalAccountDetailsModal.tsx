import type { ReactNode } from "react";
import { Modal } from "../ui/modal";
import Button from "../ui/button/Button";
import Badge from "../ui/badge/Badge";
import type { WithdrawalRequest } from "../../api/affiliate";
import { BankDetailsDisplay } from "./BankDetailsDisplay";
import { formatDate, formatDateTime } from "../../utils/formatDate";

interface WithdrawalAccountDetailsModalProps {
  request: WithdrawalRequest | null;
  isOpen: boolean;
  onClose: () => void;
}

function statusColor(s: string) {
  if (s === "approved") return "success";
  if (s === "pending") return "warning";
  if (s === "rejected") return "error";
  return "light";
}

function InfoRow({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="flex items-start gap-3 border-b border-gray-100 py-3 last:border-0 dark:border-gray-800">
      <span className="w-36 shrink-0 text-sm text-gray-500 dark:text-gray-400">{label}</span>
      <span className="shrink-0 text-gray-300 dark:text-gray-600">:</span>
      <div className="min-w-0 flex-1 text-sm font-medium text-gray-800 dark:text-white">{value}</div>
    </div>
  );
}

export function WithdrawalAccountDetailsModal({
  request,
  isOpen,
  onClose,
}: WithdrawalAccountDetailsModalProps) {
  if (!request) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} className="max-w-[560px] p-6">
      <div className="mb-5">
        <h3 className="text-xl font-semibold text-gray-800 dark:text-white">Account Details</h3>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Payout information for withdrawal request #{request.id}
        </p>
      </div>

      {/* <div className="mb-5 rounded-xl border border-gray-200 bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-800/50">
        <h4 className="mb-1 text-sm font-semibold text-gray-800 dark:text-white">Affiliate</h4>
        <InfoRow label="Name" value={request.affiliate_name || "—"} />
        <InfoRow label="Email" value={request.affiliate_email || "—"} />
        <InfoRow label="User ID" value={String(request.affiliate_id)} />
      </div> */}

      <div className="mb-5 rounded-xl border border-gray-200 bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-800/50">
        <h4 className="mb-1 text-sm font-semibold text-gray-800 dark:text-white">Withdrawal</h4>
        <InfoRow
          label="Amount"
          value={`₹${Number(request.amount).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
        />
        <InfoRow
          label="Status"
          value={
            <Badge size="sm" color={statusColor(request.status)}>
              {request.status.charAt(0).toUpperCase() + request.status.slice(1)}
            </Badge>
          }
        />
        <InfoRow label="Requested On" value={formatDate(request.created_at)} />
        {request.bank_details?.updated_at ? (
          <InfoRow
            label="Bank Updated"
            value={formatDateTime(request.bank_details.updated_at)}
          />
        ) : null}
        {request.remarks ? <InfoRow label="Remarks" value={request.remarks} /> : null}
      </div>

      <div className="rounded-xl border border-brand-200 bg-brand-50/40 p-4 dark:border-brand-500/30 dark:bg-brand-500/5">
        <h4 className="mb-3 text-sm font-semibold text-gray-800 dark:text-white">Bank Details</h4>
        <BankDetailsDisplay bank={request.bank_details} variant="card" />
      </div>

      <div className="mt-6 flex justify-end">
        <Button type="button" variant="outline" onClick={onClose}>
          Close
        </Button>
      </div>
    </Modal>
  );
}
