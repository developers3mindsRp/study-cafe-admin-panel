import { useCallback, useRef, useState } from "react";
import { Link } from "react-router";
import PageMeta from "../../components/common/PageMeta";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import { ConfirmDeleteModal } from "../../components/ui/modal/ConfirmDeleteModal";
import { DataTable, type DataTableRef } from "../../components/tables/data-table/DataTable";
import { PencilIcon, TrashBinIcon } from "../../icons";
import { useModal } from "../../hooks/useModal";
import { RequirePermission } from "../../components/auth/RequirePermission";
import {
  PERM_MARKETING_PAGES_CREATE,
  PERM_MARKETING_PAGES_EDIT,
  PERM_MARKETING_PAGES_DELETE,
} from "../../constants/permissions";
import {
  deleteMarketingPage,
  fetchMarketingPages,
  type MarketingPage,
} from "../../api/marketingPages";
import { withClientPagination } from "../../utils/dataTableUtils";
import { getWebsiteUrl } from "../../config/env";
import { WebsiteViewLink, AdminViewLink } from "../../components/common/WebsiteLink";

const WEBSITE_URL = getWebsiteUrl();

const fetchPaginated = withClientPagination(fetchMarketingPages, [
  "slug",
  "course_title",
]);

export default function MarketingPageList() {
  const [deleteTarget, setDeleteTarget] = useState<MarketingPage | null>(null);
  const [deleting, setDeleting] = useState(false);
  const { isOpen: isDeleteModalOpen, openModal: openDeleteModal, closeModal: closeDeleteModal } =
    useModal();
  const dataTableRef = useRef<DataTableRef>(null);

  const handleDeleteClick = useCallback(
    (row: MarketingPage) => {
      setDeleteTarget(row);
      openDeleteModal();
    },
    [openDeleteModal],
  );

  const handleDeleteCancel = () => {
    setDeleteTarget(null);
    closeDeleteModal();
  };

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await deleteMarketingPage(deleteTarget.id);
      dataTableRef.current?.refetch();
      setDeleteTarget(null);
      closeDeleteModal();
    } catch (err: unknown) {
      alert((err as { response?: { data?: { message?: string } } })?.response?.data?.message || "Failed to delete");
    } finally {
      setDeleting(false);
    }
  };

  const columns = [
    {
      key: "course_title",
      header: "Course",
      sortable: true,
      render: (row: MarketingPage) => (
        <span className="font-medium text-gray-800 dark:text-white/90">
          {row.course_title ?? `Course #${row.course_id}`}
        </span>
      ),
    },
    {
      key: "slug",
      header: "Slug",
      sortable: true,
      render: (row: MarketingPage) => (
        <code className="text-theme-sm text-gray-600 dark:text-gray-400">/marketing/{row.slug}</code>
      ),
    },
    {
      key: "is_published",
      header: "Status",
      render: (row: MarketingPage) => (
        <span
          className={
            row.is_published
              ? "text-success-600 text-theme-sm"
              : "text-gray-500 text-theme-sm"
          }
        >
          {row.is_published ? "Published" : "Draft"}
        </span>
      ),
    },
    {
      key: "actions",
      header: "Actions",
      render: (row: MarketingPage) => {
        const websiteUrl = row.is_published
          ? `${WEBSITE_URL}/marketing/${row.slug}`
          : null;
        return (
          <div className="flex items-center gap-2">
            {websiteUrl
              ? <WebsiteViewLink href={websiteUrl} />
              : <AdminViewLink to={`/marketing-pages/${row.id}`} />}
            <RequirePermission permissions={[PERM_MARKETING_PAGES_EDIT]}>
              <Link
                to={`/marketing-pages/${row.id}/edit`}
                className="inline-flex items-center justify-center gap-1.5 rounded-lg px-2.5 py-2 text-sm text-gray-600 transition hover:bg-gray-100 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-white"
                title="Edit"
              >
                <PencilIcon className="size-4 shrink-0 fill-current" />
                Edit
              </Link>
            </RequirePermission>
            <RequirePermission permissions={[PERM_MARKETING_PAGES_DELETE]}>
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
        );
      },
    },
  ];

  return (
    <>
      <PageMeta title="Marketing Pages | StudyCafe Admin" description="Course marketing landing pages" />
      <PageBreadcrumb
        pageTitle="Marketing Pages"
        actions={
          <RequirePermission permissions={[PERM_MARKETING_PAGES_CREATE]}>
            <Link
              to="/marketing-pages/create"
              className="inline-flex items-center gap-2 rounded-lg bg-brand-500 px-4 py-2.5 text-sm font-medium text-white hover:bg-brand-600"
            >
              Create page
            </Link>
          </RequirePermission>
        }
      />
      <div className="space-y-6">
        <DataTable<MarketingPage>
          ref={dataTableRef}
          columns={columns}
          fetchData={fetchPaginated}
          initialPageSize={10}
          enableSearch
          enableSorting
          enablePagination
          searchPlaceholder="Search marketing pages…"
          emptyMessage="No marketing pages yet. Create one for a course."
        />
      </div>
      <ConfirmDeleteModal
        isOpen={isDeleteModalOpen}
        onClose={handleDeleteCancel}
        onConfirm={handleDeleteConfirm}
        isLoading={deleting}
        title="Delete marketing page?"
        itemName={deleteTarget ? `/marketing/${deleteTarget.slug}` : undefined}
      />
    </>
  );
}
