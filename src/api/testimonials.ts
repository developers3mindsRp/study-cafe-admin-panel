import api from './axios';

export interface Testimonial {
    id: number;
    author_name: string;
    author_role: string;
    content: string;
    avatar_url?: string;
    rating?: number;
    is_featured: boolean;
    sort_order: number;
    is_active: boolean;
    created_at?: string;
}

export interface TestimonialPayload {
    author_name: string;
    author_role?: string;
    content: string;
    avatar_url?: string;
    rating?: number;
    is_featured?: boolean;
    sort_order?: number;
    is_active?: boolean;
}

export const fetchTestimonials = async (): Promise<Testimonial[]> => {
    const res = await api.get('/admin/platform/testimonials');
    const data = res.data;
    return Array.isArray(data) ? data : [];
};

export const fetchTestimonial = async (id: number): Promise<Testimonial> => {
    // the backend currently doesn't have a GET by id route for testimonials in admin,
    // we can fetch all and find, or just rely on passing data around (if that's acceptable)
    // Let's implement a fetch all and find for now, or if it has an internal one we can use.
    // Actually, checking admin routes, it seems only getTestimonials is defined.
    // We will get all and find.
    const all = await fetchTestimonials();
    const testimonial = all.find(t => t.id === Number(id));
    if (!testimonial) throw new Error('Testimonial not found');
    return testimonial;
};

export const createTestimonial = async (payload: TestimonialPayload): Promise<Testimonial> => {
    const { data } = await api.post('/admin/platform/testimonials', payload);
    return data.data;
};

export const updateTestimonial = async (id: number, payload: Partial<TestimonialPayload>): Promise<Testimonial> => {
    const { data } = await api.put(`/admin/platform/testimonials/${id}`, payload);
    return data.data;
};

export const deleteTestimonial = async (id: number): Promise<void> => {
    await api.delete(`/admin/platform/testimonials/${id}`);
};
