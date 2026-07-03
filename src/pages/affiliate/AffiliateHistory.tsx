import { useCallback, useMemo, useRef, useState } from "react";
import PageMeta from "../../components/common/PageMeta";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import { AffiliateHistoryTable } from "../../components/tables/AffiliateHistoryTable";
import { FilterBar, useFilterState } from "../../components/filters";
import type { FilterFieldDef } from "../../components/filters";
import {
  affiliateHistoryFiltersAreActive,
  affiliateHistoryFiltersFromValues,
  downloadAffiliateHistoryExportCsv,
  resolveAffiliateCourseFilterOption,
  resolveAffiliateUserFilterOption,
  searchAffiliateCourseFilterOptions,
  searchAffiliateUserFilterOptions,
} from "../../api/affiliate";
import type { DataTableRef } from "../../components/tables/data-table";
import { DownloadIcon } from "../../icons";
import { isExportAuthError } from "../../lib/exportAuth";

const affiliateHistoryFilterFields: FilterFieldDef[] = [
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
    type: "searchable-async-select",
    id: "course_id",
    label: "Course",
    loader: searchAffiliateCourseFilterOptions,
    resolveOption: resolveAffiliateCourseFilterOption,
    placeholder: "All courses",
    searchPlaceholder: "Search courses…",
    minSearchLength: 0,
    defaultOptions: true,
    className: "min-w-0 w-full",
  },
  {
    type: "amount-range",
    id: "commission",
    label: "Earning amount (₹)",
    minId: "commission_min",
    maxId: "commission_max",
    step: 1,
    snapOnBlur: false,
    showSlider: false,
    className: "min-w-0 w-full",
  },
];

export default function AffiliateHistory() {
  const tableRef = useRef<DataTableRef>(null);
  const { values, set, setMany, reset, hasActive } = useFilterState();
  const [filterResetKey, setFilterResetKey] = useState(0);
  const [exporting, setExporting] = useState(false);

  const listFilters = useMemo(() => affiliateHistoryFiltersFromValues(values), [values]);
  const filtersActive = useMemo(
    () => affiliateHistoryFiltersAreActive(listFilters),
    [listFilters],
  );

  const handleFilterReset = useCallback(() => {
    reset();
    setFilterResetKey((k) => k + 1);
  }, [reset]);

  const handleExportCsv = useCallback(async () => {
    const q = tableRef.current?.getQueryState();
    if (!q) return;
    setExporting(true);
    try {
      const datePart = new Date().toISOString().slice(0, 10);
      const filteredPart = filtersActive || q.search.trim() ? "-filtered" : "";
      await downloadAffiliateHistoryExportCsv(
        {
          filters: listFilters,
          search: q.search,
          sortBy: q.sortBy,
          sortOrder: q.sortOrder,
        },
        `affiliate-history-export-${datePart}${filteredPart}.csv`,
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
        title="Affiliate History | StudyCafe Admin"
        description="Track affiliate earnings and referrals"
      />
      <PageBreadcrumb
        pageTitle="Affiliate History"
        actions={
          <button
            type="button"
            onClick={handleExportCsv}
            disabled={exporting}
            className="inline-flex items-center justify-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-3 text-sm font-medium text-gray-700 transition hover:bg-gray-50 disabled:opacity-60 dark:border-gray-600 dark:bg-gray-900 dark:text-gray-200 dark:hover:bg-gray-800"
          >
            <DownloadIcon className="size-4 shrink-0 fill-current" />
            {exporting ? "Exporting…" : "Export CSV"}
          </button>
        }
      />
      <div className="space-y-6">
        <FilterBar
          fields={affiliateHistoryFilterFields}
          values={values}
          onChange={set}
          onChangeMany={setMany}
          onReset={handleFilterReset}
          hasActive={hasActive}
          layout="full"
          resetKey={filterResetKey}
        />
        <AffiliateHistoryTable
          ref={tableRef}
          filters={listFilters}
          refreshKey={filterResetKey}
        />
      </div>
    </>
  );
}
