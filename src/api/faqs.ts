import { api } from "./axios";

export interface Faq {
    id: number;
    question: string;
    answer: string;
    sort_order: number;
    is_active?: boolean;
    created_at?: string;
}

export const fetchFaqs = async (): Promise<Faq[]> => {
    const res = await api.get<Faq[]>("/admin/platform/faqs");
    const data = res.data;
    return Array.isArray(data) ? data : [];
};

export const fetchFaq = async (id: number): Promise<Faq> => {
    const res = await api.get<Faq>(`/admin/platform/faqs/${id}`);
    return res.data;
};

export const createFaq = async (
    payload: Omit<Faq, "id">
): Promise<Faq> => {
    const res = await api.post<Faq>("/admin/platform/faqs", payload);
    return res.data;
};

export const updateFaq = async (
    id: number,
    payload: Partial<Omit<Faq, "id">>
): Promise<Faq> => {
    const res = await api.put<Faq>(`/admin/platform/faqs/${id}`, payload);
    return res.data;
};

export const deleteFaq = async (id: number): Promise<void> => {
    await api.delete(`/admin/platform/faqs/${id}`);
};
