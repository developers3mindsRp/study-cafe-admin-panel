/**
 * Orders table using the reusable DataTable.
 * Server-side search and pagination — no more limit=500 bulk fetch.
 */

import { useState, useCallback, useEffect, useRef, useMemo } from "react";
import { Link } from "react-router";
import { DataTable, type DataTableRef } from "./data-table/DataTable";
import Badge from "../ui/badge/Badge";
import { DownloadIcon, EyeIcon, PencilIcon, DollarLineIcon, TrashBinIcon } from "../../icons";
import {
  buildOrdersListParams,
  deleteOrder,
  deleteOrderPermanently,
  fetchAllOrdersForExport,
  fetchOrders,
  orderStatusAllowsRefund,
  ordersListFiltersAreActive,
  restoreOrder,
  type OrderRecord,
  type OrdersListFilters,
} from "../../api/orders";
import { TrashScopeTabs, type TrashScope } from "../trash/TrashScopeTabs";
import { CourseAccessTabs, type CourseAccessFilter, courseAccessFilterToApiParam } from "../orders/CourseAccessTabs";
import { exportRowsToExcel } from "../../utils/exportToExcel";
import { ExportProgressBar } from "../export/ExportProgressBar";
import {
  formatExportProgressLabel,
  formatExportProgressTitle,
  type ExportProgress,
} from "../../utils/exportProgress";
import { ORDER_EXPORT_COLUMNS } from "../../utils/orderExportColumns";
import type { DataTableFetchParams, DataTableFetchResult } from "./data-table/DataTable.types";
import RefundModal from "../../pages/orders/RefundModal";
import { ConfirmDeleteModal } from "../ui/modal/ConfirmDeleteModal";
import Select from "../form/Select";
import { fetchCourses, type Course } from "../../api/courses";
import DatePicker from "../form/date-picker";
import AmountRangeDropdown from "../form/AmountRangeDropdown";
import Button from "../ui/button/Button";
import { localDateString } from "../../utils/localDateString";
import { isExportAuthError } from "../../lib/exportAuth";
import { formatDateTime } from "../../utils/formatDate";

const ORDERS_FILTER_INITIAL: OrdersListFilters = {
  dateFrom: "",
  dateTo: "",
  courseId: "",
  type: "",
  amountMin: "",
  amountMax: "",
  status: "",
};

const statusFilterOptions = [
  { value: "", label: "All statuses" },
  { value: "pending", label: "Pending" },
  { value: "failed", label: "Payment failed" },
  { value: "completed", label: "Completed" },
];

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
  const [deleteTarget, setDeleteTarget] = useState<OrderRecord | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [restoreTarget, setRestoreTarget] = useState<OrderRecord | null>(null);
  const [isRestoreModalOpen, setIsRestoreModalOpen] = useState(false);
  const [restoreLoading, setRestoreLoading] = useState(false);
  const [permanentDeleteTarget, setPermanentDeleteTarget] = useState<OrderRecord | null>(null);
  const [isPermanentDeleteModalOpen, setIsPermanentDeleteModalOpen] = useState(false);
  const [permanentDeleteLoading, setPermanentDeleteLoading] = useState(false);

  // Filters
  const [courses, setCourses] = useState<Course[]>([]);
  const [filters, setFilters] = useState({ ...ORDERS_FILTER_INITIAL });
  const [filterBarKey, setFilterBarKey] = useState(0);
  const [searchInput, setSearchInput] = useState("");
  const searchDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [exportProgress, setExportProgress] = useState<ExportProgress | null>(null);
  const exporting = exportProgress !== null;
  const [trashScope, setTrashScope] = useState<TrashScope>("active");
  const [courseAccessScope, setCourseAccessScope] = useState<CourseAccessFilter>("all");
  const courseAccessApi = courseAccessFilterToApiParam(courseAccessScope);
  const isTrash = trashScope === "trash";

  const hasActiveFilters = useMemo(
    () => ordersListFiltersAreActive(filters) || searchInput.trim() !== "",
    [filters, searchInput],
  );

  const handleSearchChange = useCallback((value: string) => {
    setSearchInput(value);
    if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current);
    searchDebounceRef.current = setTimeout(() => {
      searchDebounceRef.current = null;
      tableRef.current?.setSearch(value);
    }, 350);
  }, []);

  const clearAllFilters = useCallback(() => {
    setFilters({ ...ORDERS_FILTER_INITIAL });
    setFilterBarKey((k) => k + 1);
    setSearchInput("");
    if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current);
    tableRef.current?.setSearch("");
  }, []);

  const handleExportExcel = useCallback(async () => {
    const q = tableRef.current?.getQueryState();
    if (!q) return;
    setExportProgress({ loaded: 0, total: null, phase: "fetching" });
    try {
      const rows = await fetchAllOrdersForExport({
        filters,
        search: q.search,
        sortBy: q.sortBy,
        sortOrder: q.sortOrder,
        courseAccessScope: isTrash ? undefined : courseAccessScope,
        onProgress: setExportProgress,
      });
      setExportProgress({ loaded: rows.length, total: rows.length, phase: "writing" });
      const datePart = new Date().toISOString().slice(0, 10);
      const filteredPart = hasActiveFilters || q.search.trim() ? "-filtered" : "";
      exportRowsToExcel({
        filename: `orders-export-${datePart}${filteredPart}`,
        sheetName: "Orders",
        columns: ORDER_EXPORT_COLUMNS,
        rows,
      });
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
      setExportProgress(null);
    }
  }, [filters, hasActiveFilters, courseAccessScope, isTrash]);

  useEffect(() => {
    fetchCourses().then(setCourses).catch(console.error);
  }, []);

  const filtersMountedRef = useRef(false);
  useEffect(() => {
    if (!filtersMountedRef.current) {
      filtersMountedRef.current = true;
      return;
    }
    tableRef.current?.refetch();
  }, [filters]);

  const fetchOrdersForTable = useCallback(async (
    params: DataTableFetchParams
  ): Promise<DataTableFetchResult<OrderRecord>> => {
    const { page, limit, search, sortBy, sortOrder } = params;
    const offset = (page - 1) * limit;
    
    const result = await fetchOrders(
      buildOrdersListParams({
        filters,
        search: search ?? "",
        sortBy,
        sortOrder,
        limit,
        offset,
        trashScope,
        courseAccessScope: isTrash ? undefined : courseAccessScope,
      }),
    );

    const orders = Array.isArray(result.orders) ? result.orders : [];
    const total = result.total ?? orders.length;
    const totalPages = Math.max(1, Math.ceil(total / limit));
    
    return {
      data: orders,
      meta: {
        total,
        page,
        limit,
        totalPages,
        hasNextPage: page < totalPages,
        hasPreviousPage: page > 1,
      },
    };
  }, [filters, trashScope, courseAccessScope, isTrash]);

  const handleRestoreClick = (order: OrderRecord) => {
    setRestoreTarget(order);
    setIsRestoreModalOpen(true);
  };

  const handleRestoreConfirm = async () => {
    if (!restoreTarget) return;
    setRestoreLoading(true);
    try {
      await restoreOrder(restoreTarget.id);
      setRestoreTarget(null);
      setIsRestoreModalOpen(false);
      tableRef.current?.refetch();
    } catch (err: unknown) {
      const msg =
        err && typeof err === "object" && "response" in err
          ? (err as { response?: { data?: { message?: string } } }).response?.data?.message
          : undefined;
      alert(msg || "Failed to restore order");
    } finally {
      setRestoreLoading(false);
    }
  };

  const handleRefundClick = (order: OrderRecord) => {
    setSelectedOrder(order);
    setIsRefundOpen(true);
  };

  const handleDeleteClick = (order: OrderRecord) => {
    setDeleteTarget(order);
    setIsDeleteModalOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    setDeleteLoading(true);
    try {
      await deleteOrder(deleteTarget.id);
      setDeleteTarget(null);
      setIsDeleteModalOpen(false);
      tableRef.current?.refetch();
    } catch (err: unknown) {
      const msg =
        err && typeof err === "object" && "response" in err
          ? (err as { response?: { data?: { message?: string } } }).response?.data?.message
          : undefined;
      alert(msg || "Failed to delete order");
    } finally {
      setDeleteLoading(false);
    }
  };

  const handlePermanentDeleteClick = (order: OrderRecord) => {
    setPermanentDeleteTarget(order);
    setIsPermanentDeleteModalOpen(true);
  };

  const handlePermanentDeleteConfirm = async () => {
    if (!permanentDeleteTarget) return;
    setPermanentDeleteLoading(true);
    try {
      await deleteOrderPermanently(permanentDeleteTarget.id);
      setPermanentDeleteTarget(null);
      setIsPermanentDeleteModalOpen(false);
      tableRef.current?.refetch();
    } catch (err: unknown) {
      const msg =
        err && typeof err === "object" && "response" in err
          ? (err as { response?: { data?: { message?: string } } }).response?.data?.message
          : undefined;
      alert(msg || "Failed to permanently delete order");
    } finally {
      setPermanentDeleteLoading(false);
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
      key: "course_access",
      header: "Access",
      sortable: false,
      render: (row: OrderRecord) => {
        if (row.type !== "course" || !row.course_access) {
          return <span className="text-theme-xs text-gray-400">—</span>;
        }
        const label =
          row.course_access === "lifetime"
            ? "Lifetime"
            : row.course_access === "expired"
              ? "Expired"
              : "Active";
        const color =
          row.course_access === "lifetime"
            ? "primary"
            : row.course_access === "expired"
              ? "error"
              : "success";
        return (
          <Badge size="sm" color={color}>
            {label}
          </Badge>
        );
      },
    },
    {
      key: "created_at",
      header: "Date",
      sortable: true,
      render: (row: OrderRecord) =>
        formatDateTime(row.created_at),
    },
    {
      key: "actions",
      header: "Actions",
      align: "end" as const,
      sortable: false,
      className:
        "whitespace-nowrap sticky right-0 z-20 bg-white dark:bg-gray-900 shadow-[-8px_0_8px_-6px_rgba(0,0,0,0.08)]",
      render: (row: OrderRecord) => (
        <div className="flex items-center justify-end gap-0.5">
          {!isTrash ? (
            <>
              <Link
                to={`/orders/${encodeURIComponent(row.order_id)}`}
                className="inline-flex items-center justify-center rounded-lg p-1.5 text-gray-500 hover:bg-gray-100 hover:text-gray-700 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-white"
                title="View"
              >
                <EyeIcon className="size-5" />
              </Link>
              <Link
                to={`/orders/${encodeURIComponent(row.order_id)}/edit`}
                className="inline-flex items-center justify-center rounded-lg p-1.5 text-gray-500 hover:bg-gray-100 hover:text-gray-700 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-white"
                title="Edit"
              >
                <PencilIcon className="size-5" />
              </Link>
              {orderStatusAllowsRefund(row.status) && (
                <button
                  onClick={() => handleRefundClick(row)}
                  className="inline-flex items-center justify-center rounded-lg p-1.5 text-error-500 hover:bg-error-50 hover:text-error-600 dark:text-error-400 dark:hover:bg-error-900/20"
                  title="Refund"
                >
                  <DollarLineIcon className="size-5" />
                </button>
              )}
              <button
                onClick={() => handleDeleteClick(row)}
                className="inline-flex items-center justify-center rounded-lg p-1.5 text-gray-500 hover:bg-gray-100 hover:text-error-600 dark:text-gray-400 dark:hover:bg-gray-800"
                title="Move to trash"
              >
                <TrashBinIcon className="size-5" />
              </button>
            </>
          ) : (
            <>
              <button
                type="button"
                onClick={() => handleRestoreClick(row)}
                className="inline-flex items-center justify-center rounded-lg px-3 py-1.5 text-sm font-medium text-brand-600 transition hover:bg-brand-50 dark:text-brand-400 dark:hover:bg-brand-500/10"
                title="Restore"
              >
                Restore
              </button>
              <button
                type="button"
                onClick={() => handlePermanentDeleteClick(row)}
                className="inline-flex items-center justify-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium text-error-500 transition hover:bg-error-50 dark:text-error-400 dark:hover:bg-error-500/10"
                title="Delete permanently — cannot be undone"
              >
                <TrashBinIcon className="size-4 shrink-0 fill-current" />
                Delete Permanently
              </button>
            </>
          )}
        </div>
      ),
    },
  ];

  const courseOptions = [
    { value: "", label: "All Courses" },
    ...courses.map(c => ({ value: String(c.id), label: c.title }))
  ];

  const typeOptions = [
    { value: "", label: "All types" },
    { value: "course", label: "Course" },
    { value: "membership", label: "Member" },
    { value: "payment_link", label: "Pay link" },
  ];

  return (
    <div className="space-y-6">
      <ExportProgressBar progress={exportProgress} label="Exporting orders" />
      <div className="flex w-full flex-wrap items-center justify-between gap-4">
        <TrashScopeTabs
          value={trashScope}
          onChange={setTrashScope}
          activeLabel="All orders"
          trashLabel="Trash"
        />
        {!isTrash ? (
          <CourseAccessTabs value={courseAccessScope} onChange={setCourseAccessScope} />
        ) : null}
      </div>
      {!isTrash ? (
      <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-theme-xs dark:border-gray-800 dark:bg-white/[0.03] sm:p-5">
        <div className="flex min-w-0 flex-nowrap items-end gap-3 overflow-x-auto pb-0.5">
          <div className="min-w-[10rem] max-w-[22rem] flex-[1.2] shrink-0">
            <label className="mb-1 block text-xs font-medium text-gray-700 dark:text-gray-400">Course</label>
            <Select
              key={`course-${filterBarKey}`}
              options={courseOptions}
              defaultValue={filters.courseId}
              onChange={(val) => setFilters(f => ({ ...f, courseId: val }))}
              placeholder="Filter by Course"
            />
          </div>
          <div className="w-[7.25rem] shrink-0 sm:w-[8rem]">
            <label className="mb-1 block text-xs font-medium text-gray-700 dark:text-gray-400">Type</label>
            <Select
              key={`type-${filterBarKey}`}
              options={typeOptions}
              defaultValue={filters.type}
              onChange={(val) => setFilters(f => ({ ...f, type: val }))}
              placeholder="Type"
            />
          </div>
          <div className="w-[8.5rem] shrink-0 sm:w-[9.5rem]">
            <label className="mb-1 block text-xs font-medium text-gray-700 dark:text-gray-400">Status</label>
            <Select
              key={`status-${filterBarKey}`}
              options={statusFilterOptions}
              defaultValue={filters.status}
              onChange={(val) => setFilters((f) => ({ ...f, status: val }))}
              placeholder="Status"
            />
          </div>
          <div className="w-[10rem] shrink-0 sm:w-[10.5rem]">
            <AmountRangeDropdown
              key={`amount-${filterBarKey}`}
              id="orderAmountRange"
              label="Amount"
              amountMin={filters.amountMin}
              amountMax={filters.amountMax}
              onChange={(next) => setFilters((f) => ({ ...f, ...next }))}
            />
          </div>
          <div className="min-w-[12rem] flex-1 shrink-0 basis-[13rem]">
            <DatePicker
              key={`date-${filterBarKey}`}
              id="dateRange"
              label="Date range"
              labelClassName="mb-1 block text-xs font-medium text-gray-700 dark:text-gray-400"
              mode="range"
              placeholder="Select Date Range"
              onChange={(dates) => {
                if (dates.length === 2) {
                  const [start, end] = dates;
                  setFilters(f => ({
                    ...f,
                    dateFrom: start ? localDateString(start) : "",
                    dateTo: end ? localDateString(end) : "",
                  }));
                } else if (dates.length === 0) {
                  setFilters(f => ({ ...f, dateFrom: "", dateTo: "" }));
                }
              }}
            />
          </div>
          <div className="min-w-[11rem] flex-1 shrink-0 basis-[12rem]">
            <label className="mb-1 block text-xs font-medium text-gray-700 dark:text-gray-400">Search</label>
            <input
              type="search"
              value={searchInput}
              onChange={(e) => handleSearchChange(e.target.value)}
              placeholder="Name, email, phone, payment ID…"
              className="h-11 w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-800 placeholder-gray-500 transition focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:placeholder-gray-400"
            />
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={!hasActiveFilters}
            className="h-11 shrink-0 px-3 text-xs whitespace-nowrap"
            onClick={clearAllFilters}
          >
            Clear filters
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={exporting}
            className="h-11 shrink-0 px-3 text-xs whitespace-nowrap"
            startIcon={<DownloadIcon className="size-4 shrink-0" />}
            onClick={handleExportExcel}
            title={formatExportProgressTitle(exportProgress)}
          >
            {formatExportProgressLabel(
              exportProgress,
              hasActiveFilters ? "Export filtered" : "Export Excel",
            )}
          </Button>
        </div>
      </div>
      ) : null}

      <DataTable<OrderRecord>
        key={`${trashScope}-${courseAccessScope}`}
        ref={tableRef}
        columns={columns}
        fetchData={fetchOrdersForTable}
        initialPageSize={20}
        initialSortBy="created_at"
        initialSortOrder="DESC"
        pageSizeOptions={[10, 20, 50, 100]}
        enableSearch={isTrash}
        enableSorting
        enablePagination
        stickyHeaderFooter
        searchPlaceholder="Search name, email, phone, payment ID…"
        emptyMessage={
          isTrash
            ? "Trash is empty."
            : courseAccessApi === "expired"
              ? "No expired course orders."
              : courseAccessApi === "active"
                ? "No active course orders."
                : "No orders found."
        }
      />

      <RefundModal
        order={selectedOrder}
        isOpen={isRefundOpen}
        onClose={() => setIsRefundOpen(false)}
        onSuccess={() => tableRef.current?.refetch()}
      />

      <ConfirmDeleteModal
        isOpen={isDeleteModalOpen}
        onClose={() => {
          setDeleteTarget(null);
          setIsDeleteModalOpen(false);
        }}
        onConfirm={handleDeleteConfirm}
        title="Move to Trash"
        message={
          deleteTarget
            ? `Move order ${deleteTarget.order_id} to trash? You can restore it later from the Trash tab.`
            : undefined
        }
        confirmLabel="Move to Trash"
        isLoading={deleteLoading}
      />

      <ConfirmDeleteModal
        isOpen={isRestoreModalOpen}
        onClose={() => {
          setRestoreTarget(null);
          setIsRestoreModalOpen(false);
        }}
        onConfirm={handleRestoreConfirm}
        title="Restore Order"
        message={
          restoreTarget
            ? `Restore order ${restoreTarget.order_id}? It will appear again in the Active list.`
            : undefined
        }
        confirmLabel="Restore"
        loadingLabel="Restoring…"
        confirmVariant="brand"
        isLoading={restoreLoading}
      />

      <ConfirmDeleteModal
        isOpen={isPermanentDeleteModalOpen}
        onClose={() => {
          setPermanentDeleteTarget(null);
          setIsPermanentDeleteModalOpen(false);
        }}
        onConfirm={handlePermanentDeleteConfirm}
        title="Delete Permanently"
        message={
          permanentDeleteTarget
            ? `Permanently delete order ${permanentDeleteTarget.order_id}? This removes the order and its payment and coupon-usage records forever and cannot be undone.`
            : undefined
        }
        confirmLabel="Delete Permanently"
        loadingLabel="Deleting…"
        isLoading={permanentDeleteLoading}
      />
    </div>
  );
}
