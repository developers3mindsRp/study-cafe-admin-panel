import { api } from "./axios";

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
}

export interface FetchOrdersResult {
  orders: OrderRecord[];
  total: number;
  limit: number;
  offset: number;
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
}): Promise<FetchOrdersResult> {
  const res = await api.get<any>("/admin/orders", { params: params ?? {} });

  if (res.data && typeof res.data === "object" && "data" in res.data && !("meta" in res.data)) {
    return {
      orders: res.data.data,
      total: res.data.total ?? (Array.isArray(res.data.data) ? res.data.data.length : 0),
      limit: res.data.limit ?? params?.limit ?? 100,
      offset: (res.data.page != null ? (res.data.page - 1) * (res.data.limit || 20) : 0),
    };
  }

  if (res.data && typeof res.data === "object" && "data" in res.data && "meta" in res.data) {
    return {
      orders: res.data.data,
      total: res.data.meta.total,
      limit: res.data.meta.limit,
      offset: (res.data.meta.page - 1) * res.data.meta.limit,
    };
  }

  if (Array.isArray(res.data)) {
    return {
      orders: res.data,
      total: res.data.length,
      limit: params?.limit ?? 100,
      offset: params?.offset ?? 0
    };
  }

  return res.data;
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
  buyer_name?: string;
  buyer_email?: string;
  buyer_mobile?: string;
  buyer_gst?: string;
  affiliate?: string;
  coupon_code?: string;
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
  status?: "pending" | "paid" | "failed" | "cancelled";
  buyer_name?: string;
  buyer_email?: string;
  buyer_mobile?: string;
  buyer_gst?: string;
  affiliate?: string;
  amount?: number | string;
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
