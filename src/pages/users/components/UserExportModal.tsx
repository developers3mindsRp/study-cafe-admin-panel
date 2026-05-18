import { useEffect, useState } from "react";
import { Modal } from "../../../components/ui/modal";
import Button from "../../../components/ui/button/Button";
import Label from "../../../components/form/Label";
import { USER_MEMBERSHIP_EXPORT_OPTIONS } from "../constants/userMembershipOptions";

export interface UserExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  /** Called with membership slug (empty = all) and state substring (empty = all). */
  onConfirm: (opts: { membership: string; state: string }) => void | Promise<void>;
  initialMembership?: string;
  initialState?: string;
  isExporting?: boolean;
}

export function UserExportModal({
  isOpen,
  onClose,
  onConfirm,
  initialMembership = "",
  initialState = "",
  isExporting = false,
}: UserExportModalProps) {
  const [membership, setMembership] = useState("");
  const [state, setState] = useState("");

  const requestClose = () => {
    if (!isExporting) onClose();
  };

  useEffect(() => {
    if (isOpen) {
      setMembership(initialMembership ?? "");
      setState(initialState ?? "");
    }
  }, [isOpen, initialMembership, initialState]);

  const handleConfirm = () => {
    void onConfirm({ membership, state: state.trim() });
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={requestClose}
      className="m-4 max-w-[480px]"
      showCloseButton={!isExporting}
    >
      <div className="p-6 sm:p-8">
        <h3 className="mb-1 text-lg font-semibold text-gray-800 dark:text-white/90">Export users</h3>
        <p className="mb-5 text-sm text-gray-500 dark:text-gray-400">
          Choose membership and state for this export. Email, role, status, joined dates, and table search
          still apply from the list above.
        </p>

        <div className="space-y-4">
          <div>
            <Label htmlFor="export-membership">Membership</Label>
            <select
              id="export-membership"
              value={membership}
              onChange={(e) => setMembership(e.target.value)}
              disabled={isExporting}
              className="mt-1.5 h-11 w-full rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 pr-11 text-sm text-gray-800 shadow-theme-xs focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 disabled:opacity-50 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90"
            >
              {USER_MEMBERSHIP_EXPORT_OPTIONS.map((o) => (
                <option key={o.value || "all"} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <Label htmlFor="export-state">State</Label>
            <input
              id="export-state"
              type="text"
              value={state}
              onChange={(e) => setState(e.target.value)}
              disabled={isExporting}
              placeholder="e.g. Karnataka — leave empty for all states"
              className="mt-1.5 h-11 w-full rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm text-gray-800 shadow-theme-xs placeholder:text-gray-400 focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 disabled:opacity-50 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30"
            />
          </div>
        </div>

        <div className="mt-6 flex flex-wrap items-center justify-end gap-3">
          <Button variant="outline" size="sm" onClick={requestClose} disabled={isExporting}>
            Cancel
          </Button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={isExporting}
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-brand-500 px-4 py-3 text-sm font-medium text-white shadow-theme-xs transition hover:bg-brand-600 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isExporting ? "Exporting…" : "Download Excel"}
          </button>
        </div>
      </div>
    </Modal>
  );
}
