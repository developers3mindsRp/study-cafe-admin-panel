import { api } from "./axios";

export interface SEOMetadata {
    id: number;
    pageName: string;
    pageSlug: string;
    metaTitle: string;
    metaDescription: string;
    metaKeywords: string;
    canonicalUrl: string;
    ogTitle: string;
    ogDescription: string;
    ogImageUrl: string;
    robots: string;
    created_at?: string;
}

const mapBackendToFrontend = (data: any): SEOMetadata => ({
    id: data.id,
    pageName: data.page_name,
    pageSlug: data.page_slug,
    metaTitle: data.meta_title,
    metaDescription: data.meta_description || "",
    metaKeywords: data.meta_keywords || "",
    canonicalUrl: data.canonical_url || "",
    ogTitle: data.og_title || "",
    ogDescription: data.og_description || "",
    ogImageUrl: data.og_image_url || "",
    robots: data.robots || "index, follow",
    created_at: data.created_at,
});

const mapFrontendToBackend = (data: Partial<Omit<SEOMetadata, "id">>) => ({
    page_name: data.pageName,
    page_slug: data.pageSlug,
    meta_title: data.metaTitle,
    meta_description: data.metaDescription,
    meta_keywords: data.metaKeywords,
    canonical_url: data.canonicalUrl,
    og_title: data.ogTitle,
    og_description: data.ogDescription,
    og_image_url: data.ogImageUrl,
    robots: data.robots,
});

export const fetchSeoMetadata = async (): Promise<SEOMetadata[]> => {
    const { data } = await api.get("/admin/platform/seo-metadata");
    const rows = Array.isArray(data)
        ? data
        : Array.isArray(data?.data)
            ? data.data
            : [];
    return rows.map(mapBackendToFrontend);
};

export const fetchSeoMetadataById = async (id: number): Promise<SEOMetadata> => {
    const { data } = await api.get(`/admin/platform/seo-metadata/${id}`);
    return mapBackendToFrontend(data?.data ?? data);
};

export const createSeoMetadata = async (
    payload: Omit<SEOMetadata, "id">
): Promise<SEOMetadata> => {
    const { data } = await api.post(
        "/admin/platform/seo-metadata",
        mapFrontendToBackend(payload)
    );
    return mapBackendToFrontend(data?.data ?? data);
};

export const updateSeoMetadata = async (
    id: number,
    payload: Partial<Omit<SEOMetadata, "id">>
): Promise<SEOMetadata> => {
    const { data } = await api.put(
        `/admin/platform/seo-metadata/${id}`,
        mapFrontendToBackend(payload)
    );
    return mapBackendToFrontend(data?.data ?? data);
};

export const deleteSeoMetadata = async (id: number): Promise<void> => {
    await api.delete(`/admin/platform/seo-metadata/${id}`);
};
