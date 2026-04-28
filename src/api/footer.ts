import { api } from "./axios";

export interface FooterDataRow {
  id: number;
  data_key: string;
  data_value: string | null;
  meta: Record<string, unknown> | null;
  created_at?: string;
  updated_at?: string;
}

export const FOOTER_KEYS = {
  copyright: "copyright",
  tagline: "tagline",
  social_links: "social_links",
  app_links: "app_links",
  important_links: "important_links",
} as const;

export async function fetchFooterAdmin(): Promise<FooterDataRow[]> {
  const res = await api.get<FooterDataRow[]>("/admin/platform/footer");
  const data = res.data;
  return Array.isArray(data) ? data : [];
}

export async function putFooterKey(
  key: string,
  body: {
    data_value?: string | null | Record<string, unknown> | unknown[];
    meta?: Record<string, unknown> | null;
  }
): Promise<FooterDataRow> {
  const res = await api.put<FooterDataRow>(
    `/admin/platform/footer/${encodeURIComponent(key)}`,
    body
  );
  return res.data;
}
