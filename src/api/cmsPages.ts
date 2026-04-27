/**
 * CMS page content API (admin).
 * GET list, GET by slug, PUT by slug. Data is stored in cms_pages (preserved across WP migration).
 */

import { api } from "./axios";

export interface CmsPageRecord {
  id: number;
  slug: string;
  title: string | null;
  content: string | null;
  meta: Record<string, unknown> | null;
  created_at?: string;
  updated_at?: string;
}

export interface CmsPageUpdatePayload {
  title?: string | null;
  content?: string | null;
  meta?: Record<string, unknown> | null;
}

function normalizeMeta(meta: CmsPageRecord["meta"]): Record<string, unknown> | null {
  if (meta == null) return null;
  if (typeof meta === "object" && !Array.isArray(meta)) return meta as Record<string, unknown>;
  if (typeof meta === "string") {
    try {
      const p = JSON.parse(meta) as unknown;
      return p && typeof p === "object" && !Array.isArray(p) ? (p as Record<string, unknown>) : null;
    } catch {
      return null;
    }
  }
  return null;
}

/** Normalizes API row (meta may be object or legacy string JSON). */
export function normalizeCmsPageRecord(row: CmsPageRecord | null): CmsPageRecord | null {
  if (!row) return null;
  return { ...row, meta: normalizeMeta(row.meta) };
}

export async function fetchCmsPages(): Promise<CmsPageRecord[]> {
  const res = await api.get<CmsPageRecord[]>("/admin/platform/cms-pages");
  const raw = Array.isArray(res.data) ? res.data : [];
  return raw.map((r) => normalizeCmsPageRecord(r)!).filter(Boolean);
}

export async function fetchCmsPageBySlug(slug: string): Promise<CmsPageRecord | null> {
  try {
    const res = await api.get<CmsPageRecord>(`/admin/platform/cms-pages/${encodeURIComponent(slug)}`);
    return normalizeCmsPageRecord(res.data ?? null);
  } catch (e: unknown) {
    if (e && typeof e === "object" && "response" in e) {
      const ax = e as { response?: { status?: number } };
      if (ax.response?.status === 404) return null;
    }
    throw e;
  }
}

export async function updateCmsPage(slug: string, payload: CmsPageUpdatePayload): Promise<CmsPageRecord> {
  const res = await api.put<CmsPageRecord>(`/admin/platform/cms-pages/${encodeURIComponent(slug)}`, payload);
  return normalizeCmsPageRecord(res.data) as CmsPageRecord;
}
