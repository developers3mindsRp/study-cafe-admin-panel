import { createCrudApi } from "./apiFactory";
import { api } from "./axios";

const BASE_URL = "/admin/pabbly-webhooks";

export interface PabblyWebhook {
  id: number;
  name: string;
  webhook_url: string;
  /** Course category ids this rule matches. Empty = catch-all (fires for any course no more specific rule already claimed). */
  category_ids: number[];
  /** Server-derived ordering (category rules always run before a catch-all) — not admin-editable. */
  priority: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface PabblyWebhookPayload {
  name: string;
  webhook_url: string;
  category_ids: number[];
  is_active: boolean;
}

const pabblyWebhooksApi = createCrudApi<PabblyWebhook>(BASE_URL)();

export async function fetchPabblyWebhooks(): Promise<PabblyWebhook[]> {
  const res = await api.get<PabblyWebhook[]>(BASE_URL);
  return Array.isArray(res.data) ? res.data : [];
}

export function fetchPabblyWebhook(id: string | number) {
  return pabblyWebhooksApi.get(id);
}

export function createPabblyWebhook(payload: PabblyWebhookPayload) {
  return pabblyWebhooksApi.create(payload);
}

export function updatePabblyWebhook(id: string | number, payload: Partial<PabblyWebhookPayload>) {
  return pabblyWebhooksApi.update(id, payload);
}

export function deletePabblyWebhook(id: string | number) {
  return pabblyWebhooksApi.delete(id);
}

export interface PabblyWebhookTestResult {
  success: boolean;
  status: number | null;
  response: unknown;
  payloadSent: Record<string, unknown>;
}

/** Fires a sample course_purchase_success payload at the given URL — works for an
 * unsaved URL still being typed in the form, not just a saved rule. */
export async function testPabblyWebhook(webhook_url: string): Promise<PabblyWebhookTestResult> {
  const res = await api.post<PabblyWebhookTestResult>(`${BASE_URL}/test`, { webhook_url });
  return res.data;
}
