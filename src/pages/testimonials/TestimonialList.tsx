import { useState, useRef, useCallback } from "react";
import { Link } from "react-router";
import PageMeta from "../../components/common/PageMeta";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import { ConfirmDeleteModal } from "../../components/ui/modal/ConfirmDeleteModal";
import { DataTable, type DataTableRef } from "../../components/tables/data-table/DataTable";
import { PencilIcon, TrashBinIcon } from "../../icons";
import { useModal } from "../../hooks/useModal";
import { RequirePermission } from "../../components/auth/RequirePermission";
import {
  PERM_TESTIMONIALS_CREATE,
  PERM_TESTIMONIALS_EDIT,
  PERM_TESTIMONIALS_DELETE,
} from "../../constants/permissions";
import {
  fetchTestimonials,
  deleteTestimonial,
  type Testimonial,
} from "../../api/testimonials";
import { withClientPagination } from "../../utils/dataTableUtils";
import { getImageUrl } from "../../utils/image.utils";

const fetchTestimonialsPaginated = withClientPagination(
  fetchTestimonials,
  ["title", "media_type", "video_url"],
);

export default function TestimonialList() {
  const [deleteTarget, setDeleteTarget] = useState<Testimonial | null>(null);
  const [deleting, setDeleting] = useState(false);
  const { isOpen: isDeleteModalOpen, openModal: openDeleteModal, closeModal: closeDeleteModal } =
    useModal();
  const dataTableRef = useRef<DataTableRef>(null);

  const handleDeleteClick = useCallback(
    (item: Testimonial) => {
      setDeleteTarget(item);
      openDeleteModal();
    },
    [openDeleteModal],
  );

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await deleteTestimonial(deleteTarget.id);
      dataTableRef.current?.refetch();
      setDeleteTarget(null);
      closeDeleteModal();
    } catch (err: unknown) {
      console.error("Failed to delete media testimonial", err);
      alert((err as any)?.response?.data?.message || "Failed to delete testimonial");
    } finally {
      setDeleting(false);
    }
  };

  const columns = [
    {
      key: "media_url",
      header: "Preview",
      sortable: false,
      render: (row: Testimonial) => (
        <img
          src={getImageUrl(row.media_url)}
          alt=""
          className="h-14 w-10 rounded object-cover"
        />
      ),
    },
    {
      key: "title",
      header: "Title",
      sortable: true,
      render: (row: Testimonial) => (
        <span className="font-medium text-gray-800 dark:text-white/90">
          {row.title || "—"}
        </span>
      ),
    },
    {
      key: "media_type",
      header: "Type",
      sortable: true,
      render: (row: Testimonial) => (
        <span className="capitalize text-gray-600 dark:text-gray-400">{row.media_type}</span>
      ),
    },
    {
      key: "sort_order",
      header: "Order",
      sortable: true,
    },
    {
      key: "actions",
      header: "Actions",
      align: "end" as const,
      sortable: false,
      render: (row: Testimonial) => (
        <div className="flex items-center justify-end gap-2">
          <RequirePermission permissions={[PERM_TESTIMONIALS_EDIT]} fallback={null}>
            <Link
              to={`/testimonials/${row.id}/edit`}
              className="inline-flex items-center justify-center gap-1.5 rounded-lg px-2.5 py-2 text-sm text-gray-600 transition hover:bg-gray-100 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-white"
              title="Edit"
            >
              <PencilIcon className="size-4 shrink-0 fill-current" />
              Edit
            </Link>
          </RequirePermission>
          <RequirePermission permissions={[PERM_TESTIMONIALS_DELETE]} fallback={null}>
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
        title="Testimonials | StudyCafe Admin"
        description="Manage video/image testimonials for studycafe.in"
      />
      <PageBreadcrumb
        pageTitle="Testimonials"
        actions={
          <RequirePermission permissions={[PERM_TESTIMONIALS_CREATE]} fallback={null}>
            <Link
              to="/testimonials/create"
              className="inline-flex items-center justify-center gap-2 rounded-lg px-4 py-3 text-sm font-medium text-white transition bg-brand-500 shadow-theme-xs hover:bg-brand-600"
            >
              Create New
            </Link>
          </RequirePermission>
        }
      />
      <div className="space-y-6">
        <DataTable<Testimonial>
          ref={dataTableRef}
          columns={columns}
          fetchData={fetchTestimonialsPaginated}
          initialPageSize={10}
          initialSortBy="sort_order"
          initialSortOrder="ASC"
          pageSizeOptions={[10, 20, 50]}
          enableSearch
          enableSorting
          enablePagination
          searchPlaceholder="Search testimonials…"
          emptyMessage="No testimonials found."
        />
      </div>

      <ConfirmDeleteModal
        isOpen={isDeleteModalOpen}
        onClose={() => {
          setDeleteTarget(null);
          closeDeleteModal();
        }}
        onConfirm={handleDeleteConfirm}
        title="Delete Testimonial"
        itemName={deleteTarget?.title || `Testimonial #${deleteTarget?.id}`}
        isLoading={deleting}
      />
    </>
  );
}
