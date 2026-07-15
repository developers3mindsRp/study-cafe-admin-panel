import { api } from "./axios";
import type { TrashScope } from "../components/trash/TrashScopeTabs";
import { courseAccessFilterToApiParam, type CourseAccessFilter } from "../components/orders/CourseAccessTabs";
import { fetchAllPaginatedForExport } from "../utils/fetchAllPaginatedForExport";
import type { ExportProgressCallback } from "../utils/exportProgress";
import { requireAuthForExport } from "../lib/exportAuth";

/** Refund is only valid once payment succeeded (matches order-service refund rules). */
export function orderStatusAllowsRefund(status: string | null | undefined): boolean {
  const s = (status || "").toLowerCase().trim();
  return s === "paid" || s === "completed";
}

export interface OrderRecord {
  id: number;
  order_id: string;
  user_id: number | null;
  type: string | null;
  entity_id: string | null;
  entity_name?: string | null;
  amount: string | number | null;
  currency: string;
  status: string;
  buyer_name?: string | null;
  buyer_email?: string | null;
  buyer_mobile?: string | null;
  buyer_gst?: string | null;
  affiliate?: string | null;
  coupon_code?: string | null;
  coupon_discount?: string | number | null;
  original_amount?: string | number | null;
  gateway?: string | null;
  batch_id?: number | null;
  created_at?: string;
  payment_id?: string | null;
  refund_amount?: string | number | null;
  refund_remarks?: string | null;
  utm?: {
    source?: string;
    medium?: string;
    campaign?: string;
    content?: string;
    term?: string;
  } | null;
  /** Course orders only: lifetime | active | expired (paid/completed). */
  course_access?: "lifetime" | "active" | "expired" | null;
}

export interface FetchOrdersResult {
  orders: OrderRecord[];
  total: number;
  limit: number;
  offset: number;
}

/** Toolbar filters on the orders list (shared by table + Excel export). */
export type OrdersListFilters = {
  dateFrom: string;
  dateTo: string;
  courseId: string;
  type: string;
  amountMin: string;
  amountMax: string;
  /** pending | failed | completed (paid + completed rows) */
  status: string;
};

export type BuildOrdersListParamsInput = {
  filters: OrdersListFilters;
  search?: string;
  sortBy?: string;
  sortOrder?: string;
  limit?: number;
  offset?: number;
  trashScope?: TrashScope;
  courseAccessScope?: CourseAccessFilter;
};

/** One query shape for list, export, and API — keeps filtered export in sync with the grid. */
export function buildOrdersListParams(input: BuildOrdersListParamsInput) {
  const { filters, search, sortBy, sortOrder, limit, offset, trashScope, courseAccessScope } = input;
  const params: NonNullable<Parameters<typeof fetchOrders>[0]> = {};

  if (limit != null) params.limit = limit;
  if (offset != null) params.offset = offset;
  if (search?.trim()) params.search = search.trim();
  if (sortBy) params.sortBy = sortBy;
  if (sortOrder) params.sortOrder = sortOrder;
  if (filters.dateFrom) params.dateFrom = filters.dateFrom;
  if (filters.dateTo) params.dateTo = filters.dateTo;
  if (filters.courseId) params.courseId = filters.courseId;
  if (filters.type) params.type = filters.type;
  const min = filters.amountMin.trim();
  const max = filters.amountMax.trim();
  if (min) params.amountMin = min;
  if (max) params.amountMax = max;
  if (filters.status) params.status = filters.status;
  if (trashScope === "trash") params.trashed = "1";
  const courseAccess = courseAccessFilterToApiParam(courseAccessScope);
  if (courseAccess) params.course_access = courseAccess;

  return params;
}

export function ordersListFiltersAreActive(filters: OrdersListFilters): boolean {
  return Boolean(
    filters.dateFrom ||
      filters.dateTo ||
      filters.courseId ||
      filters.type ||
      filters.amountMin.trim() ||
      filters.amountMax.trim() ||
      filters.status,
  );
}

export async function fetchOrders(params?: {
  limit?: number;
  offset?: number;
  search?: string;
  status?: string;
  sortBy?: string;
  sortOrder?: string;
  dateFrom?: string;
  dateTo?: string;
  courseId?: number | string;
  type?: string;
  /** Inclusive min order amount (same currency as stored on orders). */
  amountMin?: number | string;
  /** Inclusive max order amount. */
  amountMax?: number | string;
  /** When set (e.g. "1"), list soft-deleted orders only. */
  trashed?: string | number;
  /** Filter by course access window: active | expired */
  course_access?: string;
}): Promise<FetchOrdersResult> {
  const res = await api.get<unknown>("/admin/orders", { params: params ?? {} });
  const body = res.data;

  const orders: OrderRecord[] = Array.isArray(body)
    ? body
    : body && typeof body === "object" && Array.isArray((body as { data?: unknown }).data)
      ? ((body as { data: OrderRecord[] }).data)
      : [];

  const record = body && typeof body === "object" && !Array.isArray(body) ? (body as Record<string, unknown>) : null;
  const meta =
    record?.meta && typeof record.meta === "object" ? (record.meta as Record<string, unknown>) : null;

  const total =
    typeof record?.total === "number"
      ? record.total
      : typeof meta?.total === "number"
        ? meta.total
        : orders.length;

  const limit =
    typeof record?.limit === "number"
      ? record.limit
      : typeof meta?.limit === "number"
        ? meta.limit
        : params?.limit ?? 100;

  const page =
    typeof record?.page === "number"
      ? record.page
      : typeof meta?.page === "number"
        ? meta.page
        : params?.offset != null && limit > 0
          ? Math.floor(params.offset / limit) + 1
          : 1;

  return {
    orders,
    total,
    limit,
    offset: (page - 1) * limit,
  };
}

const ORDERS_EXPORT_PAGE_SIZE = 500;

/** Loads every order page matching list filters + search/sort (max 500 per request). */
export async function fetchAllOrdersForExport(
  params: Omit<BuildOrdersListParamsInput, "limit" | "offset"> & {
    onProgress?: ExportProgressCallback;
  },
): Promise<OrderRecord[]> {
  await requireAuthForExport();
  const { onProgress, ...rest } = params;
  const query = buildOrdersListParams(rest);
  return fetchAllPaginatedForExport({
    pageSize: ORDERS_EXPORT_PAGE_SIZE,
    onProgress,
    fetchPage: async (page, limit) => {
      const offset = (page - 1) * limit;
      const res = await fetchOrders({ ...query, limit, offset });
      return { data: res.orders ?? [], total: res.total ?? 0 };
    },
  });
}

export async function fetchOrderByOrderId(orderId: string): Promise<OrderRecord | null> {
  try {
    const res = await api.get<OrderRecord>(`/admin/orders/${encodeURIComponent(orderId)}`);
    return res.data ?? null;
  } catch {
    return null;
  }
}

export interface CreateOrderPayload {
  user_id: number;
  type: "course" | "membership";
  entity_id: string;
  amount: number | string;
  currency?: string;
  status: "pending" | "paid" | "failed" | "cancelled";
  /** How payment was collected: razorpay (gateway) or admin (manual). */
  gateway?: "razorpay" | "admin";
  buyer_name?: string;
  buyer_email?: string;
  buyer_mobile?: string;
  buyer_gst?: string;
  affiliate?: string;
  coupon_code?: string;
  /** Razorpay payment ID when status is paid (optional for manual orders). */
  payment_id?: string;
  utm?: {
    source?: string;
    medium?: string;
    campaign?: string;
    content?: string;
    term?: string;
  } | null;
}

export async function createOrder(data: CreateOrderPayload): Promise<OrderRecord> {
  const res = await api.post<OrderRecord>("/admin/orders", data);
  return res.data;
}

export interface UpdateOrderPayload {
  status?: "pending" | "paid" | "failed";
  /** How payment was collected when marking paid or correcting metadata. */
  gateway?: "razorpay" | "admin";
  /** Required when marking a failed order as paid; optional otherwise. */
  payment_id?: string;
  buyer_name?: string;
  buyer_email?: string;
  buyer_mobile?: string;
  buyer_gst?: string;
  affiliate?: string;
  amount?: number | string;
  /** Same order type only — backend revokes old fulfillment then re-grants when paid/completed. */
  entity_id?: string;
  /** Course orders only; omit to auto-resolve batch when changing course. */
  batch_id?: number | string | null;
  refund_amount?: number | string | null;
  refund_remarks?: string | null;
  coupon_code?: string | null;
  coupon_discount?: number | string | null;
  original_amount?: number | string | null;
}

export async function updateOrder(id: number, data: UpdateOrderPayload): Promise<OrderRecord> {
  const res = await api.put<OrderRecord>(`/admin/orders/${id}`, data);
  return res.data;
}

export async function applyCouponAdmin(data: {
  couponCode: string;
  type: string;
  id: string | number;
  userId?: number;
}): Promise<any> {
  const res = await api.post("/admin/orders/apply-coupon", data);
  return res.data;
}

export async function refundOrder(orderId: string | number, payload: { amount: number; remarks: string }): Promise<void> {
  await api.post(`/admin/orders/${orderId}/refund`, payload);
}

export async function deleteOrder(id: number): Promise<void> {
  await api.delete(`/admin/orders/${id}`);
}

export async function restoreOrder(id: number): Promise<void> {
  await api.post(`/admin/orders/${id}/restore`);
}

/** Hard-delete a trashed order and its owned payment/coupon-usage rows. Cannot be undone. */
export async function deleteOrderPermanently(id: number): Promise<void> {
  await api.delete(`/admin/orders/${id}/permanent`);
}
