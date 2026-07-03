import { forwardRef, useCallback } from "react";
import { DataTable, type DataTableRef } from "./data-table";
import {
  fetchAffiliateHistoryPaginated,
  type AffiliateHistoryFilters,
  type AffiliateRecord,
} from "../../api/affiliate";
import type { DataTableFetchParams, DataTableFetchResult } from "./data-table/DataTable.types";
import { formatDate } from "../../utils/formatDate";

export interface AffiliateHistoryTableProps {
  filters: AffiliateHistoryFilters;
  refreshKey?: number;
}

const columns = [
  {
    key: "user",
    header: "Affiliate User",
    sortable: false,
    render: (row: AffiliateRecord) => (
      <div>
        <span className="block font-medium text-gray-800 dark:text-white/90">
          {row.affiliate_name}
        </span>
        {row.affiliate_email ? (
          <span className="text-theme-xs text-gray-500 dark:text-gray-400">{row.affiliate_email}</span>
        ) : null}
      </div>
    ),
  },
  {
    key: "course_title",
    header: "Course",
    sortable: false,
    render: (row: AffiliateRecord) => (
      <span className="text-theme-sm text-gray-800 dark:text-white/90">
        {row.course_title}
      </span>
    ),
  },
  {
    key: "commission_amount",
    header: "Earning",
    sortable: true,
    render: (row: AffiliateRecord) => (
      <span className="text-theme-sm font-medium text-gray-800 dark:text-white/90">
        ₹{Number(row.commission_amount).toFixed(2)}
      </span>
    ),
  },
  {
    key: "created_at",
    header: "Date",
    sortable: true,
    render: (row: AffiliateRecord) => (
      <span className="text-theme-sm text-gray-800 dark:text-white/90">
        {formatDate(row.created_at)}
      </span>
    ),
  },
];

export const AffiliateHistoryTable = forwardRef<DataTableRef, AffiliateHistoryTableProps>(
  function AffiliateHistoryTable({ filters, refreshKey = 0 }, ref) {
  const fetchAffiliateHistoryForTable = useCallback(
    async (params: DataTableFetchParams): Promise<DataTableFetchResult<AffiliateRecord>> => {
      return fetchAffiliateHistoryPaginated({ ...params, filters });
    },
    [filters],
  );

  const filterKey = [
    filters.date_from,
    filters.date_to,
    filters.affiliate_id,
    filters.course_id,
    filters.commission_min,
    filters.commission_max,
    refreshKey,
  ].join("|");

  return (
    <DataTable<AffiliateRecord>
      ref={ref}
      key={filterKey}
      columns={columns}
      fetchData={fetchAffiliateHistoryForTable}
      initialPageSize={10}
      pageSizeOptions={[10, 20, 50]}
      enableSearch
      enableSorting
      initialSortBy="created_at"
      initialSortOrder="DESC"
      enablePagination
      searchPlaceholder="Search by affiliate or course..."
      emptyMessage="No affiliate history found."
    />
  );
},
);
