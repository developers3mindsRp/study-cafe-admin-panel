import { Modal } from "./index";
import Button from "../button/Button";

interface ConfirmDeleteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title?: string;
  message?: string;
  itemName?: string;
  confirmLabel?: string;
  loadingLabel?: string;
  confirmVariant?: "danger" | "brand";
  isLoading?: boolean;
}

const confirmButtonClass: Record<NonNullable<ConfirmDeleteModalProps["confirmVariant"]>, string> = {
  danger: "bg-error-500 hover:bg-error-600",
  brand: "bg-brand-500 hover:bg-brand-600",
};

export const ConfirmDeleteModal: React.FC<ConfirmDeleteModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title = "Confirm Delete",
  message = "Are you sure you want to delete this item? This action cannot be undone.",
  itemName,
  confirmLabel = "Delete",
  loadingLabel = "Deleting…",
  confirmVariant = "danger",
  isLoading = false,
}) => {
  const displayMessage = itemName
    ? `Are you sure you want to delete "${itemName}"? This action cannot be undone.`
    : message;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      className="max-w-[425px] m-4"
      showCloseButton={!isLoading}
    >
      <div className="p-6 sm:p-8">
        <h3 className="mb-2 text-lg font-semibold text-gray-800 dark:text-white/90">
          {title}
        </h3>
        <p className="mb-6 text-sm text-gray-500 dark:text-gray-400">
          {displayMessage}
        </p>
        <div className="flex flex-wrap items-center justify-end gap-3">
          <Button variant="outline" size="sm" onClick={onClose} disabled={isLoading}>
            Cancel
          </Button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isLoading}
            className={`inline-flex items-center justify-center gap-2 rounded-lg px-4 py-3 text-sm font-medium text-white transition shadow-theme-xs disabled:opacity-50 disabled:cursor-not-allowed ${confirmButtonClass[confirmVariant]}`}
          >
            {isLoading ? loadingLabel : confirmLabel}
          </button>
        </div>
      </div>
    </Modal>
  );
};
