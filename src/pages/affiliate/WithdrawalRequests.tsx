import { useCallback, useMemo, useRef, useState } from "react";
import PageMeta from "../../components/common/PageMeta";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import { WithdrawalRequestsTable } from "../../components/tables/WithdrawalRequestsTable";
import { CreateWithdrawalModal } from "../../components/affiliate/CreateWithdrawalModal";
import { UpdateWithdrawalModal } from "../../components/affiliate/UpdateWithdrawalModal";
import { WithdrawalAccountDetailsModal } from "../../components/affiliate/WithdrawalAccountDetailsModal";
import { DownloadIcon, PlusIcon } from "../../icons";
import Button from "../../components/ui/button/Button";
import type { WithdrawalRequest } from "../../api/affiliate";
import { FilterBar, useFilterState } from "../../components/filters";
import type { FilterFieldDef } from "../../components/filters";
import {
  downloadWithdrawalExportCsv,
  resolveAffiliateUserFilterOption,
  searchAffiliateUserFilterOptions,
  withdrawalListFiltersAreActive,
  withdrawalListFiltersFromValues,
} from "../../api/affiliate";
import type { DataTableRef } from "../../components/tables/data-table";
import { isExportAuthError } from "../../lib/exportAuth";

const withdrawalFilterFields: FilterFieldDef[] = [
  {
    type: "date-range",
    id: "date",
    label: "Date",
    fromId: "date_from",
    toId: "date_to",
    className: "min-w-0 w-full",
  },
  {
    type: "searchable-async-select",
    id: "affiliate_id",
    label: "Affiliate user",
    loader: searchAffiliateUserFilterOptions,
    resolveOption: resolveAffiliateUserFilterOption,
    placeholder: "All users",
    searchPlaceholder: "Search by name or email…",
    minSearchLength: 2,
    className: "min-w-0 w-full",
  },
  {
    type: "select",
    id: "status",
    label: "Status",
    placeholder: "All statuses",
    options: [
      { value: "pending", label: "Pending" },
      { value: "approved", label: "Approved" },
      { value: "rejected", label: "Rejected" },
    ],
  },
  {
    type: "amount-range",
    id: "amount",
    label: "Amount (₹)",
    minId: "amount_min",
    maxId: "amount_max",
    step: 1,
    snapOnBlur: false,
    showSlider: false,
    className: "min-w-0 w-full",
  },
];

export default function WithdrawalRequests() {
  const tableRef = useRef<DataTableRef>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isUpdateModalOpen, setIsUpdateModalOpen] = useState(false);
  const [isAccountDetailsOpen, setIsAccountDetailsOpen] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<WithdrawalRequest | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [filterResetKey, setFilterResetKey] = useState(0);
  const [exporting, setExporting] = useState(false);
  const { values, set, setMany, reset, hasActive } = useFilterState();

  const listFilters = useMemo(() => withdrawalListFiltersFromValues(values), [values]);
  const filtersActive = useMemo(
    () => withdrawalListFiltersAreActive(listFilters),
    [listFilters],
  );

  const handleFilterReset = useCallback(() => {
    reset();
    setFilterResetKey((k) => k + 1);
  }, [reset]);

  const handleUpdateClick = (request: WithdrawalRequest) => {
    setSelectedRequest(request);
    setIsUpdateModalOpen(true);
  };

  const handleAccountDetailsClick = (request: WithdrawalRequest) => {
    setSelectedRequest(request);
    setIsAccountDetailsOpen(true);
  };

  const handleRefresh = () => {
    setRefreshKey((prev) => prev + 1);
  };

  const handleExportCsv = useCallback(async () => {
    const q = tableRef.current?.getQueryState();
    if (!q) return;
    setExporting(true);
    try {
      const datePart = new Date().toISOString().slice(0, 10);
      const filteredPart = filtersActive || q.search.trim() ? "-filtered" : "";
      await downloadWithdrawalExportCsv(
        {
          filters: listFilters,
          search: q.search,
          sortBy: q.sortBy,
          sortOrder: q.sortOrder,
        },
        `affiliate-withdrawals-export-${datePart}${filteredPart}.csv`,
      );
    } catch (err: unknown) {
      if (isExportAuthError(err)) return;
      const msg =
        err && typeof err === "object" && "response" in err
          ? (err as { response?: { data?: { message?: string } } }).response?.data?.message
          : err instanceof Error
            ? err.message
            : "Export failed";
      alert(msg || "Export failed");
    } finally {
      setExporting(false);
    }
  }, [listFilters, filtersActive]);

  return (
    <>
      <PageMeta
        title="Withdrawal Requests | StudyCafe Admin"
        description="Manage affiliate payout requests"
      />
      <PageBreadcrumb
        pageTitle="Withdrawal Requests"
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={handleExportCsv}
              disabled={exporting}
              className="inline-flex items-center justify-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-3 text-sm font-medium text-gray-700 transition hover:bg-gray-50 disabled:opacity-60 dark:border-gray-600 dark:bg-gray-900 dark:text-gray-200 dark:hover:bg-gray-800"
            >
              <DownloadIcon className="size-4 shrink-0 fill-current" />
              {exporting ? "Exporting…" : "Export CSV"}
            </button>
            <Button
              onClick={() => setIsCreateModalOpen(true)}
              className="flex items-center gap-2"
              size="sm"
            >
              <PlusIcon className="size-4" />
              Create Request
            </Button>
          </div>
        }
      />

      <div className="space-y-6">
        <FilterBar
          fields={withdrawalFilterFields}
          values={values}
          onChange={set}
          onChangeMany={setMany}
          onReset={handleFilterReset}
          hasActive={hasActive}
          layout="full"
          resetKey={filterResetKey}
        />
        <WithdrawalRequestsTable
          ref={tableRef}
          filters={listFilters}
          refreshKey={refreshKey}
          onUpdateStatus={handleUpdateClick}
          onViewAccountDetails={handleAccountDetailsClick}
        />
      </div>

      <CreateWithdrawalModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSuccess={handleRefresh}
      />

      <UpdateWithdrawalModal
        request={selectedRequest}
        isOpen={isUpdateModalOpen}
        onClose={() => {
          setIsUpdateModalOpen(false);
          setSelectedRequest(null);
        }}
        onSuccess={handleRefresh}
      />

      <WithdrawalAccountDetailsModal
        request={selectedRequest}
        isOpen={isAccountDetailsOpen}
        onClose={() => {
          setIsAccountDetailsOpen(false);
          setSelectedRequest(null);
        }}
      />
    </>
  );
}
