import { createCrudApi } from "./apiFactory";
import { withClientPagination } from "../utils/dataTableUtils";
import type { PromoCode } from "../types/promoCode";
export type { PromoCode } from "../types/promoCode";

const BASE_URL = "/admin/platform/promo-codes";

export const promoCodesApi = createCrudApi<PromoCode>(BASE_URL)();

export type { ListQuery as ListParams } from "./apiFactory";

export const fetchPromoCodesPaginated = withClientPagination(
  async () => {
    const res = await promoCodesApi.list();
    return res.data;
  },
  ["code", "description", "target_type"]
);

export function fetchPromoCode(id: string | number) {
  return promoCodesApi.get(id);
}

export function createPromoCode(payload: Partial<PromoCode>) {
  return promoCodesApi.create(payload);
}

export function updatePromoCode(id: string | number, payload: Partial<PromoCode>) {
  return promoCodesApi.update(id, payload);
}

export function deletePromoCode(id: string | number) {
  return promoCodesApi.delete(id);
}
