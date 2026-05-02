import { useState, useRef, useCallback } from "react";
import { Link } from "react-router";
import PageMeta from "../../components/common/PageMeta";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import { ConfirmDeleteModal } from "../../components/ui/modal/ConfirmDeleteModal";
import { DataTable, type DataTableRef } from "../../components/tables/data-table/DataTable";
import { PencilIcon, TrashBinIcon } from "../../icons";
import { useModal } from "../../hooks/useModal";
import { RequirePermission } from "../../components/auth/RequirePermission";
import { PERM_NEWSLETTER_CREATE, PERM_NEWSLETTER_EDIT, PERM_NEWSLETTER_DELETE } from "../../constants/permissions";
import {
  fetchNewsletterTemplates,
  deleteNewsletterTemplate,
  type NewsletterTemplate,
} from "../../api/newsletter";
import { withClientPagination } from "../../utils/dataTableUtils";

const fetchTemplatesPaginated = withClientPagination(
  fetchNewsletterTemplates,
  ["name", "subject"]
);

export default function TemplatesList() {
  const [deleteTarget, setDeleteTarget] = useState<NewsletterTemplate | null>(null);
  const [deleting, setDeleting] = useState(false);
  const { isOpen: isDeleteModalOpen, openModal: openDeleteModal, closeModal: closeDeleteModal } = useModal();
  const dataTableRef = useRef<DataTableRef>(null);

  const handleDeleteClick = useCallback((t: NewsletterTemplate) => {
    setDeleteTarget(t);
    openDeleteModal();
  }, [openDeleteModal]);

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await deleteNewsletterTemplate(deleteTarget.id);
      dataTableRef.current?.refetch();
      setDeleteTarget(null);
      closeDeleteModal();
    } catch (err: unknown) {
      console.error("Failed to delete template", err);
      alert((err as any)?.response?.data?.message || "Failed to delete template");
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
      key: "name",
      header: "Name",
      sortable: true,
      render: (row: NewsletterTemplate) => (
        <span className="font-medium text-gray-800 text-theme-sm dark:text-white/90">
          {row.name}
        </span>
      ),
    },
    {
      key: "subject",
      header: "Subject",
      sortable: true,
      render: (row: NewsletterTemplate) => (
        <span className="text-gray-500 text-theme-sm dark:text-gray-400">
          {row.subject}
        </span>
      ),
    },
    {
      key: "created_at",
      header: "Created",
      sortable: true,
      render: (row: NewsletterTemplate) => (
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
      render: (row: NewsletterTemplate) => (
        <div className="flex items-center justify-end gap-2">
          <RequirePermission permissions={[PERM_NEWSLETTER_EDIT]} fallback={null}>
            <Link
              to={`/newsletter/templates/${row.id}/edit`}
              className="inline-flex items-center justify-center gap-1.5 rounded-lg px-2.5 py-2 text-sm text-gray-600 transition hover:bg-gray-100 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-white"
              title="Edit"
            >
              <PencilIcon className="size-4 shrink-0 fill-current" />
              Edit
            </Link>
          </RequirePermission>
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
        title="Newsletter Templates | StudyCafe Admin"
        description="Manage newsletter email templates"
      />
      <PageBreadcrumb
        pageTitle="Newsletter Templates"
        actions={
          <RequirePermission permissions={[PERM_NEWSLETTER_CREATE]} fallback={null}>
            <Link
              to="/newsletter/templates/create"
              className="inline-flex items-center justify-center gap-2 rounded-lg px-4 py-3 text-sm font-medium text-white transition bg-brand-500 shadow-theme-xs hover:bg-brand-600"
            >
              Create New
            </Link>
          </RequirePermission>
        }
      />
      <div className="space-y-6">
        <DataTable<NewsletterTemplate>
          ref={dataTableRef}
          columns={columns}
          fetchData={fetchTemplatesPaginated}
          initialPageSize={10}
          initialSortBy="created_at"
          initialSortOrder="DESC"
          pageSizeOptions={[10, 20, 50, 100]}
          enableSearch
          enableSorting
          enablePagination
          searchPlaceholder="Search templates…"
          emptyMessage="No templates yet."
        />
      </div>

      <ConfirmDeleteModal
        isOpen={isDeleteModalOpen}
        onClose={handleDeleteCancel}
        onConfirm={handleDeleteConfirm}
        title="Delete Template"
        itemName={deleteTarget?.name}
        isLoading={deleting}
      />
    </>
  );
}
