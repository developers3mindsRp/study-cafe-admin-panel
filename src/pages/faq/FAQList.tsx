import { useState, useRef, useCallback } from "react";
import { Link } from "react-router";
import PageMeta from "../../components/common/PageMeta";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import { ConfirmDeleteModal } from "../../components/ui/modal/ConfirmDeleteModal";
import { DataTable, type DataTableRef } from "../../components/tables/data-table/DataTable";
import { EyeIcon, PencilIcon, TrashBinIcon } from "../../icons";
import { useModal } from "../../hooks/useModal";
import { RequirePermission } from "../../components/auth/RequirePermission";
import { PERM_FAQ_CREATE, PERM_FAQ_EDIT, PERM_FAQ_DELETE } from "../../constants/permissions";
import { fetchFaqs, deleteFaq, type Faq } from "../../api/faqs";
import { withClientPagination } from "../../utils/dataTableUtils";

// Wrap list API in client-side pagination adapter
const fetchFaqsPaginated = withClientPagination(
  fetchFaqs,
  ["question", "answer"]
);

export default function FAQList() {
  const [deleteTarget, setDeleteTarget] = useState<Faq | null>(null);
  const [deleting, setDeleting] = useState(false);
  const { isOpen: isDeleteModalOpen, openModal: openDeleteModal, closeModal: closeDeleteModal } = useModal();
  const dataTableRef = useRef<DataTableRef>(null);

  const handleDeleteClick = useCallback((faq: Faq) => {
    setDeleteTarget(faq);
    openDeleteModal();
  }, [openDeleteModal]);

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await deleteFaq(deleteTarget.id);
      dataTableRef.current?.refetch();
      setDeleteTarget(null);
      closeDeleteModal();
    } catch (err: unknown) {
      console.error("Failed to delete FAQ", err);
      alert((err as any)?.response?.data?.message || "Failed to delete FAQ");
    } finally {
      setDeleting(false);
    }
  };

  const handleDeleteCancel = () => {
    setDeleteTarget(null);
    closeDeleteModal();
  };

  const columns = [
    {
      key: "question",
      header: "Question",
      sortable: true,
      render: (row: Faq) => (
        <span className="font-medium text-gray-800 text-theme-sm dark:text-white/90">
          {row.question}
        </span>
      ),
    },
    {
      key: "answer",
      header: "Answer",
      sortable: false,
      render: (row: Faq) => {
        const text = typeof row.answer === 'string' ? row.answer.replace(/<[^>]*>/g, "").trim() : '';
        return (
          <div className="max-w-md text-gray-500 text-theme-sm dark:text-gray-400">
            {text.length > 150 ? `${text.slice(0, 150)}...` : text}
          </div>
        );
      },
    },
    {
      key: "created_at",
      header: "Created At",
      sortable: true,
      render: (row: Faq) =>
        row.created_at ? new Date(row.created_at).toLocaleDateString() : "—",
    },
    {
      key: "actions",
      header: "Actions",
      align: "end" as const,
      sortable: false,
      render: (row: Faq) => (
        <div className="flex items-center justify-end gap-2">
          <Link
            to={`/faq/${row.id}`}
            className="inline-flex items-center justify-center gap-1.5 rounded-lg px-2.5 py-2 text-sm text-gray-600 transition hover:bg-gray-100 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-white"
            title="View"
          >
            <EyeIcon className="size-4 shrink-0 fill-current" />
            View
          </Link>
          <RequirePermission permissions={[PERM_FAQ_EDIT]} fallback={null}>
            <Link
              to={`/faq/${row.id}/edit`}
              className="inline-flex items-center justify-center gap-1.5 rounded-lg px-2.5 py-2 text-sm text-gray-600 transition hover:bg-gray-100 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-white"
              title="Edit"
            >
              <PencilIcon className="size-4 shrink-0 fill-current" />
              Edit
            </Link>
          </RequirePermission>
          <RequirePermission permissions={[PERM_FAQ_DELETE]} fallback={null}>
            <button
              type="button"
              onClick={() => handleDeleteClick(row)}
              className="inline-flex items-center justify-center gap-1.5 rounded-lg px-2.5 py-2 text-sm text-gray-600 transition hover:bg-error-50 hover:text-error-500 dark:text-gray-400 dark:hover:bg-error-500/10 dark:hover:text-error-400"
              title="Delete"
            >
              <TrashBinIcon className="size-4 shrink-0 fill-current" />
              Delete
            </button>
          </RequirePermission>
        </div>
      ),
    },
  ];

  return (
    <>
      <PageMeta
        title="FAQs | StudyCafe Admin"
        description="Manage FAQs for studycafe.in"
      />
      <PageBreadcrumb
        pageTitle="FAQs"
        actions={
          <RequirePermission permissions={[PERM_FAQ_CREATE]} fallback={null}>
            <Link
              to="/faq/create"
              className="inline-flex items-center justify-center gap-2 rounded-lg px-4 py-3 text-sm font-medium text-white transition bg-brand-500 shadow-theme-xs hover:bg-brand-600"
            >
              Create New
            </Link>
          </RequirePermission>
        }
      />
      <div className="space-y-6">
        <DataTable<Faq>
          ref={dataTableRef}
          columns={columns}
          fetchData={fetchFaqsPaginated}
          initialPageSize={10}
          initialSortBy="created_at"
          initialSortOrder="DESC"
          pageSizeOptions={[10, 20, 50, 100]}
          enableSearch
          enableSorting
          enablePagination
          searchPlaceholder="Search FAQs…"
          emptyMessage="No FAQs found."
        />
      </div>

      <ConfirmDeleteModal
        isOpen={isDeleteModalOpen}
        onClose={handleDeleteCancel}
        onConfirm={handleDeleteConfirm}
        title="Delete FAQ"
        itemName={deleteTarget?.question}
        isLoading={deleting}
      />
    </>
  );
}
