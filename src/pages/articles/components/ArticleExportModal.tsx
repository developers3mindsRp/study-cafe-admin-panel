import { Modal } from "../../../components/ui/modal";
import Button from "../../../components/ui/button/Button";

export interface ArticleExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void | Promise<void>;
  isExporting?: boolean;
  hasActiveFilters?: boolean;
  totalCount?: number;
}

export function ArticleExportModal({
  isOpen,
  onClose,
  onConfirm,
  isExporting = false,
  hasActiveFilters = false,
  totalCount,
}: ArticleExportModalProps) {
  const requestClose = () => {
    if (!isExporting) onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={requestClose}
      className="m-4 max-w-[480px]"
      showCloseButton={!isExporting}
    >
      <div className="p-6 sm:p-8">
        <h3 className="mb-1 text-lg font-semibold text-gray-800 dark:text-white/90">
          Export articles
        </h3>
        <p className="mb-5 text-sm text-gray-500 dark:text-gray-400">
          {hasActiveFilters
            ? "The export will include only articles matching your current filters."
            : "The export will include all articles."}
          {totalCount != null && (
            <span className="ml-1 font-medium text-gray-700 dark:text-gray-300">
              ({totalCount.toLocaleString()} article{totalCount !== 1 ? "s" : ""})
            </span>
          )}
        </p>

        <ul className="mb-6 space-y-1.5 rounded-xl border border-gray-200 bg-gray-50 p-4 text-sm text-gray-600 dark:border-gray-700 dark:bg-gray-800/50 dark:text-gray-400">
          <li>• Each row is one article</li>
          <li>• Columns: ID, Title, Slug, Status, Access Tier, Author, Excerpt, SEO fields, dates</li>
          <li>• File format: <span className="font-medium text-gray-800 dark:text-white/90">.xlsx</span></li>
        </ul>

        <div className="flex flex-wrap items-center justify-end gap-3">
          <Button variant="outline" size="sm" onClick={requestClose} disabled={isExporting}>
            Cancel
          </Button>
          <button
            type="button"
            onClick={() => { void onConfirm(); }}
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
