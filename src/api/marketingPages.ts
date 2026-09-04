import { api } from "./axios";

export interface MarketingPageMeta {
  announcement_text?: string;
  headline?: string;
  subheadline?: string;
  bonus_banner_text?: string;
  masterclass_date?: string;
  masterclass_time?: string;
  /** "Register Before Tonight to" line above the bonus banner. */
  register_before_text?: string;
  /** "Masterclass is Starting on" label above the date/time chips. */
  masterclass_label?: string;
  /** Play-icon overlay on the banner thumbnail (default shown). */
  show_play_icon?: boolean;
  cta_title?: string;
  cta_subtitle?: string;
  cta_price_text?: string;
  increased_price_text?: string;
  /** Campaign MRP shown struck-through in the inline checkout. */
  amount?: string;
  /** Campaign selling price the inline checkout charges (+18% GST). Blank = course price. */
  sale_price?: string;
  countdown_minutes?: number;
  use_global_faq?: boolean;
  use_course_faq?: boolean;
  checkout_url?: string;
  /** Where the thank-you page sends buyers who paid through this landing page. Blank = the course's own setting. */
  post_purchase_redirect_url?: string;
  /** Seconds the thank-you page counts down before that redirect. Blank = default (10s). */
  post_purchase_redirect_delay?: number | string;
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
