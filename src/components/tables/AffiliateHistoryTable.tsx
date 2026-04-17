import { DataTable } from "./data-table";
import { fetchAffiliateHistory, type AffiliateRecord } from "../../api/affiliate";
import type { DataTableFetchParams, DataTableFetchResult } from "./data-table/DataTable.types";

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

async function fetchAffiliateHistoryForTable(
  params: DataTableFetchParams
): Promise<DataTableFetchResult<AffiliateRecord>> {
  const all = await fetchAffiliateHistory();
  const search = (params.search ?? "").trim().toLowerCase();
  
  const filtered = search
    ? all.filter(
        (r) =>
          (r.affiliate_name && r.affiliate_name.toLowerCase().includes(search)) ||
          (r.course_title && r.course_title.toLowerCase().includes(search))
      )
    : all;

  const { page, limit } = params;
  const start = (page - 1) * limit;
  const data = filtered.slice(start, start + limit);
  
  return {
    data,
    meta: toMeta(filtered.length, page, limit),
  };
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
         {Number(row.commission_amount).toFixed(2)}
       </span>
    ),
  },
  {
    key: "created_at",
    header: "Date",
    sortable: false,
    render: (row: AffiliateRecord) => (
      <span className="text-theme-sm text-gray-800 dark:text-white/90">
        {new Date(row.created_at).toLocaleDateString()}
      </span>
    ),
  },
];

export function AffiliateHistoryTable() {
  return (
    <DataTable<AffiliateRecord>
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
