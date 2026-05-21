import api from './axios';

export interface Testimonial {
  id: number;
  title?: string | null;
  media_type: 'video' | 'image';
  media_url: string;
  video_url?: string | null;
  sort_order: number;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface TestimonialPayload {
  title?: string;
  media_type: 'video' | 'image';
  media_url: string;
  video_url?: string;
  sort_order?: number;
  is_active?: boolean;
}

export const fetchTestimonials = async (): Promise<Testimonial[]> => {
  const res = await api.get('/admin/platform/testimonials');
  const data = res.data;
  return Array.isArray(data) ? data : [];
};

export const fetchTestimonial = async (id: number): Promise<Testimonial> => {
  const all = await fetchTestimonials();
  const item = all.find((t) => t.id === Number(id));
  if (!item) throw new Error('Testimonial not found');
  return item;
};

export const createTestimonial = async (payload: TestimonialPayload): Promise<Testimonial> => {
  const { data } = await api.post('/admin/platform/testimonials', payload);
  return data.data;
};

export const updateTestimonial = async (
  id: number,
  payload: Partial<TestimonialPayload>,
): Promise<Testimonial> => {
  const { data } = await api.put(`/admin/platform/testimonials/${id}`, payload);
  return data.data;
};

export const deleteTestimonial = async (id: number): Promise<void> => {
  await api.delete(`/admin/platform/testimonials/${id}`);
};
