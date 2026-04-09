import { createCrudApi } from "./apiFactory";
import { withClientPagination } from "../utils/dataTableUtils";
import { api } from "./axios";
import type { Coupon } from "../types/promoCode";
export type { Coupon } from "../types/promoCode";

const BASE_URL = "/admin/platform/coupons";

export const couponsApi = createCrudApi<Coupon>(BASE_URL)();

export type { ListQuery as ListParams } from "./apiFactory";

export const fetchCouponsPaginated = withClientPagination(
  async () => {
    const res = await couponsApi.list();
    return res.data;
  },
  ["code", "description", "discount_on"]
);

export function fetchCoupon(id: string | number) {
  return couponsApi.get(id);
}

export function createCoupon(payload: Partial<Coupon>) {
  return couponsApi.create(payload);
}

export function updateCoupon(id: string | number, payload: Partial<Coupon>) {
  return couponsApi.update(id, payload);
}

export function deleteCoupon(id: string | number) {
  return couponsApi.delete(id);
}

export async function checkCouponCodeExists(code: string, excludeId?: string | number): Promise<boolean> {
  try {
    const response = await api.get(`${BASE_URL}/check-code`, {
      params: { code, excludeId }
    });
    return response.data.exists;
  } catch (error) {
    console.error('Error checking coupon code existence:', error);
    return false;
  }
}
