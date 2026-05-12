import { api } from "./axios";

export interface SiteSeoRoute {
  id: number;
  path: string;
  label: string;
  sort_order: number;
  created_at?: string;
  updated_at?: string;
}

const mapRow = (r: Record<string, unknown>): SiteSeoRoute => ({
  id: Number(r.id),
  path: String(r.path ?? ""),
  label: String(r.label ?? ""),
  sort_order: Number(r.sort_order ?? 0),
  created_at: r.created_at ? String(r.created_at) : undefined,
  updated_at: r.updated_at ? String(r.updated_at) : undefined,
});

export const fetchSiteSeoRoutes = async (): Promise<SiteSeoRoute[]> => {
  const { data } = await api.get("/admin/platform/site-seo-routes");
  const rows = Array.isArray(data) ? data : Array.isArray(data?.data) ? data.data : [];
  return rows.map((r: Record<string, unknown>) => mapRow(r));
};

export const createSiteSeoRoute = async (payload: {
  path: string;
  label: string;
  sort_order?: number;
}): Promise<SiteSeoRoute> => {
  const { data } = await api.post("/admin/platform/site-seo-routes", payload);
  return mapRow((data?.data ?? data) as Record<string, unknown>);
};

export const updateSiteSeoRoute = async (
  id: number,
  payload: Partial<{ path: string; label: string; sort_order: number }>,
): Promise<SiteSeoRoute> => {
  const { data } = await api.put(`/admin/platform/site-seo-routes/${id}`, payload);
  return mapRow((data?.data ?? data) as Record<string, unknown>);
};

export const deleteSiteSeoRoute = async (id: number): Promise<void> => {
  await api.delete(`/admin/platform/site-seo-routes/${id}`);
};
