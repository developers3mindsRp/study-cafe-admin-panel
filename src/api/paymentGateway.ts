import { api } from "./axios";

export interface PaymentGatewayKeys {
  id: number;
  name: string;
  gateway_name: string;
  key_id: string;
  key_secret?: string;
  webhook_secret?: string;
  is_active: number;
  created_at?: string;
  updated_at?: string;
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
