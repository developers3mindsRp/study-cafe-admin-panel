import { api } from "./axios";

export interface MediaAsset {
  id: number;
  url: string;
  label: string | null;
  category: string;
  created_at: string;
}

export async function getMediaAssets(category?: string): Promise<MediaAsset[]> {
  const params = category ? { category } : {};
  const res = await api.get<MediaAsset[]>("/admin/platform/media-assets", { params });
  return Array.isArray(res.data) ? res.data : [];
}

export async function createMediaAsset(payload: {
  url: string;
  label?: string;
  category?: string;
}): Promise<MediaAsset> {
  const res = await api.post<MediaAsset>("/admin/platform/media-assets", payload);
  return res.data;
}

export async function deleteMediaAsset(id: number): Promise<void> {
  await api.delete(`/admin/platform/media-assets/${id}`);
}
