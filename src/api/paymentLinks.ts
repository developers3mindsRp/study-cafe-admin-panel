import { createCrudApi } from "./apiFactory";
import { withClientPagination } from "../utils/dataTableUtils";
import type { PaymentLink } from "../types/paymentLink";

export type { PaymentLink } from "../types/paymentLink";

const BASE_URL = "/admin/payment-links";

export const paymentLinksApi = createCrudApi<PaymentLink>(BASE_URL)();

export const fetchPaymentLinksPaginated = withClientPagination(
  async () => {
    const res = await paymentLinksApi.list();
    return res.data;
  },
  ["title", "slug", "status"],
);

export function fetchPaymentLink(id: string | number) {
  return paymentLinksApi.get(id);
}

export function createPaymentLink(payload: Partial<PaymentLink>) {
  return paymentLinksApi.create(payload);
}

export function updatePaymentLink(id: string | number, payload: Partial<PaymentLink>) {
  return paymentLinksApi.update(id, payload);
}

export function deletePaymentLink(id: string | number) {
  return paymentLinksApi.delete(id);
}
