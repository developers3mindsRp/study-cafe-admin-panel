import { useState, useRef, useCallback } from "react";
import { Link } from "react-router";
import PageMeta from "../../components/common/PageMeta";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import { ConfirmDeleteModal } from "../../components/ui/modal/ConfirmDeleteModal";
import { DataTable, type DataTableRef } from "../../components/tables/data-table/DataTable";
import { EyeIcon, PencilIcon, TrashBinIcon } from "../../icons";
import { useModal } from "../../hooks/useModal";
import { RequirePermission } from "../../components/auth/RequirePermission";
import { PERM_SEO_CREATE, PERM_SEO_EDIT, PERM_SEO_DELETE, PERM_SEO_LIST } from "../../constants/permissions";
import { fetchSeoMetadata, deleteSeoMetadata, type SEOMetadata } from "../../api/seo";
import { withClientPagination } from "../../utils/dataTableUtils";

// Wrap list API in client-side pagination adapter
const fetchSeoMetadataPaginated = withClientPagination(
  fetchSeoMetadata,
  ["pageName", "pageSlug", "metaTitle", "metaDescription"]
);

export default function SEOMetadataList() {
  const [deleteTarget, setDeleteTarget] = useState<SEOMetadata | null>(null);
  const [deleting, setDeleting] = useState(false);
  const { isOpen: isDeleteModalOpen, openModal: openDeleteModal, closeModal: closeDeleteModal } = useModal();
  const dataTableRef = useRef<DataTableRef>(null);

  const handleDeleteClick = useCallback((entry: SEOMetadata) => {
    setDeleteTarget(entry);
    openDeleteModal();
  }, [openDeleteModal]);

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await deleteSeoMetadata(deleteTarget.id);
      dataTableRef.current?.refetch();
      setDeleteTarget(null);
      closeDeleteModal();
    } catch (err: unknown) {
      console.error("Failed to delete SEO metadata", err);
      alert((err as any)?.response?.data?.message || "Failed to delete SEO metadata");
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
      key: "pageName",
      header: "Page",
      sortable: true,
      render: (row: SEOMetadata) => (
        <div>
          <span className="block font-medium text-gray-800 text-theme-sm dark:text-white/90">
            {row.pageName}
          </span>
          <span className="block text-gray-500 text-theme-xs dark:text-gray-400">
            {row.pageSlug}
          </span>
        </div>
      ),
    },
    {
      key: "metaTitle",
      header: "Meta Title",
      sortable: true,
      render: (row: SEOMetadata) => (
        <div className="max-w-xs">
          <span className="line-clamp-2">{row.metaTitle}</span>
        </div>
      ),
    },
    {
      key: "metaDescription",
      header: "Meta Description",
      sortable: false,
      render: (row: SEOMetadata) => (
        <div className="max-w-md text-gray-500 dark:text-gray-400">
          <span className="line-clamp-2">{row.metaDescription}</span>
        </div>
      ),
    },
    {
      key: "robots",
      header: "Robots",
      sortable: true,
      render: (row: SEOMetadata) => (
        <span className="text-gray-500 dark:text-gray-400">
          {row.robots}
        </span>
      ),
    },
    {
      key: "created_at",
      header: "Created At",
      sortable: true,
      render: (row: SEOMetadata) =>
        row.created_at ? new Date(row.created_at).toLocaleDateString() : "—",
    },
    {
      key: "actions",
      header: "Actions",
      align: "end" as const,
      sortable: false,
      render: (row: SEOMetadata) => (
        <div className="flex items-center justify-end gap-2">
          <Link
            to={`/seo-metadata/${row.id}`}
            className="inline-flex items-center justify-center gap-1.5 rounded-lg px-2.5 py-2 text-sm text-gray-600 transition hover:bg-gray-100 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-white"
            title="View"
          >
            <EyeIcon className="size-4 shrink-0 fill-current" />
            View
          </Link>
          <RequirePermission permissions={[PERM_SEO_EDIT]} fallback={null}>
            <Link
              to={`/seo-metadata/${row.id}/edit`}
              className="inline-flex items-center justify-center gap-1.5 rounded-lg px-2.5 py-2 text-sm text-gray-600 transition hover:bg-gray-100 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-white"
              title="Edit"
            >
              <PencilIcon className="size-4 shrink-0 fill-current" />
              Edit
            </Link>
          </RequirePermission>
          <RequirePermission permissions={[PERM_SEO_DELETE]} fallback={null}>
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
        title="SEO Metadata | StudyCafe Admin"
        description="Manage SEO metadata for studycafe.in"
      />
      <PageBreadcrumb
        pageTitle="SEO Metadata"
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <RequirePermission permissions={[PERM_SEO_LIST]} fallback={null}>
              <Link
                to="/seo-metadata/site-pages"
                className="inline-flex items-center justify-center rounded-lg border border-gray-300 bg-white px-4 py-3 text-sm font-medium text-gray-800 shadow-theme-xs transition hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100 dark:hover:bg-gray-800"
              >
                Site pages (URLs)
              </Link>
            </RequirePermission>
            <RequirePermission permissions={[PERM_SEO_CREATE]} fallback={null}>
              <Link
                to="/seo-metadata/create"
                className="inline-flex items-center justify-center gap-2 rounded-lg px-4 py-3 text-sm font-medium text-white transition bg-brand-500 shadow-theme-xs hover:bg-brand-600"
              >
                Create New
              </Link>
            </RequirePermission>
          </div>
        }
      />
      <div className="space-y-6">
        <DataTable<SEOMetadata>
          ref={dataTableRef}
          columns={columns}
          fetchData={fetchSeoMetadataPaginated}
          initialPageSize={10}
          initialSortBy="created_at"
          initialSortOrder="DESC"
          pageSizeOptions={[10, 20, 50, 100]}
          enableSearch
          enableSorting
          enablePagination
          searchPlaceholder="Search SEO metadata…"
          emptyMessage="No SEO metadata found."
        />
      </div>

      <ConfirmDeleteModal
        isOpen={isDeleteModalOpen}
        onClose={handleDeleteCancel}
        onConfirm={handleDeleteConfirm}
        title="Delete SEO Metadata"
        itemName={deleteTarget?.pageName}
        isLoading={deleting}
      />
    </>
  );
}
