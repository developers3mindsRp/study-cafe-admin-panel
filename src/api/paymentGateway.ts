import { api } from "./axios";

export interface PaymentGatewayKeys {
  id: number;
  name: string;
  gateway_name: string;
  key_id: string;
  /** Never returned by API — use has_key_secret instead */
  key_secret?: string;
  /** Never returned by API — use has_webhook_secret instead */
  webhook_secret?: string;
  has_key_secret?: boolean;
  has_webhook_secret?: boolean;
  key_id_locked?: boolean;
  is_active: number;
  created_at?: string;
  updated_at?: string;
}

/** UI/API mask for hidden credentials — must never be sent back on update. */
export function isMaskedCredential(value: string | undefined | null): boolean {
  const s = String(value ?? "").trim();
  if (!s) return false;
  return /^[•*·.\-_\s]+$/u.test(s);
}

export async function fetchPaymentGatewayKeys(): Promise<PaymentGatewayKeys[]> {
  const res = await api.get<PaymentGatewayKeys[]>("/admin/payment-gateways");
  return res.data ?? [];
}

export async function createPaymentGatewayKeys(data: Partial<PaymentGatewayKeys>): Promise<PaymentGatewayKeys> {
  const res = await api.post<PaymentGatewayKeys>("/admin/payment-gateways", data);
  return res.data;
}

export async function updatePaymentGatewayKeys(id: number, data: Partial<PaymentGatewayKeys>): Promise<PaymentGatewayKeys> {
  const res = await api.put<PaymentGatewayKeys>(`/admin/payment-gateways/${id}`, data);
  return res.data;
}

export async function deletePaymentGatewayKeys(id: number): Promise<void> {
  await api.delete(`/admin/payment-gateways/${id}`);
}
