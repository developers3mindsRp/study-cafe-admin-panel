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
  fetchCertificateLinksPaginated,
  deleteCertificateLink,
} from "../../api/certificateLinks";
import type { CertificateLink, CertificateLinkEffectiveStatus } from "../../types/certificateLink";
import { getWebsiteUrl } from "../../config/env";
import { WebsiteViewLink } from "../../components/common/WebsiteLink";
import { formatDateTimeLong as formatDate } from "../../utils/formatDate";
import CertificateLinkShareModal from "./CertificateLinkShareModal";

const WEBSITE_URL = getWebsiteUrl();

/** Public URL, or null when the link is not currently claimable. */
function publicUrlFor(row: CertificateLink): string | null {
  return row.effective_status === "active" && row.token
    ? `${WEBSITE_URL}/certificate/${row.token}`
    : null;
}

const STATUS_STYLES: Record<CertificateLinkEffectiveStatus, { label: string; className: string }> = {
  active: { label: "Active", className: "bg-emerald-100 text-emerald-700" },
  draft: { label: "Draft", className: "bg-gray-100 text-gray-500 dark:bg-white/[0.05] dark:text-gray-400" },
  expired: { label: "Expired", className: "bg-amber-100 text-amber-700" },
  disabled: { label: "Disabled", className: "bg-gray-100 text-gray-500 dark:bg-white/[0.05] dark:text-gray-400" },
  full: { label: "Limit reached", className: "bg-amber-100 text-amber-700" },
  deleted: { label: "Deleted", className: "bg-red-100 text-red-700" },
};

export default function CertificateLinkList() {
  const [deleteTarget, setDeleteTarget] = useState<CertificateLink | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [shareTarget, setShareTarget] = useState<CertificateLink | null>(null);
  const { isOpen: isDeleteModalOpen, openModal: openDeleteModal, closeModal: closeDeleteModal } = useModal();
  const { isOpen: isShareModalOpen, openModal: openShareModal, closeModal: closeShareModal } = useModal();
  const dataTableRef = useRef<DataTableRef>(null);

  const handleShareClick = useCallback(
    (item: CertificateLink) => {
      setShareTarget(item);
      openShareModal();
    },
    [openShareModal],
  );

  const handleDeleteClick = useCallback(
    (item: CertificateLink) => {
      setDeleteTarget(item);
      openDeleteModal();
    },
    [openDeleteModal],
  );

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await deleteCertificateLink(deleteTarget.id);
      dataTableRef.current?.refetch();
      setDeleteTarget(null);
      closeDeleteModal();
    } catch (err: unknown) {
      console.error(err);
      alert("Failed to delete certificate link");
    } finally {
      setDeleting(false);
    }
  };

  const columns = [
    {
      key: "title",
      header: "Title",
      sortable: true,
      render: (row: CertificateLink) => (
        <div className="flex flex-col">
          <span className="font-medium text-gray-800 text-theme-sm dark:text-white/90">{row.title}</span>
          <span className="text-theme-xs text-gray-400">{row.course_title || `Course #${row.course_id}`}</span>
        </div>
      ),
    },
    {
      key: "expires_at",
      header: "Expires",
      sortable: true,
      render: (row: CertificateLink) => (
        <span className="text-gray-500 text-theme-sm dark:text-gray-400">{formatDate(row.expires_at)}</span>
      ),
    },
    {
      key: "claims_count",
      header: "Issued / Limit",
      sortable: true,
      render: (row: CertificateLink) => (
        <span className="text-gray-500 text-theme-sm dark:text-gray-400">
          {row.claims_count} / {row.max_claims ?? "∞"}
        </span>
      ),
    },
    {
      key: "certificate_date",
      header: "Printed date",
      sortable: false,
      render: (row: CertificateLink) => (
        <span className="text-gray-500 text-theme-sm dark:text-gray-400">
          {row.certificate_date ? String(row.certificate_date).slice(0, 10) : "Claim date"}
        </span>
      ),
    },
    {
      key: "effective_status",
      header: "Status",
      sortable: false,
      render: (row: CertificateLink) => {
        const style = STATUS_STYLES[row.effective_status] ?? STATUS_STYLES.draft;
        return (
          <span className={`rounded-full px-2 py-1 text-theme-xs font-semibold ${style.className}`}>
            {style.label}
          </span>
        );
      },
    },
    {
      key: "actions",
      header: "Actions",
      align: "end" as const,
      sortable: false,
      render: (row: CertificateLink) => {
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
            <Link
              to={`/certificate-links/${row.id}/claims`}
              className="inline-flex items-center justify-center gap-1.5 rounded-lg px-2.5 py-2 text-sm text-gray-600 transition hover:bg-gray-100 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-white"
            >
              Leads
            </Link>
            <RequirePermission permissions={["certificate_links:edit"]} fallback={null}>
              <Link
                to={`/certificate-links/${row.id}/edit`}
                className="inline-flex items-center justify-center gap-1.5 rounded-lg px-2.5 py-2 text-sm text-gray-600 transition hover:bg-gray-100 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-white"
              >
                <PencilIcon className="size-4 shrink-0 fill-current" />
                Edit
              </Link>
            </RequirePermission>
            <RequirePermission permissions={["certificate_links:delete"]} fallback={null}>
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
      <PageMeta
        title="Certificate Links | StudyCafe Admin"
        description="Public certificate download links"
      />
      <PageBreadcrumb
        pageTitle="Certificate Links"
        actions={
          <RequirePermission permissions={["certificate_links:create"]} fallback={null}>
            <Link
              to="/certificate-links/create"
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-brand-500 px-4 py-3 text-sm font-medium text-white shadow-theme-xs transition hover:bg-brand-600"
            >
              Create New
            </Link>
          </RequirePermission>
        }
      />
      <div className="space-y-6">
        <DataTable<CertificateLink>
          ref={dataTableRef}
          columns={columns}
          fetchData={fetchCertificateLinksPaginated}
          initialPageSize={10}
          initialSortBy="created_at"
          initialSortOrder="DESC"
          pageSizeOptions={[10, 20, 50, 100]}
          enableSearch
          enableSorting
          enablePagination
          searchPlaceholder="Search by title or token…"
          emptyMessage="No certificate links yet."
        />
      </div>

      <ConfirmDeleteModal
        isOpen={isDeleteModalOpen}
        onClose={() => {
          setDeleteTarget(null);
          closeDeleteModal();
        }}
        onConfirm={handleDeleteConfirm}
        title="Delete certificate link"
        itemName={deleteTarget?.title}
        isLoading={deleting}
      />

      <CertificateLinkShareModal
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
