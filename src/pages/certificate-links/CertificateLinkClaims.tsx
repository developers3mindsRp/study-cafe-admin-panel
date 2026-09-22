import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router";
import PageMeta from "../../components/common/PageMeta";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import Button from "../../components/ui/button/Button";
import { DownloadIcon } from "../../icons";
import { DataTable } from "../../components/tables/data-table/DataTable";
import { ExportProgressBar } from "../../components/export/ExportProgressBar";
import { useCsvExport } from "../../hooks/useCsvExport";
import { fetchAllPaginatedForExport } from "../../utils/fetchAllPaginatedForExport";
import type { ExportProgressCallback } from "../../utils/exportProgress";
import { CERTIFICATE_LINK_CLAIM_EXPORT_COLUMNS } from "../../utils/certificateLinkClaimExportColumns";
import { fetchCertificateLink, fetchCertificateLinkClaims } from "../../api/certificateLinks";
import type { CertificateLink, CertificateLinkClaim } from "../../types/certificateLink";
import type { DataTableFetchParams } from "../../components/tables/data-table/DataTable.types";
import { formatDateTimeLong as formatDate } from "../../utils/formatDate";

/** The API caps claims paging at 500 per request; match it so exports do the fewest round trips. */
const EXPORT_PAGE_SIZE = 500;

export default function CertificateLinkClaims() {
  const { id } = useParams();
  const [link, setLink] = useState<CertificateLink | null>(null);

  useEffect(() => {
    if (!id) return;
    let cancelled = false;
    (async () => {
      try {
        const row = await fetchCertificateLink(id);
        if (!cancelled) setLink(row);
      } catch {
        if (!cancelled) setLink(null);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [id]);

  const fetchData = useCallback(
    async (params: DataTableFetchParams) => {
      if (!id) return { data: [], meta: { total: 0, page: 1, limit: 10, totalPages: 0, hasNextPage: false, hasPreviousPage: false } };
      return fetchCertificateLinkClaims(id, {
        page: params.page,
        limit: params.limit,
        search: params.search,
      });
    },
    [id],
  );

  const fetchRowsForExport = useCallback(
    async (onProgress: ExportProgressCallback) => {
      if (!id) return [];
      return fetchAllPaginatedForExport<CertificateLinkClaim>({
        pageSize: EXPORT_PAGE_SIZE,
        onProgress,
        fetchPage: async (page, limit) => {
          const res = await fetchCertificateLinkClaims(id, { page, limit });
          return { data: res.data, total: res.meta.total };
        },
      });
    },
    [id],
  );

  const {
    runExport,
    progress: exportProgress,
    isExporting,
    buttonLabel,
    buttonTitle,
  } = useCsvExport<CertificateLinkClaim>({
    columns: CERTIFICATE_LINK_CLAIM_EXPORT_COLUMNS,
    filename: `certificate-link-${id}-leads`,
    fetchRows: fetchRowsForExport,
  });

  const columns = useMemo(
    () => [
      {
        key: "name",
        header: "Name",
        sortable: false,
        render: (row: CertificateLinkClaim) => (
          <span className="font-medium text-gray-800 text-theme-sm dark:text-white/90">{row.name}</span>
        ),
      },
      {
        key: "email",
        header: "Email",
        sortable: false,
        render: (row: CertificateLinkClaim) => (
          <span className="text-gray-500 text-theme-sm dark:text-gray-400">{row.email}</span>
        ),
      },
      {
        key: "phone",
        header: "Phone",
        sortable: false,
        render: (row: CertificateLinkClaim) => (
          <span className="text-gray-500 text-theme-sm dark:text-gray-400">{row.phone || "—"}</span>
        ),
      },
      {
        key: "certificate_number",
        header: "Certificate No.",
        sortable: false,
        render: (row: CertificateLinkClaim) => (
          <span className="text-gray-800 text-theme-sm dark:text-white/90">
            {row.certificate_number || "—"}
          </span>
        ),
      },
      {
        key: "created_at",
        header: "Claimed",
        sortable: false,
        render: (row: CertificateLinkClaim) => (
          <div className="flex flex-col">
            <span className="text-gray-500 text-theme-sm dark:text-gray-400">{formatDate(row.created_at)}</span>
            {row.download_count > 1 && (
              <span className="text-theme-xs text-gray-400">
                {row.download_count} downloads · last {formatDate(row.last_claimed_at)}
              </span>
            )}
          </div>
        ),
      },
      {
        key: "source",
        header: "Source",
        sortable: false,
        render: (row: CertificateLinkClaim) => (
          <div className="flex flex-col">
            <span className="text-gray-500 text-theme-sm dark:text-gray-400">{row.utm_source || "—"}</span>
            <span className="text-theme-xs text-gray-400">{row.ip || ""}</span>
          </div>
        ),
      },
    ],
    [],
  );

  return (
    <>
      <PageMeta
        title="Certificate Link Leads | StudyCafe Admin"
        description="People who claimed a certificate through this link"
      />
      <PageBreadcrumb
        pageTitle={link ? `Leads — ${link.title}` : "Certificate link leads"}
        actions={
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={isExporting}
              className="h-10 whitespace-nowrap"
              startIcon={<DownloadIcon className="size-4 shrink-0" />}
              onClick={() => void runExport()}
              title={buttonTitle}
            >
              {buttonLabel}
            </Button>
            <Link
              to="/certificate-links"
              className="inline-flex items-center justify-center rounded-lg border border-gray-300 px-4 py-2.5 text-sm font-medium text-gray-700 transition hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-white/[0.03]"
            >
              Back to links
            </Link>
          </div>
        }
      />

      <div className="space-y-6">
        <ExportProgressBar progress={exportProgress} label="Exporting leads" />

        {link && (
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {link.course_title || `Course #${link.course_id}`} · {link.claims_count} certificate
            {link.claims_count === 1 ? "" : "s"} issued
            {link.max_claims != null ? ` of ${link.max_claims}` : ""}. A person who already held a
            certificate for this course keeps their original number, so they appear here without
            using up the limit.
          </p>
        )}

        <DataTable<CertificateLinkClaim>
          columns={columns}
          fetchData={fetchData}
          initialPageSize={20}
          pageSizeOptions={[20, 50, 100]}
          enableSearch
          enablePagination
          searchPlaceholder="Search by name, email or phone…"
          emptyMessage="Nobody has claimed a certificate through this link yet."
        />
      </div>
    </>
  );
}
