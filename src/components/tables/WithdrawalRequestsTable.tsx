import { useCallback } from "react";
import { DataTable } from "./data-table";
import { fetchWithdrawalRequests, type WithdrawalRequest } from "../../api/affiliate";
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

function toMeta(total: number, page: number, limit: number): DataTableFetchResult<WithdrawalRequest>["meta"] {
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

interface WithdrawalRequestsTableProps {
  onUpdateStatus: (request: WithdrawalRequest) => void;
  filterStatus?: string;
}

export function WithdrawalRequestsTable({ onUpdateStatus, filterStatus = "" }: WithdrawalRequestsTableProps) {
  const fetchWithdrawalRequestsForTable = useCallback(
    async (params: DataTableFetchParams): Promise<DataTableFetchResult<WithdrawalRequest>> => {
      const all = await fetchWithdrawalRequests();
      const search = (params.search ?? "").trim().toLowerCase();

      let filtered = filterStatus
        ? all.filter((r) => r.status === filterStatus)
        : all;

      if (search) {
        filtered = filtered.filter(
          (r) =>
            (r.affiliate_name && r.affiliate_name.toLowerCase().includes(search)) ||
            (r.affiliate_email && r.affiliate_email.toLowerCase().includes(search)) ||
            (r.status && r.status.toLowerCase().includes(search))
        );
      }

      const { page, limit } = params;
      const start = (page - 1) * limit;
      const data = filtered.slice(start, start + limit);

      return {
        data,
        meta: toMeta(filtered.length, page, limit),
      };
    },
    [filterStatus]
  );
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
      sortable: false,
      render: (row: WithdrawalRequest) => (
        <span className="text-theme-sm font-medium text-gray-800 dark:text-white/90">
          ₹ {Number(row.amount).toFixed(2)}
        </span>
      ),
    },
    {
      key: "status",
      header: "Status",
      sortable: false,
      render: (row: WithdrawalRequest) => (
        <Badge size="sm" color={statusColor(row.status)}>
          {row.status.charAt(0).toUpperCase() + row.status.slice(1)}
        </Badge>
      ),
    },
    {
      key: "created_at",
      header: "Requested On",
      sortable: false,
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
      key={filterStatus}
      columns={columns}
      fetchData={fetchWithdrawalRequestsForTable}
      initialPageSize={10}
      pageSizeOptions={[10, 20, 50]}
      enableSearch
      enableSorting={false}
      enablePagination
      searchPlaceholder="Search by user or email..."
      emptyMessage="No withdrawal requests found."
    />
  );
}
