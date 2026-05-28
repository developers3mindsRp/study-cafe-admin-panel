import api from './axios';

export interface GoogleReview {
  id: number;
  author_name: string;
  author_role: string;
  content: string;
  avatar_url?: string;
  rating?: number;
  reviewed_at?: string | null;
  sort_order: number;
  is_active: boolean;
  created_at?: string;
}

export interface GoogleReviewPayload {
  author_name: string;
  author_role?: string;
  content: string;
  avatar_url?: string;
  rating?: number;
  reviewed_at?: string;
  sort_order?: number;
  is_active?: boolean;
}

export const fetchGoogleReviews = async (): Promise<GoogleReview[]> => {
  const res = await api.get('/admin/platform/google-reviews');
  const data = res.data;
  return Array.isArray(data) ? data : [];
};

export const fetchGoogleReview = async (id: number): Promise<GoogleReview> => {
  const all = await fetchGoogleReviews();
  const item = all.find((t) => t.id === Number(id));
  if (!item) throw new Error('Google review not found');
  return item;
};

export const createGoogleReview = async (payload: GoogleReviewPayload): Promise<GoogleReview> => {
  const { data } = await api.post('/admin/platform/google-reviews', payload);
  return data.data;
};

export const updateGoogleReview = async (
  id: number,
  payload: Partial<GoogleReviewPayload>,
): Promise<GoogleReview> => {
  const { data } = await api.put(`/admin/platform/google-reviews/${id}`, payload);
  return data.data;
};

export const deleteGoogleReview = async (id: number): Promise<void> => {
  await api.delete(`/admin/platform/google-reviews/${id}`);
};
