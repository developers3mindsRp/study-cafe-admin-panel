import { api } from "./axios";

export interface OrderRecord {
  id: number;
  order_id: string;
  user_id: number | null;
  type: string | null;
  entity_id: string | null;
  amount: string | number | null;
  currency: string;
  status: string;
  buyer_name?: string | null;
  buyer_email?: string | null;
  created_at?: string;
  payment_id?: string | null;
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
}): Promise<FetchOrdersResult> {
  const res = await api.get<FetchOrdersResult>("/admin/orders", { params: params ?? {} });
  // Handle both new paginated shape and legacy array (backwards compat)
  if (Array.isArray(res.data)) {
    return { orders: res.data, total: (res.data as OrderRecord[]).length, limit: params?.limit ?? 100, offset: params?.offset ?? 0 };
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
