import { useState, useRef, useCallback } from "react";
import { Link } from "react-router";
import PageMeta from "../../components/common/PageMeta";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import { ConfirmDeleteModal } from "../../components/ui/modal/ConfirmDeleteModal";
import { DataTable, type DataTableRef } from "../../components/tables/data-table/DataTable";
import { PencilIcon, TrashBinIcon } from "../../icons";
import { useModal } from "../../hooks/useModal";
import { bannersApi, fetchBannersPaginated, type BannerRecord } from "../../api/banners";
import Badge from "../../components/ui/badge/Badge";

export default function BannerList() {
  const [deleteTarget, setDeleteTarget] = useState<BannerRecord | null>(null);
  const [deleting, setDeleting] = useState(false);
  const { isOpen: isDeleteModalOpen, openModal: openDeleteModal, closeModal: closeDeleteModal } = useModal();
  const dataTableRef = useRef<DataTableRef>(null);

  const handleDeleteClick = useCallback((banner: BannerRecord) => {
    setDeleteTarget(banner);
    openDeleteModal();
  }, [openDeleteModal]);

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await bannersApi.delete(deleteTarget.id);
      dataTableRef.current?.refetch();
      setDeleteTarget(null);
      closeDeleteModal();
    } catch (err: any) {
      console.error("Failed to delete banner", err);
      alert(err?.response?.data?.message || "Failed to delete banner");
    } finally {
      setDeleting(false);
    }
  };

  const columns = [
    {
      key: "identifier",
      header: "Identifier",
      sortable: true,
      render: (row: BannerRecord) => (
        <span className="font-medium text-gray-800 text-theme-sm dark:text-white/90">
          {row.identifier}
        </span>
      ),
    },
    {
      key: "preview",
      header: "Preview (Desktop)",
      render: (row: BannerRecord) => (
        <div className="h-12 w-24 overflow-hidden rounded border border-gray-200 dark:border-gray-800">
          <img
            src={row.desktop_image_url}
            alt={row.identifier}
            className="h-full w-full object-cover"
          />
        </div>
      ),
    },
    {
      key: "is_active",
      header: "Status",
      sortable: true,
      render: (row: BannerRecord) => (
        <Badge color={row.is_active ? "success" : "error"}>
          {row.is_active ? "Active" : "Inactive"}
        </Badge>
      ),
    },
    {
        key: "link_url",
        header: "Link",
        render: (row: BannerRecord) => (
          <span className="text-gray-500 text-theme-sm dark:text-gray-400 truncate max-w-[200px] block">
            {row.link_url || "—"}
          </span>
        ),
      },
    {
      key: "actions",
      header: "Actions",
      align: "end" as const,
      render: (row: BannerRecord) => (
        <div className="flex items-center justify-end gap-2">
          <Link
            to={`/banners/${row.id}/edit`}
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
      <PageMeta title="Banners | StudyCafe Admin" />
      <PageBreadcrumb
        pageTitle="Banners"
        actions={
          <Link
            to="/banners/create"
            className="inline-flex items-center justify-center gap-2 rounded-lg px-4 py-3 text-sm font-medium text-white transition bg-brand-500 shadow-theme-xs hover:bg-brand-600"
          >
            Create New
          </Link>
        }
      />
      <div className="space-y-6">
        <DataTable<BannerRecord>
          ref={dataTableRef}
          columns={columns}
          fetchData={fetchBannersPaginated}
          initialPageSize={10}
          enableSearch
          enableSorting
          enablePagination
          searchPlaceholder="Search banners…"
        />
      </div>

      <ConfirmDeleteModal
        isOpen={isDeleteModalOpen}
        onClose={closeDeleteModal}
        onConfirm={handleDeleteConfirm}
        title="Delete Banner"
        itemName={deleteTarget?.identifier}
        isLoading={deleting}
      />
    </>
  );
}
