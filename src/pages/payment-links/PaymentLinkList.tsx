import { useState, useRef, useCallback } from "react";
import { Link } from "react-router";
import PageMeta from "../../components/common/PageMeta";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import { ConfirmDeleteModal } from "../../components/ui/modal/ConfirmDeleteModal";
import { DataTable, type DataTableRef } from "../../components/tables/data-table/DataTable";
import { PencilIcon, TrashBinIcon } from "../../icons";
import { useModal } from "../../hooks/useModal";
import { RequirePermission } from "../../components/auth/RequirePermission";
import { fetchPaymentLinksPaginated, deletePaymentLink, type PaymentLink } from "../../api/paymentLinks";
import { getWebsiteUrl } from "../../config/env";
import { WebsiteViewLink } from "../../components/common/WebsiteLink";
import { formatDateTimeLong as formatDate } from "../../utils/formatDate";
import PaymentLinkShareModal from "./PaymentLinkShareModal";

const WEBSITE_URL = getWebsiteUrl();

/** Public URL of a link, or null while it is still a draft. */
function publicUrlFor(row: PaymentLink): string | null {
  return row.status === "publish" && row.slug ? `${WEBSITE_URL}/payment-links/${row.slug}` : null;
}

export default function PaymentLinkList() {
  const [deleteTarget, setDeleteTarget] = useState<PaymentLink | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [shareTarget, setShareTarget] = useState<PaymentLink | null>(null);
  const { isOpen: isDeleteModalOpen, openModal: openDeleteModal, closeModal: closeDeleteModal } = useModal();
  const { isOpen: isShareModalOpen, openModal: openShareModal, closeModal: closeShareModal } = useModal();
  const dataTableRef = useRef<DataTableRef>(null);

  const handleShareClick = useCallback(
    (item: PaymentLink) => {
      setShareTarget(item);
      openShareModal();
    },
    [openShareModal],
  );

  const handleDeleteClick = useCallback(
    (item: PaymentLink) => {
      setDeleteTarget(item);
      openDeleteModal();
    },
    [openDeleteModal],
  );

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await deletePaymentLink(deleteTarget.id);
      dataTableRef.current?.refetch();
      setDeleteTarget(null);
      closeDeleteModal();
    } catch (err: unknown) {
      console.error(err);
      alert("Failed to delete payment link");
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
      key: "title",
      header: "Title",
      sortable: true,
      render: (row: PaymentLink) => (
        <span className="font-medium text-gray-800 text-theme-sm dark:text-white/90">{row.title}</span>
      ),
    },
    {
      key: "slug",
      header: "Slug",
      sortable: true,
      render: (row: PaymentLink) => <span className="text-gray-500 text-theme-sm dark:text-gray-400">{row.slug}</span>,
    },
    {
      key: "sells",
      header: "Sells",
      sortable: false,
      render: (row: PaymentLink) => {
        const type = row.product_type ?? "custom";
        if (type === "custom") {
          return <span className="text-gray-400 text-theme-sm">Payment only</span>;
        }
        const label = row.product?.name || `#${row.product_id ?? "?"}`;
        return (
          <div className="flex flex-col">
            <span className="text-gray-800 text-theme-sm dark:text-white/90">{label}</span>
            <span className="text-theme-xs text-gray-400">
              {type === "course" ? "Course" : "Membership"}
              {row.auto_enroll === false ? " · manual grant" : " · auto-enrol"}
            </span>
          </div>
        );
      },
    },
    {
      key: "prices",
      header: "Prices",
      sortable: false,
      render: (row: PaymentLink) => (
        <span className="text-gray-500 text-theme-sm dark:text-gray-400">
          ₹{row.sale_price} <span className="text-gray-400 line-through">₹{row.amount}</span>
        </span>
      ),
    },
    {
      key: "expiry",
      header: "Expiry",
      sortable: true,
      render: (row: PaymentLink) => (
        <span className="text-gray-500 text-theme-sm dark:text-gray-400">{formatDate(row.expiry)}</span>
      ),
    },
    {
      key: "seats",
      header: "Paid / Total seats",
      sortable: false,
      render: (row: PaymentLink) => (
        <span className="text-gray-500 text-theme-sm dark:text-gray-400">
          {row.paid_orders_count ?? row.seats_booked} / {row.total_seats}
        </span>
      ),
    },
    {
      key: "status",
      header: "Status",
      sortable: true,
      render: (row: PaymentLink) => (
        <span
          className={`rounded-full px-2 py-1 text-theme-xs font-semibold ${
            row.status === "publish"
              ? "bg-emerald-100 text-emerald-700"
              : "bg-gray-100 text-gray-500 dark:bg-white/[0.05] dark:text-gray-400"
          }`}
        >
          {row.status === "publish" ? "Published" : "Draft"}
        </span>
      ),
    },
    {
      key: "actions",
      header: "Actions",
      align: "end" as const,
      sortable: false,
      render: (row: PaymentLink) => {
        const websiteUrl = publicUrlFor(row);
        return (
          <div className="flex flex-nowrap items-center justify-end gap-2">
            {websiteUrl && <WebsiteViewLink href={websiteUrl} />}
            {websiteUrl && (
              <button
                type="button"
                onClick={() => handleShareClick(row)}
                className="inline-flex items-center justify-center gap-1.5 rounded-lg px-2.5 py-2 text-sm text-gray-600 transition hover:bg-gray-100 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-white"
              >
                Share
              </button>
            )}
            <RequirePermission permissions={["payment_links:edit"]} fallback={null}>
              <Link
                to={`/payment-links/${row.id}/edit`}
                className="inline-flex items-center justify-center gap-1.5 rounded-lg px-2.5 py-2 text-sm text-gray-600 transition hover:bg-gray-100 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-white"
              >
                <PencilIcon className="size-4 shrink-0 fill-current" />
                Edit
              </Link>
            </RequirePermission>
            <RequirePermission permissions={["payment_links:delete"]} fallback={null}>
              <button
                type="button"
                onClick={() => handleDeleteClick(row)}
                className="inline-flex items-center justify-center gap-1.5 rounded-lg px-2.5 py-2 text-sm text-gray-600 transition hover:bg-error-50 hover:text-error-500 dark:text-gray-400 dark:hover:bg-error-500/10 dark:hover:text-error-400"
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
      <PageMeta title="Payment Links | StudyCafe Admin" description="Manage payment links" />
      <PageBreadcrumb
        pageTitle="Payment Links"
        actions={
          <RequirePermission permissions={["payment_links:create"]} fallback={null}>
            <Link
              to="/payment-links/create"
              className="inline-flex items-center justify-center gap-2 rounded-lg px-4 py-3 text-sm font-medium text-white transition bg-brand-500 shadow-theme-xs hover:bg-brand-600"
            >
              Create New
            </Link>
          </RequirePermission>
        }
      />
      <div className="space-y-6">
        <DataTable<PaymentLink>
          ref={dataTableRef}
          columns={columns}
          fetchData={fetchPaymentLinksPaginated}
          initialPageSize={10}
          initialSortBy="created_at"
          initialSortOrder="DESC"
          pageSizeOptions={[10, 20, 50, 100]}
          enableSearch
          enableSorting
          enablePagination
          searchPlaceholder="Search payment links…"
          emptyMessage="No payment links found."
        />
      </div>

      <ConfirmDeleteModal
        isOpen={isDeleteModalOpen}
        onClose={handleDeleteCancel}
        onConfirm={handleDeleteConfirm}
        title="Delete payment link"
        itemName={deleteTarget?.title}
        isLoading={deleting}
      />

      <PaymentLinkShareModal
        isOpen={isShareModalOpen}
        onClose={() => {
          setShareTarget(null);
          closeShareModal();
        }}
        link={shareTarget}
        url={shareTarget ? publicUrlFor(shareTarget) : null}
      />
    </>
  );
}
