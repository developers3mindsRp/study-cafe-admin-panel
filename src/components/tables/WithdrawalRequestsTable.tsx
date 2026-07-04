import { forwardRef, useCallback } from "react";
import { DataTable, type DataTableRef } from "./data-table";
import {
  fetchWithdrawalRequestsPaginated,
  type WithdrawalListFilters,
  type WithdrawalRequest,
} from "../../api/affiliate";
import type { DataTableFetchParams, DataTableFetchResult } from "./data-table/DataTable.types";
import Badge from "../ui/badge/Badge";
import { PencilIcon } from "../../icons";
import { formatDate } from "../../utils/formatDate";

function statusColor(s: string) {
  if (s === "approved") return "success";
  if (s === "pending") return "warning";
  if (s === "rejected") return "error";
  return "light";
}

export interface WithdrawalRequestsTableProps {
  filters: WithdrawalListFilters;
  refreshKey?: number;
  onUpdateStatus: (request: WithdrawalRequest) => void;
}

export const WithdrawalRequestsTable = forwardRef<DataTableRef, WithdrawalRequestsTableProps>(
  function WithdrawalRequestsTable({ filters, refreshKey = 0, onUpdateStatus }, ref) {
    const fetchWithdrawalRequestsForTable = useCallback(
      async (params: DataTableFetchParams): Promise<DataTableFetchResult<WithdrawalRequest>> => {
        return fetchWithdrawalRequestsPaginated({ ...params, filters });
      },
      [filters],
    );

    const filterKey = [
      filters.date_from,
      filters.date_to,
      filters.affiliate_id,
      filters.status,
      filters.amount_min,
      filters.amount_max,
      refreshKey,
    ].join("|");

    const columns = [
      {
        key: "user",
        header: "User",
        sortable: false,
        render: (row: WithdrawalRequest) => (
          <div>
            <span className="block font-medium text-gray-800 dark:text-white/90">
              {row.affiliate_name}
            </span>
            <span className="text-theme-xs text-gray-500 dark:text-gray-400">
              {row.affiliate_email}
            </span>
          </div>
        ),
      },
      {
        key: "amount",
        header: "Amount Requested",
        sortable: true,
        render: (row: WithdrawalRequest) => (
          <span className="text-theme-sm font-medium text-gray-800 dark:text-white/90">
            ₹{Number(row.amount).toFixed(2)}
          </span>
        ),
      },
      {
        key: "status",
        header: "Status",
        sortable: true,
        render: (row: WithdrawalRequest) => (
          <Badge size="sm" color={statusColor(row.status)}>
            {row.status.charAt(0).toUpperCase() + row.status.slice(1)}
          </Badge>
        ),
      },
      {
        key: "created_at",
        header: "Requested On",
        sortable: true,
        render: (row: WithdrawalRequest) => (
          <span className="text-theme-sm text-gray-800 dark:text-white/90">
            {formatDate(row.created_at)}
          </span>
        ),
      },
      {
        key: "actions",
        header: "Actions",
        align: "end" as const,
        sortable: false,
        render: (row: WithdrawalRequest) => (
          <button
            onClick={() => onUpdateStatus(row)}
            className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-2 text-sm text-gray-600 hover:bg-gray-100 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-white"
            title="Update Status"
          >
            <PencilIcon className="size-4 shrink-0 fill-current" />
            Update
          </button>
        ),
      },
    ];

    return (
      <DataTable<WithdrawalRequest>
        ref={ref}
        key={filterKey}
        columns={columns}
        fetchData={fetchWithdrawalRequestsForTable}
        initialPageSize={10}
        pageSizeOptions={[10, 20, 50]}
        enableSearch
        enableSorting
        initialSortBy="created_at"
        initialSortOrder="DESC"
        enablePagination
        searchPlaceholder="Search by user or email..."
        emptyMessage="No withdrawal requests found."
      />
    );
  },
);
