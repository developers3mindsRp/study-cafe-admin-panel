import { useState, useRef, useCallback } from "react";
import PageMeta from "../../components/common/PageMeta";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import { ConfirmDeleteModal } from "../../components/ui/modal/ConfirmDeleteModal";
import { DataTable, type DataTableRef } from "../../components/tables/data-table/DataTable";
import { TrashBinIcon } from "../../icons";
import { useModal } from "../../hooks/useModal";
import { RequirePermission } from "../../components/auth/RequirePermission";
import { PERM_NEWSLETTER_DELETE } from "../../constants/permissions";
import {
  fetchNewsletterSubscribers,
  deleteNewsletterSubscriber,
  type NewsletterSubscriber,
} from "../../api/newsletter";
import { withClientPagination } from "../../utils/dataTableUtils";

const fetchSubscribersPaginated = withClientPagination(
  fetchNewsletterSubscribers,
  ["email"]
);

export default function SubscribersList() {
  const [deleteTarget, setDeleteTarget] = useState<NewsletterSubscriber | null>(null);
  const [deleting, setDeleting] = useState(false);
  const { isOpen: isDeleteModalOpen, openModal: openDeleteModal, closeModal: closeDeleteModal } = useModal();
  const dataTableRef = useRef<DataTableRef>(null);

  const handleDeleteClick = useCallback((sub: NewsletterSubscriber) => {
    setDeleteTarget(sub);
    openDeleteModal();
  }, [openDeleteModal]);

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await deleteNewsletterSubscriber(deleteTarget.id);
      dataTableRef.current?.refetch();
      setDeleteTarget(null);
      closeDeleteModal();
    } catch (err: unknown) {
      console.error("Failed to delete subscriber", err);
      alert((err as any)?.response?.data?.message || "Failed to delete subscriber");
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
      key: "email",
      header: "Email",
      sortable: true,
      render: (row: NewsletterSubscriber) => (
        <span className="font-medium text-gray-800 text-theme-sm dark:text-white/90">
          {row.email}
        </span>
      ),
    },
    {
      key: "is_verified",
      header: "Status",
      sortable: true,
      render: (row: NewsletterSubscriber) => (
        <span
          className={
            row.is_verified
              ? "inline-flex rounded-full bg-success-50 px-2.5 py-0.5 text-xs font-medium text-success-600 dark:bg-success-500/10 dark:text-success-400"
              : "inline-flex rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-600 dark:bg-gray-800 dark:text-gray-400"
          }
        >
          {row.is_verified ? "Verified" : "Unverified"}
        </span>
      ),
    },
    {
      key: "created_at",
      header: "Subscribed On",
      sortable: true,
      render: (row: NewsletterSubscriber) => (
        <span className="text-gray-500 text-theme-sm dark:text-gray-400">
          {row.created_at ? new Date(row.created_at).toLocaleDateString() : "—"}
        </span>
      ),
    },
    {
      key: "actions",
      header: "Actions",
      align: "end" as const,
      sortable: false,
      render: (row: NewsletterSubscriber) => (
        <div className="flex items-center justify-end gap-2">
          <RequirePermission permissions={[PERM_NEWSLETTER_DELETE]} fallback={null}>
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
        title="Newsletter Subscribers | StudyCafe Admin"
        description="Manage newsletter subscribers"
      />
      <PageBreadcrumb pageTitle="Newsletter Subscribers" />
      <div className="space-y-6">
        <DataTable<NewsletterSubscriber>
          ref={dataTableRef}
          columns={columns}
          fetchData={fetchSubscribersPaginated}
          initialPageSize={10}
          pageSizeOptions={[10, 20, 50, 100]}
          enableSearch
          enableSorting
          enablePagination
          searchPlaceholder="Search by email…"
          emptyMessage="No subscribers yet."
        />
      </div>

      <ConfirmDeleteModal
        isOpen={isDeleteModalOpen}
        onClose={handleDeleteCancel}
        onConfirm={handleDeleteConfirm}
        title="Remove Subscriber"
        itemName={deleteTarget?.email}
        isLoading={deleting}
      />
    </>
  );
}
