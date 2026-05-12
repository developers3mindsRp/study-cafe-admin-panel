import { createCrudApi } from "./apiFactory";
import { api } from "./axios";
import { withClientPagination } from "../utils/dataTableUtils";

export interface BannerRecord {
  id: number;
  identifier: string;
  desktop_image_url: string;
  mobile_image_url: string;
  link_url: string | null;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
}

const BASE_URL = "/admin/platform/banners";

export const bannersApi = createCrudApi<BannerRecord>(BASE_URL)();

export async function fetchAllBanners(): Promise<BannerRecord[]> {
  const { data } = await api.get<BannerRecord[] | { data: BannerRecord[] }>(BASE_URL);
  return Array.isArray(data) ? data : (data as { data: BannerRecord[] })?.data ?? [];
}

export const fetchBannersPaginated = withClientPagination<BannerRecord>(
  fetchAllBanners,
  ["identifier", "link_url"]
);
