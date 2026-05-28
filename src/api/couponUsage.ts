import { api } from "./axios";
import type { DataTableFetchParams, DataTableFetchResult } from "../components/tables/data-table";

export interface CouponUsageSummaryItem {
  coupon_id: number;
  code: string;
  usage_count: number;
  total_original: number;
  total_discount: number;
  total_paid: number;
}

export interface CouponUsageTotals {
  usage_count: number;
  total_original: number;
  total_discount: number;
  total_paid: number;
}

export interface CouponUsageRow {
  id: number;
  order_id: string;
  user_id: number | null;
  used_at: string;
  coupon_code: string;
  coupon_discount: string | number | null;
  original_amount: string | number | null;
  amount: string | number | null;
  currency: string;
  status: string;
  type: string | null;
  entity_id: string | null;
  entity_name: string | null;
  buyer_name: string | null;
  buyer_email: string | null;
  buyer_mobile: string | null;
  coupon: {
    id: number;
    code: string;
    type: string | null;
    value: string | number | null;
    discount_on: string | null;
  } | null;
}

export type CouponUsageFilters = {
  status: string;
  type: string;
  dateFrom: string;
  dateTo: string;
  couponId?: string;
};

function buildParams(
  params: DataTableFetchParams & { filters: CouponUsageFilters; couponId?: string },
): Record<string, string | number> {
  const q: Record<string, string | number> = {
    limit: params.limit,
    offset: (params.page - 1) * params.limit,
  };
  const couponId = params.couponId ?? params.filters.couponId;
  if (couponId) q.couponId = couponId;
  if (params.search?.trim()) q.search = params.search.trim();
  if (params.sortBy) q.sortBy = params.sortBy;
  if (params.sortOrder) q.sortOrder = params.sortOrder;
  if (params.filters.status) q.status = params.filters.status;
  if (params.filters.type) q.type = params.filters.type;
  if (params.filters.dateFrom) q.dateFrom = params.filters.dateFrom;
  if (params.filters.dateTo) q.dateTo = params.filters.dateTo;
  return q;
}

export async function fetchCouponUsageSummary(): Promise<CouponUsageSummaryItem[]> {
  const res = await api.get<CouponUsageSummaryItem[]>("/admin/coupons/usage/summary");
  return Array.isArray(res.data) ? res.data : [];
}

export async function fetchCouponUsagesPaginated(
  params: DataTableFetchParams & { filters: CouponUsageFilters; couponId?: string },
): Promise<DataTableFetchResult<CouponUsageRow> & { summary?: CouponUsageTotals }> {
  const res = await api.get<{
    data: CouponUsageRow[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
    summary?: CouponUsageTotals;
  }>("/admin/coupons/usage", { params: buildParams(params) });

  const rows = res.data.data ?? [];
  const total = res.data.total ?? 0;
  return {
    data: rows,
    summary: res.data.summary,
    meta: {
      total,
      page: res.data.page ?? params.page,
      limit: res.data.limit ?? params.limit,
      totalPages: res.data.totalPages ?? (total ? Math.ceil(total / params.limit) : 0),
      hasNextPage: res.data.hasNextPage ?? false,
      hasPreviousPage: res.data.hasPreviousPage ?? false,
    },
  };
}
