import { api } from "./axios";

export interface Redirect {
  id: number;
  old_path: string;
  new_path: string;
  redirect_type: "301" | "302";
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
}

const mapRow = (r: Record<string, unknown>): Redirect => ({
  id: Number(r.id),
  old_path: String(r.old_path ?? ""),
  new_path: String(r.new_path ?? ""),
  redirect_type: r.redirect_type === "302" ? "302" : "301",
  is_active: Boolean(r.is_active),
  created_at: r.created_at ? String(r.created_at) : undefined,
  updated_at: r.updated_at ? String(r.updated_at) : undefined,
});

export const fetchRedirects = async (): Promise<Redirect[]> => {
  const { data } = await api.get("/admin/platform/redirects");
  const rows = Array.isArray(data) ? data : Array.isArray(data?.data) ? data.data : [];
  return rows.map((r: Record<string, unknown>) => mapRow(r));
};

export const createRedirect = async (payload: {
  old_path: string;
  new_path: string;
  redirect_type?: "301" | "302";
  is_active?: boolean;
}): Promise<Redirect> => {
  const { data } = await api.post("/admin/platform/redirects", payload);
  return mapRow((data?.data ?? data) as Record<string, unknown>);
};

export const updateRedirect = async (
  id: number,
  payload: Partial<{ old_path: string; new_path: string; redirect_type: "301" | "302"; is_active: boolean }>,
): Promise<Redirect> => {
  const { data } = await api.put(`/admin/platform/redirects/${id}`, payload);
  return mapRow((data?.data ?? data) as Record<string, unknown>);
};

export const deleteRedirect = async (id: number): Promise<void> => {
  await api.delete(`/admin/platform/redirects/${id}`);
};
