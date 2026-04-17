import { api } from "./axios";

export type CouponVisibility = "public" | "hidden";
export type CouponStatus = "publish" | "draft";

export interface Coupon {
  id: number;
  code: string;
  description: string | null;
  type: string | null;
  value: number | null;
  min_order: number | null;
  max_discount: number | null;
  discount_on: string | null;
  start_date: string | null;
  expire_date: string | null;
  status: CouponStatus;
  /** public → shown in frontend coupon listing. hidden → valid but not listed (shared privately). */
  visibility: CouponVisibility;
  created_at: string;
}

export interface CouponPayload {
  code: string;
  description?: string;
  type?: string;
  value?: number;
  min_order?: number;
  max_discount?: number;
  discount_on?: string;
  start_date?: string | null;
  expire_date?: string | null;
  status?: CouponStatus;
  visibility?: CouponVisibility;
}

export async function getCoupons(): Promise<Coupon[]> {
  const res = await api.get<Coupon[]>("/admin/coupons");
  return Array.isArray(res.data) ? res.data : [];
}

export async function getCoupon(id: number): Promise<Coupon> {
  const res = await api.get<Coupon>(`/admin/coupons/${id}`);
  return res.data;
}

export async function createCoupon(payload: CouponPayload): Promise<Coupon> {
  const res = await api.post<Coupon>("/admin/coupons", payload);
  return res.data;
}

export async function updateCoupon(id: number, payload: Partial<CouponPayload>): Promise<Coupon> {
  const res = await api.put<Coupon>(`/admin/coupons/${id}`, payload);
  return res.data;
}

export async function checkCouponCodeExists(code: string, excludeId?: number): Promise<boolean> {
  const res = await api.get<{ exists: boolean }>("/admin/coupons/check-code", {
    params: { code, ...(excludeId ? { excludeId } : {}) },
  });
  return res.data.exists;
}

export async function deleteCoupon(id: number): Promise<void> {
  await api.delete(`/admin/coupons/${id}`);
}
