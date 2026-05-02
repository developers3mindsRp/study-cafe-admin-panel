/**
 * Orders table using the reusable DataTable.
 * Server-side search and pagination — no more limit=500 bulk fetch.
 */

import { Link } from "react-router";
import { DataTable } from "./data-table";
import Badge from "../ui/badge/Badge";
import { EyeIcon } from "../../icons";
import { fetchOrders, type OrderRecord } from "../../api/orders";
import type { DataTableFetchParams, DataTableFetchResult } from "./data-table/DataTable.types";

function statusColor(s: string) {
  if (s === "paid") return "success";
  if (s === "pending") return "warning";
  return "error";
}

async function fetchOrdersForTable(
  params: DataTableFetchParams
): Promise<DataTableFetchResult<OrderRecord>> {
  const { page, limit, search, sortBy, sortOrder } = params;
  const offset = (page - 1) * limit;
  const result = await fetchOrders({ limit, offset, search: search ?? "", sortBy, sortOrder });
  const total = result.total ?? result.orders.length;
  const totalPages = Math.max(1, Math.ceil(total / limit));
  return {
    data: result.orders,
    meta: {
      total,
      page,
      limit,
      totalPages,
      hasNextPage: page < totalPages,
      hasPreviousPage: page > 1,
    },
  };
}

const columns = [
  {
    key: "order_id",
    header: "Order ID",
    sortable: false,
    render: (row: OrderRecord) => (
      <span className="font-mono text-theme-sm text-gray-800 dark:text-white/90">{row.order_id}</span>
    ),
  },
  {
    key: "user_id",
    header: "User",
    sortable: false,
    render: (row: OrderRecord) => (
      <div>
        <span className="text-gray-800 dark:text-white/90">{row.buyer_name || row.user_id || "—"}</span>
        {row.buyer_email && (
          <span className="mt-0.5 block text-theme-xs text-gray-500 dark:text-gray-400">
            {row.buyer_email}
          </span>
        )}
      </div>
    ),
  },
  {
    key: "type",
    header: "Type",
    sortable: false,
    render: (row: OrderRecord) => row.type ?? "—",
  },
  {
    key: "amount",
    header: "Amount",
    sortable: false,
    render: (row: OrderRecord) =>
      `${row.currency} ${row.amount != null ? Number(row.amount).toFixed(2) : "—"}`,
  },
  {
    key: "status",
    header: "Status",
    sortable: false,
    render: (row: OrderRecord) => (
      <Badge size="sm" color={statusColor(row.status)}>
        {row.status}
      </Badge>
    ),
  },
  {
    key: "created_at",
    header: "Date",
    sortable: true,
    render: (row: OrderRecord) =>
      row.created_at ? new Date(row.created_at).toLocaleString() : "—",
  },
  {
    key: "actions",
    header: "Actions",
    align: "end" as const,
    sortable: false,
    render: (row: OrderRecord) => (
      <Link
        to={`/orders/${encodeURIComponent(row.order_id)}`}
        className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-2 text-sm text-gray-600 hover:bg-gray-100 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-white"
        title="View"
      >
        <EyeIcon className="size-4 shrink-0 fill-current" />
        View
      </Link>
    ),
  },
];

export function OrdersTable() {
  return (
    <DataTable<OrderRecord>
      columns={columns}
      fetchData={fetchOrdersForTable}
      initialPageSize={20}
      initialSortBy="created_at"
      initialSortOrder="DESC"
      pageSizeOptions={[10, 20, 50, 100]}
      enableSearch
      enableSorting
      enablePagination
      searchPlaceholder="Search by order ID, email, type…"
      emptyMessage="No orders found."
    />
  );
}
