import { useState } from "react";

export interface AffiliateBankDetails {
  account_holder_name?: string | null;
  account_number?: string | null;
  ifsc?: string | null;
  bank_name?: string | null;
  branch?: string | null;
  updated_at?: string | null;
}

interface BankDetailsDisplayProps {
  bank?: AffiliateBankDetails | null;
  variant?: "table" | "card";
}

function CopyButton({ value, label }: { value: string; label: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1500);
    } catch {
      /* ignore */
    }
  };

  return (
    <button
      type="button"
      onClick={handleCopy}
      className="ml-2 inline-flex shrink-0 rounded-md border border-gray-200 px-2 py-0.5 text-[10px] font-medium text-brand-600 hover:bg-brand-50 dark:border-gray-600 dark:text-brand-400 dark:hover:bg-brand-500/10"
      title={`Copy ${label}`}
    >
      {copied ? "Copied" : "Copy"}
    </button>
  );
}

function hasBankDetails(bank?: AffiliateBankDetails | null) {
  if (!bank) return false;
  return Boolean(
    bank.account_holder_name ||
      bank.account_number ||
      bank.ifsc ||
      bank.bank_name ||
      bank.branch,
  );
}

function DetailRow({
  label,
  value,
  mono = false,
  copyValue,
  copyLabel,
  size = "sm",
}: {
  label: string;
  value: string;
  mono?: boolean;
  copyValue?: string;
  copyLabel?: string;
  size?: "sm" | "md";
}) {
  const labelClass =
    size === "md"
      ? "w-36 shrink-0 text-sm text-gray-500 dark:text-gray-400"
      : "w-28 shrink-0 text-theme-xs text-gray-500 dark:text-gray-400";
  const valueClass =
    size === "md"
      ? `min-w-0 flex-1 text-sm font-medium text-gray-800 dark:text-white ${mono ? "font-mono" : ""}`
      : `min-w-0 flex-1 text-theme-xs font-medium text-gray-800 dark:text-white/90 ${mono ? "font-mono" : ""}`;

  return (
    <div className="flex items-start gap-3 py-0.5">
      <span className={labelClass}>{label}</span>
      <span className="shrink-0 text-gray-300 dark:text-gray-600">:</span>
      <div className={`flex min-w-0 flex-wrap items-center ${valueClass}`}>
        <span className="break-all">{value}</span>
        {copyValue && copyLabel ? <CopyButton value={copyValue} label={copyLabel} /> : null}
      </div>
    </div>
  );
}

export function BankDetailsDisplay({ bank, variant = "table" }: BankDetailsDisplayProps) {
  if (!hasBankDetails(bank)) {
    return (
      <span className="text-theme-xs italic text-gray-400 dark:text-gray-500">Not provided</span>
    );
  }

  const holder = bank?.account_holder_name?.trim() || "—";
  const account = bank?.account_number?.trim() || "—";
  const ifsc = bank?.ifsc?.trim() || "—";
  const bankName = bank?.bank_name?.trim() || "—";
  const branch = bank?.branch?.trim() || "—";
  const size = variant === "card" ? "md" : "sm";

  return (
    <div className={variant === "card" ? "space-y-1" : "min-w-[240px] space-y-1"}>
      <DetailRow
        label="Account Holder"
        value={holder}
        copyValue={bank?.account_holder_name?.trim() || undefined}
        copyLabel="account holder name"
        size={size}
      />
      <DetailRow
        label="Account Number"
        value={account}
        mono
        copyValue={bank?.account_number?.trim() || undefined}
        copyLabel="account number"
        size={size}
      />
      <DetailRow
        label="IFSC Code"
        value={ifsc}
        mono
        copyValue={bank?.ifsc?.trim() || undefined}
        copyLabel="IFSC"
        size={size}
      />
      <DetailRow
        label="Bank Name"
        value={bankName}
        copyValue={bank?.bank_name?.trim() || undefined}
        copyLabel="bank name"
        size={size}
      />
      <DetailRow
        label="Branch"
        value={branch}
        copyValue={bank?.branch?.trim() || undefined}
        copyLabel="branch"
        size={size}
      />
    </div>
  );
}
