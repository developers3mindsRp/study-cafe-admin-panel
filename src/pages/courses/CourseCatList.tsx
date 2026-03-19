import { useState, useRef, useCallback } from "react";
import { Link } from "react-router";
import PageMeta from "../../components/common/PageMeta";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import { ConfirmDeleteModal } from "../../components/ui/modal/ConfirmDeleteModal";
import { DataTable, type DataTableRef } from "../../components/tables/data-table/DataTable";
import { PencilIcon, TrashBinIcon } from "../../icons";
import { useModal } from "../../hooks/useModal";
import { fetchCourseCats, deleteCourseCat, type CourseCat } from "../../api/courses";
import { withClientPagination } from "../../utils/dataTableUtils";

const fetchCourseCatsPaginated = withClientPagination(fetchCourseCats, ["name", "slug"]);

export default function CourseCatList() {
  const [deleteTarget, setDeleteTarget] = useState<CourseCat | null>(null);
  const [deleting, setDeleting] = useState(false);
  const { isOpen: isDeleteModalOpen, openModal: openDeleteModal, closeModal: closeDeleteModal } = useModal();
  const dataTableRef = useRef<DataTableRef>(null);

  const handleDeleteClick = useCallback((cat: CourseCat) => {
    setDeleteTarget(cat);
    openDeleteModal();
  }, [openDeleteModal]);

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await deleteCourseCat(deleteTarget.id);
      dataTableRef.current?.refetch();
      setDeleteTarget(null);
      closeDeleteModal();
    } catch (err: unknown) {
      console.error("Failed to delete course category", err);
      alert((err as any)?.response?.data?.message || "Failed to delete course category");
    } finally {
      setDeleting(false);
    }
  };

  const columns = [
    {
      key: "name",
      header: "Name",
      sortable: true,
      render: (row: CourseCat) => (
        <span className="font-medium text-gray-800 text-theme-sm dark:text-white/90">{row.name}</span>
      ),
    },
    {
      key: "slug",
      header: "Slug",
      sortable: true,
      render: (row: CourseCat) => (
        <span className="text-gray-500 text-theme-sm font-mono dark:text-gray-400">{row.slug || "—"}</span>
      ),
    },
    {
      key: "is_featured",
      header: "Featured",
      sortable: true,
      render: (row: CourseCat) => (
        <span
          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
            row.is_featured
              ? "bg-success-50 text-success-700 dark:bg-success-500/10 dark:text-success-400"
              : "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400"
          }`}
        >
          {row.is_featured ? "Yes" : "No"}
        </span>
      ),
    },
    {
      key: "actions",
      header: "Actions",
      align: "end" as const,
      sortable: false,
      render: (row: CourseCat) => (
        <div className="flex items-center justify-end gap-2">
          <Link
            to={`/courses/categories/${row.id}/edit`}
            className="inline-flex items-center justify-center gap-1.5 rounded-lg px-2.5 py-2 text-sm text-gray-600 transition hover:bg-gray-100 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-white"
            title="Edit"
          >
            <PencilIcon className="size-4 shrink-0 fill-current" />
            Edit
          </Link>
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
      <PageMeta title="Course Categories | StudyCafe Admin" description="Manage course categories" />
      <PageBreadcrumb
        pageTitle="Course Categories"
        actions={
          <Link
            to="/courses/categories/create"
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-brand-500 px-4 py-3 text-sm font-medium text-white shadow-theme-xs hover:bg-brand-600"
          >
            Add Category
          </Link>
        }
      />
      <div className="space-y-6">
        <DataTable<CourseCat>
          ref={dataTableRef}
          columns={columns}
          fetchData={fetchCourseCatsPaginated}
          initialPageSize={20}
          pageSizeOptions={[10, 20, 50]}
          enableSearch
          enableSorting
          enablePagination
          searchPlaceholder="Search categories…"
          emptyMessage="No course categories found."
        />
      </div>

      <ConfirmDeleteModal
        isOpen={isDeleteModalOpen}
        onClose={() => { setDeleteTarget(null); closeDeleteModal(); }}
        onConfirm={handleDeleteConfirm}
        title="Delete Course Category"
        itemName={deleteTarget?.name}
        isLoading={deleting}
      />
    </>
  );
}
