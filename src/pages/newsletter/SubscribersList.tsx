import { useState, useRef, useCallback } from "react";
import PageMeta from "../../components/common/PageMeta";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import { ConfirmDeleteModal } from "../../components/ui/modal/ConfirmDeleteModal";
import { Modal } from "../../components/ui/modal";
import { DataTable, type DataTableRef } from "../../components/tables/data-table/DataTable";
import { TrashBinIcon } from "../../icons";
import { useModal } from "../../hooks/useModal";
import { RequirePermission } from "../../components/auth/RequirePermission";
import { PERM_NEWSLETTER_DELETE } from "../../constants/permissions";
import {
  fetchNewsletterSubscribers,
  deleteNewsletterSubscriber,
  syncMembershipSubscribers,
  type NewsletterSubscriber,
  type SyncMembersResult,
} from "../../api/newsletter";
import { withClientPagination } from "../../utils/dataTableUtils";

const fetchSubscribersPaginated = withClientPagination(
  fetchNewsletterSubscribers,
  ["email"]
);

const PLAN_OPTIONS = [
  { slug: "base", label: "Base" },
  { slug: "medium", label: "Medium" },
  { slug: "premium", label: "Premium" },
];

export default function SubscribersList() {
  const [deleteTarget, setDeleteTarget] = useState<NewsletterSubscriber | null>(null);
  const [deleting, setDeleting] = useState(false);
  const { isOpen: isDeleteModalOpen, openModal: openDeleteModal, closeModal: closeDeleteModal } = useModal();
  const dataTableRef = useRef<DataTableRef>(null);

  // Sync modal state
  const { isOpen: isSyncModalOpen, openModal: openSyncModal, closeModal: closeSyncModal } = useModal();
  const [selectedPlans, setSelectedPlans] = useState<string[]>([]);
  const [syncing, setSyncing] = useState(false);
  const [syncResult, setSyncResult] = useState<SyncMembersResult | null>(null);

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

  const handleSyncOpen = () => {
    setSelectedPlans([]);
    setSyncResult(null);
    openSyncModal();
  };

  const handleSyncClose = () => {
    closeSyncModal();
    setSyncResult(null);
    if (syncing) return;
  };

  const togglePlan = (slug: string) => {
    setSelectedPlans((prev) =>
      prev.includes(slug) ? prev.filter((s) => s !== slug) : [...prev, slug]
    );
  };

  const handleSyncConfirm = async () => {
    if (selectedPlans.length === 0) return;
    setSyncing(true);
    setSyncResult(null);
    try {
      const result = await syncMembershipSubscribers(selectedPlans);
      setSyncResult(result);
      dataTableRef.current?.refetch();
    } catch (err: unknown) {
      console.error("Failed to sync members", err);
      alert((err as any)?.response?.data?.message || "Failed to sync membership members");
    } finally {
      setSyncing(false);
    }
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
        <div className="flex justify-end">
          <button
            type="button"
            onClick={handleSyncOpen}
            className="inline-flex items-center gap-2 rounded-lg bg-brand-500 px-4 py-2 text-sm font-medium text-white transition hover:bg-brand-600 dark:bg-brand-500 dark:hover:bg-brand-600"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="size-4 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 2v6h-6" /><path d="M3 12a9 9 0 0 1 15-6.7L21 8" />
              <path d="M3 22v-6h6" /><path d="M21 12a9 9 0 0 1-15 6.7L3 16" />
            </svg>
            Sync Membership Members
          </button>
        </div>

        <DataTable<NewsletterSubscriber>
          ref={dataTableRef}
          columns={columns}
          fetchData={fetchSubscribersPaginated}
          initialPageSize={10}
          initialSortBy="created_at"
          initialSortOrder="DESC"
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

      {/* Sync Membership Members Modal */}
      <Modal isOpen={isSyncModalOpen} onClose={handleSyncClose} showCloseButton>
        <div className="p-6 w-full max-w-md">
          <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90 mb-1">
            Sync Membership Members
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-5">
            Select which membership plans to sync. Active members from selected plans will be added as verified newsletter subscribers.
          </p>

          {syncResult ? (
            <div className="rounded-lg bg-success-50 dark:bg-success-500/10 p-4 mb-5 text-sm text-success-700 dark:text-success-400 space-y-1">
              <p className="font-semibold">Sync complete!</p>
              <p>{syncResult.synced_count} new subscriber{syncResult.synced_count !== 1 ? "s" : ""} added.</p>
              <p>{syncResult.already_subscribed_count} already subscribed (skipped).</p>
            </div>
          ) : (
            <div className="space-y-3 mb-5">
              {PLAN_OPTIONS.map((plan) => (
                <label
                  key={plan.slug}
                  className="flex items-center gap-3 cursor-pointer rounded-lg border border-gray-200 dark:border-gray-700 px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-800 transition"
                >
                  <input
                    type="checkbox"
                    className="size-4 rounded border-gray-300 accent-brand-500"
                    checked={selectedPlans.includes(plan.slug)}
                    onChange={() => togglePlan(plan.slug)}
                    disabled={syncing}
                  />
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    {plan.label}
                  </span>
                </label>
              ))}
            </div>
          )}

          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={handleSyncClose}
              className="rounded-lg border border-gray-300 px-4 py-2 text-sm text-gray-600 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-400 dark:hover:bg-gray-800 transition"
            >
              {syncResult ? "Close" : "Cancel"}
            </button>
            {!syncResult && (
              <button
                type="button"
                onClick={handleSyncConfirm}
                disabled={selectedPlans.length === 0 || syncing}
                className="inline-flex items-center gap-2 rounded-lg bg-brand-500 px-4 py-2 text-sm font-medium text-white transition hover:bg-brand-600 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {syncing ? (
                  <>
                    <svg className="size-4 animate-spin" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                    </svg>
                    Syncing…
                  </>
                ) : (
                  "Sync Now"
                )}
              </button>
            )}
          </div>
        </div>
      </Modal>
    </>
  );
}
