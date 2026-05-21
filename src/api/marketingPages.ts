import { api } from "./axios";

export interface MarketingPageMeta {
  announcement_text?: string;
  headline?: string;
  subheadline?: string;
  bonus_banner_text?: string;
  masterclass_date?: string;
  masterclass_time?: string;
  cta_title?: string;
  cta_subtitle?: string;
  cta_price_text?: string;
  increased_price_text?: string;
  countdown_minutes?: number;
  use_global_faq?: boolean;
  use_course_faq?: boolean;
  checkout_url?: string;
  stats?: {
    people_coached?: string;
    preferred_by?: string;
    attended?: string;
  };
  learning_bullets?: string[];
  feature_cards?: { icon?: string; text?: string }[];
  bonus_items?: { label?: string; icon?: string; description?: string; worth?: string }[];
  who_can_attend?: string[];
  gallery_images?: string[];
  video_url?: string;
  text_testimonials?: { quote?: string; name?: string; role?: string; rating?: number }[];
  video_testimonials?: { url?: string; thumbnail?: string }[];
  trainer?: {
    highlights?: string[];
    bio_points?: string[];
    image_url?: string;
  };
}

export interface MarketingPage {
  id: number;
  course_id: number;
  slug: string;
  is_published: boolean;
  meta: MarketingPageMeta;
  course_title?: string | null;
  course_slug?: string | null;
  created_at?: string;
  updated_at?: string;
}

export type MarketingPagePayload = {
  course_id: number;
  slug?: string;
  is_published?: boolean;
  meta?: MarketingPageMeta;
};

export const fetchMarketingPages = async (): Promise<MarketingPage[]> => {
  const res = await api.get<MarketingPage[]>("/admin/marketing-pages");
  const data = res.data;
  return Array.isArray(data) ? data : [];
};

export const fetchMarketingPage = async (id: number): Promise<MarketingPage> => {
  const res = await api.get<MarketingPage>(`/admin/marketing-pages/${id}`);
  return res.data;
};

export const createMarketingPage = async (
  payload: MarketingPagePayload,
): Promise<MarketingPage> => {
  const res = await api.post<MarketingPage>("/admin/marketing-pages", payload);
  return res.data;
};

export const updateMarketingPage = async (
  id: number,
  payload: Partial<MarketingPagePayload>,
): Promise<MarketingPage> => {
  const res = await api.put<MarketingPage>(`/admin/marketing-pages/${id}`, payload);
  return res.data;
};

export const deleteMarketingPage = async (id: number): Promise<void> => {
  await api.delete(`/admin/marketing-pages/${id}`);
};
