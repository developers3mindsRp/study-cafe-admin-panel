import { api } from "./axios";

export interface MediaAsset {
  id: number;
  url: string;
  label: string | null;
  mime_type: string | null;
  category: string;
  created_at: string;
}

export type MediaAssetsListParams = {
  category?: string;
  type?: "image" | "document" | "all";
  search?: string;
  page?: number;
  limit?: number;
};

export type MediaAssetsPage = {
  data: MediaAsset[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
};

function normalizeListParams(
  params?: string | MediaAssetsListParams,
): MediaAssetsListParams {
  if (typeof params === "string") return { category: params };
  return params ?? {};
}

/** Icon/course picker — always returns a flat array. */
export async function getMediaAssets(category?: string): Promise<MediaAsset[]>;
/** List with optional pagination — returns a page object when `page` is set. */
export async function getMediaAssets(params: MediaAssetsListParams): Promise<MediaAssetsPage>;
export async function getMediaAssets(
  params?: string | MediaAssetsListParams,
): Promise<MediaAsset[] | MediaAssetsPage> {
  const query = normalizeListParams(params);
  const res = await api.get<MediaAsset[] | MediaAssetsPage>(
    "/admin/platform/media-assets",
    { params: query },
  );
  const body = res.data;
  if (Array.isArray(body)) return body;
  if (body && typeof body === "object" && "data" in body && Array.isArray(body.data)) {
    return body as MediaAssetsPage;
  }
  return [];
}

export function asMediaAssetList(
  result: MediaAsset[] | MediaAssetsPage,
): MediaAsset[] {
  return Array.isArray(result) ? result : result.data;
}

export async function getMediaLibrary(
  params: Omit<MediaAssetsListParams, "category"> & { category?: string } = {},
): Promise<MediaAssetsPage> {
  const result = await getMediaAssets({
    category: "library",
    page: 1,
    limit: 24,
    ...params,
  });
  if (Array.isArray(result)) {
    return { data: result, total: result.length, page: 1, limit: result.length, totalPages: 1 };
  }
  return result;
}

export async function createMediaAsset(payload: {
  url: string;
  label?: string;
  category?: string;
  mime_type?: string | null;
}): Promise<MediaAsset> {
  const res = await api.post<MediaAsset>("/admin/platform/media-assets", {
    category: "library",
    ...payload,
  });
  return res.data as MediaAsset;
}

export async function deleteMediaAsset(id: number): Promise<void> {
  await api.delete(`/admin/platform/media-assets/${id}`);
}
