import { useState, useRef, useCallback } from "react";
import { Link } from "react-router";
import PageMeta from "../../components/common/PageMeta";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import { ConfirmDeleteModal } from "../../components/ui/modal/ConfirmDeleteModal";
import { DataTable, type DataTableRef } from "../../components/tables/data-table/DataTable";
import { PencilIcon, TrashBinIcon } from "../../icons";
import { useModal } from "../../hooks/useModal";
import { RequirePermission } from "../../components/auth/RequirePermission";
import { fetchPromoCodesPaginated, deletePromoCode, type PromoCode } from "../../api/promoCodes";

function getErrorMessage(error: unknown): string | undefined {
  if (error instanceof Error) return error.message;
  if (typeof error === "object" && error !== null && "response" in error) {
    return (error as { response?: { data?: { message?: string } } }).response?.data?.message;
  }
  return undefined;
}

export default function PromoCodeList() {
  const [deleteTarget, setDeleteTarget] = useState<PromoCode | null>(null);
  const [deleting, setDeleting] = useState(false);
  const { isOpen: isDeleteModalOpen, openModal: openDeleteModal, closeModal: closeDeleteModal } = useModal();
  const dataTableRef = useRef<DataTableRef>(null);

  const handleDeleteClick = useCallback(
    (item: PromoCode) => {
      setDeleteTarget(item);
      openDeleteModal();
    },
    [openDeleteModal]
  );

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await deletePromoCode(deleteTarget.id);
      dataTableRef.current?.refetch();
      setDeleteTarget(null);
      closeDeleteModal();
    } catch (err: unknown) {
      console.error("Failed to delete promo code", err);
      alert(getErrorMessage(err) || "Failed to delete promo code");
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
      key: "code",
      header: "Code",
      sortable: true,
      render: (row: PromoCode) => (
        <span className="font-medium text-gray-800 text-theme-sm dark:text-white/90">{row.code}</span>
      ),
    },
    {
      key: "discount",
      header: "Discount",
      sortable: false,
      render: (row: PromoCode) => {
        const value = row.discount_value ?? 0;
        return (
          <span className="text-gray-500 text-theme-sm dark:text-gray-400">
            {row.discount_type === "percentage" ? `${value}%` : `₹${value}`}
          </span>
        );
      },
    },
    {
      key: "target_type",
      header: "Target",
      sortable: true,
      render: (row: PromoCode) => (
        <span className="text-gray-500 text-theme-sm dark:text-gray-400">
          {row.target_type === "courses" ? "Courses" : "Membership Plans"}
        </span>
      ),
    },
    {
      key: "validity",
      header: "Validity",
      sortable: false,
      render: (row: PromoCode) => (
        <div className="text-gray-500 text-theme-sm dark:text-gray-400">
          {row.valid_from || "—"} → {row.valid_to || "—"}
        </div>
      ),
    },
    {
      key: "active",
      header: "Active",
      sortable: true,
      render: (row: PromoCode) => (
        <span className={`rounded-full px-2 py-1 text-theme-xs font-semibold ${row.active ? "bg-emerald-100 text-emerald-700" : "bg-gray-100 text-gray-500 dark:bg-white/[0.05] dark:text-gray-400"}`}>
          {row.active ? "Yes" : "No"}
        </span>
      ),
    },
    {
      key: "actions",
      header: "Actions",
      align: "end" as const,
      sortable: false,
      render: (row: PromoCode) => (
        <div className="flex items-center justify-end gap-2">
          <RequirePermission permissions={["admin:access"]} fallback={null}>
            <Link
              to={`/promo-codes/${row.id}/edit`}
              className="inline-flex items-center justify-center gap-1.5 rounded-lg px-2.5 py-2 text-sm text-gray-600 transition hover:bg-gray-100 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-white"
              title="Edit"
            >
              <PencilIcon className="size-4 shrink-0 fill-current" />
              Edit
            </Link>
          </RequirePermission>
          <RequirePermission permissions={["admin:access"]} fallback={null}>
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
        title="Promo Codes | StudyCafe Admin"
        description="Manage promo codes and discounts for the admin panel"
      />
      <PageBreadcrumb
        pageTitle="Promo Codes"
        actions={
          <RequirePermission permissions={["admin:access"]} fallback={null}>
            <Link
              to="/promo-codes/create"
              className="inline-flex items-center justify-center gap-2 rounded-lg px-4 py-3 text-sm font-medium text-white transition bg-brand-500 shadow-theme-xs hover:bg-brand-600"
            >
              Create New
            </Link>
          </RequirePermission>
        }
      />
      <div className="space-y-6">
        <DataTable<PromoCode>
          ref={dataTableRef}
          columns={columns}
          fetchData={fetchPromoCodesPaginated}
          initialPageSize={10}
          pageSizeOptions={[10, 20, 50, 100]}
          enableSearch
          enableSorting
          enablePagination
          searchPlaceholder="Search promo codes…"
          emptyMessage="No promo codes found."
        />
      </div>

      <ConfirmDeleteModal
        isOpen={isDeleteModalOpen}
        onClose={handleDeleteCancel}
        onConfirm={handleDeleteConfirm}
        title="Delete Promo Code"
        itemName={deleteTarget?.code}
        isLoading={deleting}
      />
    </>
  );
}
