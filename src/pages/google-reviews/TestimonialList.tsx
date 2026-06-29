import { formatDate } from "../../utils/formatDate";
import { useState, useRef, useCallback } from "react";
import { Link } from "react-router";
import PageMeta from "../../components/common/PageMeta";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import { ConfirmDeleteModal } from "../../components/ui/modal/ConfirmDeleteModal";
import { DataTable, type DataTableRef } from "../../components/tables/data-table/DataTable";
import { PencilIcon, TrashBinIcon } from "../../icons";
import { useModal } from "../../hooks/useModal";
import { RequirePermission } from "../../components/auth/RequirePermission";
import { PERM_GOOGLE_REVIEWS_CREATE, PERM_GOOGLE_REVIEWS_EDIT, PERM_GOOGLE_REVIEWS_DELETE } from "../../constants/permissions";
import { fetchGoogleReviews, deleteGoogleReview, type GoogleReview } from "../../api/googleReviews";
import { withClientPagination } from "../../utils/dataTableUtils";

// Wrap list API in client-side pagination adapter
const fetchGoogleReviewsPaginated = withClientPagination(
  fetchGoogleReviews,
  ["author_name", "author_role", "content"]
);

export default function GoogleReviewList() {
  const [deleteTarget, setDeleteTarget] = useState<GoogleReview | null>(null);
  const [deleting, setDeleting] = useState(false);
  const { isOpen: isDeleteModalOpen, openModal: openDeleteModal, closeModal: closeDeleteModal } = useModal();
  const dataTableRef = useRef<DataTableRef>(null);

  const handleDeleteClick = useCallback((item: GoogleReview) => {
    setDeleteTarget(item);
    openDeleteModal();
  }, [openDeleteModal]);

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await deleteGoogleReview(deleteTarget.id);
      dataTableRef.current?.refetch();
      setDeleteTarget(null);
      closeDeleteModal();
    } catch (err: unknown) {
      console.error("Failed to delete testimonial", err);
      alert((err as any)?.response?.data?.message || "Failed to delete testimonial");
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
      key: "author_name",
      header: "Author",
      sortable: true,
      render: (row: GoogleReview) => (
        <div>
          <span className="block font-medium text-gray-800 text-theme-sm dark:text-white/90">
            {row.author_name}
          </span>
          <span className="block text-gray-500 text-theme-xs dark:text-gray-400">
            {row.author_role}
          </span>
        </div>
      ),
    },
    {
      key: "content",
      header: "Quote",
      sortable: false,
      render: (row: GoogleReview) => (
        <div className="max-w-md text-gray-500 text-theme-sm dark:text-gray-400">
          <span className="line-clamp-2">{row.content}</span>
        </div>
      ),
    },
    {
      key: "created_at",
      header: "Created At",
      sortable: true,
      render: (row: GoogleReview) =>
        row.created_at ? formatDate(row.created_at) : "—",
    },
    {
      key: "actions",
      header: "Actions",
      align: "end" as const,
      sortable: false,
      render: (row: GoogleReview) => (
        <div className="flex items-center justify-end gap-2">
          {/* <Link
            to={`/google-reviews/${row.id}`}
            className="inline-flex items-center justify-center gap-1.5 rounded-lg px-2.5 py-2 text-sm text-gray-600 transition hover:bg-gray-100 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-white"
            title="View"
          >
            <EyeIcon className="size-4 shrink-0 fill-current" />
            View
          </Link> */}
          <RequirePermission permissions={[PERM_GOOGLE_REVIEWS_EDIT]} fallback={null}>
            <Link
              to={`/google-reviews/${row.id}/edit`}
              className="inline-flex items-center justify-center gap-1.5 rounded-lg px-2.5 py-2 text-sm text-gray-600 transition hover:bg-gray-100 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-white"
              title="Edit"
            >
              <PencilIcon className="size-4 shrink-0 fill-current" />
              Edit
            </Link>
          </RequirePermission>
          <RequirePermission permissions={[PERM_GOOGLE_REVIEWS_DELETE]} fallback={null}>
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
        title="Google Reviews | StudyCafe Admin"
        description="Manage Google reviews for studycafe.in"
      />
      <PageBreadcrumb
        pageTitle="Google Reviews"
        actions={
          <RequirePermission permissions={[PERM_GOOGLE_REVIEWS_CREATE]} fallback={null}>
            <Link
              to="/google-reviews/create"
              className="inline-flex items-center justify-center gap-2 rounded-lg px-4 py-3 text-sm font-medium text-white transition bg-brand-500 shadow-theme-xs hover:bg-brand-600"
            >
              Create New
            </Link>
          </RequirePermission>
        }
      />
      <div className="space-y-6">
        <DataTable<GoogleReview>
          ref={dataTableRef}
          columns={columns}
          fetchData={fetchGoogleReviewsPaginated}
          initialPageSize={10}
          initialSortBy="created_at"
          initialSortOrder="DESC"
          pageSizeOptions={[10, 20, 50, 100]}
          enableSearch
          enableSorting
          enablePagination
          searchPlaceholder="Search google reviews…"
          emptyMessage="No google reviews found."
        />
      </div>

      <ConfirmDeleteModal
        isOpen={isDeleteModalOpen}
        onClose={handleDeleteCancel}
        onConfirm={handleDeleteConfirm}
        title="Delete Google Review"
        itemName={deleteTarget?.author_name}
        isLoading={deleting}
      />
    </>
  );
}
