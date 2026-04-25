import { useState, useRef, useCallback } from "react";
import PageMeta from "../../components/common/PageMeta";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import { DataTable, type DataTableRef } from "../../components/tables/data-table/DataTable";
import { ConfirmDeleteModal } from "../../components/ui/modal/ConfirmDeleteModal";
import { PencilIcon, TrashBinIcon } from "../../icons";
import { useModal } from "../../hooks/useModal";
import {
  downloadCategoriesApi,
  fetchCategoriesPaginated,
  type DownloadCategory,
  type CreateCategoryPayload,
} from "../../api/downloads";
import CategoryForm from "../../components/downloads/CategoryForm";

export default function CategoriesPage() {
  const dataTableRef = useRef<DataTableRef>(null);

  const [editTarget, setEditTarget] = useState<DownloadCategory | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<DownloadCategory | null>(null);
  const [deleting, setDeleting] = useState(false);

  const { isOpen: isFormOpen, openModal: openForm, closeModal: closeForm } = useModal();
  const { isOpen: isDeleteOpen, openModal: openDelete, closeModal: closeDelete } = useModal();

  const handleAddClick = useCallback(() => {
    setEditTarget(null);
    openForm();
  }, [openForm]);

  const handleEditClick = useCallback(
    (cat: DownloadCategory) => {
      setEditTarget(cat);
      openForm();
    },
    [openForm]
  );

  const handleDeleteClick = useCallback(
    (cat: DownloadCategory) => {
      setDeleteTarget(cat);
      openDelete();
    },
    [openDelete]
  );

  const handleFormClose = () => {
    setEditTarget(null);
    closeForm();
  };

  const handleSave = async (payload: CreateCategoryPayload) => {
    if (editTarget) {
      await downloadCategoriesApi.update(editTarget.id, payload);
    } else {
      await downloadCategoriesApi.create(payload);
    }
    dataTableRef.current?.refetch();
  };

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await downloadCategoriesApi.delete(deleteTarget.id);
      dataTableRef.current?.refetch();
      setDeleteTarget(null);
      closeDelete();
    } catch (err: unknown) {
      alert((err as any)?.response?.data?.message ?? "Failed to delete category");
    } finally {
      setDeleting(false);
    }
  };

  const columns = [
    {
      key: "name",
      header: "Name",
      sortable: true,
      render: (row: DownloadCategory) => (
        <span className="font-medium text-gray-800 text-theme-sm dark:text-white/90">
          {row.name}
        </span>
      ),
    },
    {
      key: "slug",
      header: "Slug",
      sortable: true,
      render: (row: DownloadCategory) => (
        <span className="font-mono text-gray-500 text-theme-sm dark:text-gray-400">
          {row.slug ?? "—"}
        </span>
      ),
    },
    {
      key: "file_count",
      header: "Files",
      sortable: false,
      render: (row: DownloadCategory) => (
        <span className="inline-flex items-center rounded-full bg-brand-50 px-2.5 py-0.5 text-xs font-medium text-brand-700 dark:bg-brand-500/10 dark:text-brand-400">
          {row.file_count ?? 0}
        </span>
      ),
    },
    {
      key: "actions",
      header: "Actions",
      align: "end" as const,
      sortable: false,
      render: (row: DownloadCategory) => (
        <div className="flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={() => handleEditClick(row)}
            className="inline-flex items-center justify-center gap-1.5 rounded-lg px-2.5 py-2 text-sm text-gray-600 transition hover:bg-gray-100 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-white"
            title="Edit"
          >
            <PencilIcon className="size-4 shrink-0 fill-current" />
            Edit
          </button>
          <button
            type="button"
            onClick={() => handleDeleteClick(row)}
            className="inline-flex items-center justify-center gap-1.5 rounded-lg px-2.5 py-2 text-sm text-gray-600 transition hover:bg-error-50 hover:text-error-500 dark:text-gray-400 dark:hover:bg-error-500/10 dark:hover:text-error-400"
            title="Delete"
          >
            <TrashBinIcon className="size-4 shrink-0 fill-current" />
            Delete
          </button>
        </div>
      ),
    },
  ];

  return (
    <>
      <PageMeta
        title="Download Categories | StudyCafe Admin"
        description="Manage download file categories"
      />
      <PageBreadcrumb
        pageTitle="Download Categories"
        items={[{ label: "Downloads", path: "/downloads/files" }]}
        actions={
          <button
            type="button"
            onClick={handleAddClick}
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-brand-500 px-4 py-3 text-sm font-medium text-white shadow-theme-xs hover:bg-brand-600"
          >
            Add Category
          </button>
        }
      />

      <div className="space-y-6">
        <DataTable<DownloadCategory>
          ref={dataTableRef}
          columns={columns}
          fetchData={fetchCategoriesPaginated}
          initialPageSize={20}
          pageSizeOptions={[10, 20, 50]}
          enableSearch
          enableSorting
          enablePagination
          searchPlaceholder="Search categories…"
          emptyMessage="No download categories found."
        />
      </div>

      <CategoryForm
        isOpen={isFormOpen}
        onClose={handleFormClose}
        onSave={handleSave}
        initial={editTarget}
      />

      <ConfirmDeleteModal
        isOpen={isDeleteOpen}
        onClose={() => { setDeleteTarget(null); closeDelete(); }}
        onConfirm={handleDeleteConfirm}
        title="Delete Category"
        itemName={deleteTarget?.name}
        isLoading={deleting}
      />
    </>
  );
}
