import { api } from "./axios";

export interface SiteAdsSlot {
  image_url: string;
  link_url: string;
}

export interface SiteDisplayAdsPayload {
  popup: SiteAdsSlot & { enabled: boolean };
  article_detail_sidebar: SiteAdsSlot[];
  article_listing_sidebar: SiteAdsSlot;
  between_article: {
    after_paragraph_3: SiteAdsSlot;
    after_paragraph_6: SiteAdsSlot;
    below_featured_post: SiteAdsSlot;
  };
}

export async function fetchSiteAdsAdmin(): Promise<SiteDisplayAdsPayload> {
  const res = await api.get<SiteDisplayAdsPayload>("/admin/platform/site-ads");
  return res.data;
}

export async function putSiteAdsAdmin(body: SiteDisplayAdsPayload): Promise<SiteDisplayAdsPayload> {
  const res = await api.put<SiteDisplayAdsPayload>("/admin/platform/site-ads", body);
  return res.data;
}
