import { api } from "./axios";

export interface NewsletterSubscriber {
    id: number;
    email: string;
    is_verified: boolean;
    created_at?: string;
}

export interface NewsletterTemplate {
    id: number;
    name: string;
    subject: string;
    html_content: string;
    created_at?: string;
    updated_at?: string;
}

export interface SendNewsletterPayload {
    template_id: number;
    custom_subject?: string;
    custom_content?: string;
    send_to: "all" | string[];
}

export interface SendNewsletterResult {
    recipients_count: number;
    sent_count: number;
    failed_count: number;
}

// ── Subscribers ────────────────────────────────────────────────────

export const fetchNewsletterSubscribers = async (): Promise<NewsletterSubscriber[]> => {
    const res = await api.get<NewsletterSubscriber[]>("/admin/platform/newsletter/subscribers");
    return Array.isArray(res.data) ? res.data : [];
};

export const deleteNewsletterSubscriber = async (id: number): Promise<void> => {
    await api.delete(`/admin/platform/newsletter/subscribers/${id}`);
};

// ── Templates ──────────────────────────────────────────────────────

export const fetchNewsletterTemplates = async (): Promise<NewsletterTemplate[]> => {
    const res = await api.get<NewsletterTemplate[]>("/admin/platform/newsletter/templates");
    return Array.isArray(res.data) ? res.data : [];
};

export const createNewsletterTemplate = async (
    payload: Omit<NewsletterTemplate, "id" | "created_at" | "updated_at">
): Promise<NewsletterTemplate> => {
    const res = await api.post<NewsletterTemplate>("/admin/platform/newsletter/templates", payload);
    return res.data;
};

export const updateNewsletterTemplate = async (
    id: number,
    payload: Partial<Omit<NewsletterTemplate, "id">>
): Promise<NewsletterTemplate> => {
    const res = await api.put<NewsletterTemplate>(`/admin/platform/newsletter/templates/${id}`, payload);
    return res.data;
};

export const deleteNewsletterTemplate = async (id: number): Promise<void> => {
    await api.delete(`/admin/platform/newsletter/templates/${id}`);
};

// ── Send ───────────────────────────────────────────────────────────

export const sendNewsletter = async (
    payload: SendNewsletterPayload
): Promise<SendNewsletterResult> => {
    const res = await api.post<SendNewsletterResult>("/admin/platform/newsletter/send", payload);
    return res.data;
};

// ── Sync membership members ────────────────────────────────────────

export interface SyncMembersResult {
    synced_count: number;
    already_subscribed_count: number;
}

export const syncMembershipSubscribers = async (planSlugs: string[]): Promise<SyncMembersResult> => {
    const res = await api.post<SyncMembersResult>("/admin/platform/newsletter/sync-members", {
        plan_slugs: planSlugs,
    });
    return res.data;
};
