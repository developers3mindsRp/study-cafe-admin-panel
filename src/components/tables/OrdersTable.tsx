/**
 * Orders table using the reusable DataTable.
 * Server-side search and pagination — no more limit=500 bulk fetch.
 */

import React, { useState, useCallback, useEffect, useRef } from "react";
import { Link } from "react-router";
import { DataTable, type DataTableRef } from "./data-table/DataTable";
import Badge from "../ui/badge/Badge";
import { EyeIcon, PencilIcon, DollarLineIcon } from "../../icons";
import { fetchOrders, orderStatusAllowsRefund, type OrderRecord } from "../../api/orders";
import type { DataTableFetchParams, DataTableFetchResult } from "./data-table/DataTable.types";
import RefundModal from "../../pages/orders/RefundModal";
import Select from "../form/Select";
import { fetchCourses, type Course } from "../../api/courses";
import DatePicker from "../form/date-picker";
import { deleteOrder } from "../../api/orders";
import { TrashBinIcon } from "../../icons";

function statusColor(s: string) {
  if (s === "paid" || s === "completed") return "success";
  if (s === "pending") return "warning";
  if (s === "refunded") return "info";
  return "error";
}

export function OrdersTable() {
  const tableRef = useRef<DataTableRef>(null);
  const [selectedOrder, setSelectedOrder] = useState<OrderRecord | null>(null);
  const [isRefundOpen, setIsRefundOpen] = useState(false);
  
  // Filters
  const [courses, setCourses] = useState<Course[]>([]);
  const [filters, setFilters] = useState({
    dateFrom: "",
    dateTo: "",
    courseId: "",
    type: "",
  });

  useEffect(() => {
    fetchCourses().then(setCourses).catch(console.error);
  }, []);

  const fetchOrdersForTable = useCallback(async (
    params: DataTableFetchParams
  ): Promise<DataTableFetchResult<OrderRecord>> => {
    const { page, limit, search, sortBy, sortOrder } = params;
    const offset = (page - 1) * limit;
    
    const result = await fetchOrders({ 
      limit, 
      offset, 
      search: search ?? "", 
      sortBy, 
      sortOrder,
      ...filters 
    });
    
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
  }, [filters]);

  const handleRefundClick = (order: OrderRecord) => {
    setSelectedOrder(order);
    setIsRefundOpen(true);
  };

  const handleDeleteClick = async (order: OrderRecord) => {
    if (window.confirm(`Are you sure you want to delete order ${order.order_id}?`)) {
      try {
        await deleteOrder(order.id);
        tableRef.current?.refetch();
      } catch (err: any) {
        alert(err.response?.data?.message || "Failed to delete order");
      }
    }
  };

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
        <div className="max-w-[200px]">
          <div className="font-medium text-gray-800 dark:text-white/90 truncate" title={row.buyer_name || ""}>
            {row.buyer_name || "—"}
          </div>
          <div className="text-theme-xs text-gray-500 dark:text-gray-400 truncate" title={row.buyer_email || ""}>
            {row.buyer_email || "—"}
          </div>
          <div className="text-theme-xs text-gray-500 dark:text-gray-400">
            {row.buyer_mobile || "—"}
          </div>
        </div>
      ),
    },
    {
      key: "payment_id",
      header: "Payment ID",
      sortable: false,
      render: (row: OrderRecord) => (
        <span className="text-theme-xs font-mono text-gray-500 dark:text-gray-400">
          {row.payment_id || "—"}
        </span>
      ),
    },
    {
      key: "entity_name",
      header: "Item",
      sortable: false,
      render: (row: OrderRecord) => (
        <div className="max-w-[150px]">
          <div className="text-theme-sm font-medium text-gray-800 dark:text-white/90 truncate" title={row.entity_name || ""}>
            {row.entity_name || "—"}
          </div>
          <div className="text-theme-xs text-gray-500 capitalize">{row.type}</div>
        </div>
      ),
    },
    {
      key: "utm",
      header: "UTM",
      sortable: false,
      render: (row: OrderRecord) => {
        const u = row.utm;
        if (!u || (!u.source && !u.medium && !u.campaign)) return "—";
        return (
          <div className="text-theme-xs space-y-0.5">
            {u.source && <div className="text-gray-500"><span className="font-medium">Src:</span> {u.source}</div>}
            {u.medium && <div className="text-gray-500"><span className="font-medium">Med:</span> {u.medium}</div>}
            {u.campaign && <div className="text-gray-500"><span className="font-medium">Cam:</span> {u.campaign}</div>}
          </div>
        );
      },
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
        <div className="flex items-center justify-end gap-1">
          <Link
            to={`/orders/${encodeURIComponent(row.order_id)}`}
            className="inline-flex items-center justify-center rounded-lg p-2 text-gray-500 hover:bg-gray-100 hover:text-gray-700 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-white"
            title="View"
          >
            <EyeIcon className="size-5" />
          </Link>
          <Link
            to={`/orders/${encodeURIComponent(row.order_id)}/edit`}
            className="inline-flex items-center justify-center rounded-lg p-2 text-gray-500 hover:bg-gray-100 hover:text-gray-700 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-white"
            title="Edit"
          >
            <PencilIcon className="size-5" />
          </Link>
          {orderStatusAllowsRefund(row.status) && (
            <button
              onClick={() => handleRefundClick(row)}
              className="inline-flex items-center justify-center rounded-lg p-2 text-error-500 hover:bg-error-50 hover:text-error-600 dark:text-error-400 dark:hover:bg-error-900/20"
              title="Refund"
            >
              <DollarLineIcon className="size-5" />
            </button>
          )}
          <button
            onClick={() => handleDeleteClick(row)}
            className="inline-flex items-center justify-center rounded-lg p-2 text-gray-500 hover:bg-gray-100 hover:text-error-600 dark:text-gray-400 dark:hover:bg-gray-800"
            title="Delete"
          >
            <TrashBinIcon className="size-5" />
          </button>
        </div>
      ),
    },
  ];

  const courseOptions = [
    { value: "", label: "All Courses" },
    ...courses.map(c => ({ value: String(c.id), label: c.title }))
  ];

  const typeOptions = [
    { value: "", label: "All Types" },
    { value: "course", label: "Course" },
    { value: "membership", label: "Membership" },
    { value: "payment_link", label: "Payment Link" },
  ];

  return (
    <div className="space-y-6">
      <div className="grid gap-4 rounded-2xl border border-gray-200 bg-white p-5 shadow-theme-xs dark:border-gray-800 dark:bg-white/[0.03] sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <label className="mb-1.5 block text-xs font-medium text-gray-700 dark:text-gray-400">Course</label>
          <Select
            options={courseOptions}
            defaultValue={filters.courseId}
            onChange={(val) => setFilters(f => ({ ...f, courseId: val }))}
            placeholder="Filter by Course"
          />
        </div>
        <div>
          <label className="mb-1.5 block text-xs font-medium text-gray-700 dark:text-gray-400">Type</label>
          <Select
            options={typeOptions}
            defaultValue={filters.type}
            onChange={(val) => setFilters(f => ({ ...f, type: val }))}
            placeholder="Filter by Type"
          />
        </div>
        <div className="lg:col-span-2">
          <DatePicker
            id="dateRange"
            label="Date Range"
            mode="range"
            placeholder="Select Date Range"
            onChange={(dates) => {
              if (dates.length === 2) {
                const [start, end] = dates;
                setFilters(f => ({ 
                  ...f, 
                  dateFrom: start ? start.toISOString().split('T')[0] : "", 
                  dateTo: end ? end.toISOString().split('T')[0] : "" 
                }));
              } else if (dates.length === 0) {
                setFilters(f => ({ ...f, dateFrom: "", dateTo: "" }));
              }
            }}
          />
        </div>
      </div>

      <DataTable<OrderRecord>
        ref={tableRef}
        columns={columns}
        fetchData={fetchOrdersForTable}
        initialPageSize={20}
        initialSortBy="created_at"
        initialSortOrder="DESC"
        pageSizeOptions={[10, 20, 50, 100]}
        enableSearch
        enableSorting
        enablePagination
        searchPlaceholder="Search by order ID, email…"
        emptyMessage="No orders found."
      />

      <RefundModal
        order={selectedOrder}
        isOpen={isRefundOpen}
        onClose={() => setIsRefundOpen(false)}
        onSuccess={() => tableRef.current?.refetch()}
      />
    </div>
  );
}
