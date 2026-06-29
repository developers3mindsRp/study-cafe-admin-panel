import { useCallback } from "react";
import { DataTable } from "./data-table";
import { fetchAffiliateHistory, type AffiliateRecord } from "../../api/affiliate";
import type { DataTableFetchParams, DataTableFetchResult } from "./data-table/DataTable.types";
import { formatDate } from "../../utils/formatDate";

function toMeta(total: number, page: number, limit: number): DataTableFetchResult<AffiliateRecord>["meta"] {
  const totalPages = Math.max(1, Math.ceil(total / limit));
  return {
    total,
    page,
    limit,
    totalPages,
    hasNextPage: page < totalPages,
    hasPreviousPage: page > 1,
  };
}

export interface AffiliateHistoryTableProps {
  filterDateFrom?: string;
  filterDateTo?: string;
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
    sortable: false,
    render: (row: AffiliateRecord) => (
       <span className="text-theme-sm font-medium text-gray-800 dark:text-white/90">
         ₹{Number(row.commission_amount).toFixed(2)}
       </span>
    ),
  },
  {
    key: "created_at",
    header: "Date",
    sortable: false,
    render: (row: AffiliateRecord) => (
      <span className="text-theme-sm text-gray-800 dark:text-white/90">
        {formatDate(row.created_at)}
      </span>
    ),
  },
];

export function AffiliateHistoryTable({ filterDateFrom = "", filterDateTo = "" }: AffiliateHistoryTableProps) {
  const fetchAffiliateHistoryForTable = useCallback(
    async (params: DataTableFetchParams): Promise<DataTableFetchResult<AffiliateRecord>> => {
      const all = await fetchAffiliateHistory();
      const search = (params.search ?? "").trim().toLowerCase();

      let filtered = search
        ? all.filter(
            (r) =>
              (r.affiliate_name && r.affiliate_name.toLowerCase().includes(search)) ||
              (r.course_title && r.course_title.toLowerCase().includes(search))
          )
        : all;

      if (filterDateFrom) {
        const from = new Date(filterDateFrom).getTime();
        filtered = filtered.filter((r) => !Number.isNaN(from) && new Date(r.created_at).getTime() >= from);
      }

      if (filterDateTo) {
        const to = new Date(filterDateTo);
        to.setHours(23, 59, 59, 999);
        filtered = filtered.filter((r) => new Date(r.created_at).getTime() <= to.getTime());
      }

      const { page, limit } = params;
      const start = (page - 1) * limit;
      const data = filtered.slice(start, start + limit);

      return {
        data,
        meta: toMeta(filtered.length, page, limit),
      };
    },
    [filterDateFrom, filterDateTo]
  );

  return (
    <DataTable<AffiliateRecord>
      key={`${filterDateFrom}|${filterDateTo}`}
      columns={columns}
      fetchData={fetchAffiliateHistoryForTable}
      initialPageSize={10}
      pageSizeOptions={[10, 20, 50]}
      enableSearch
      enableSorting={false}
      enablePagination
      searchPlaceholder="Search by user or course..."
      emptyMessage="No affiliate history found."
    />
  );
}
