import { createCrudApi } from "./apiFactory";
import { api } from "./axios";

export interface MembershipFeatures {
    mrp: number;
    included: string[];
    excluded: string[];
}

export interface Plan {
    id: number;
    name: string;
    slug: string;
    description: string;
    price: string | number;
    currency: string;
    duration_days: number;
    is_lifetime?: boolean;
    features: MembershipFeatures | string[];
    sort_order: number;
    is_active: boolean;
    is_popular?: boolean;
    course_ids?: number[];
    course_cat_ids?: number[];
    /** Percent of order amount for affiliate commission (0–100). */
    affiliate_commission?: number | string;
    created_at?: string;
    updated_at?: string;
}

export interface ComparisonFeature {
    id: number;
    name: string;
    sort_order: number;
    created_at?: string;
    updated_at?: string;
}

// Re-export ListQuery from factory for convenience
export type { ListQuery as ListParams } from "./apiFactory";
export type { PaginatedResponse } from "./apiFactory";

// Base path for admin-accessible platform plans
const BASE_URL = '/admin/platform/plans';
const CF_BASE = '/admin/platform/comparison-features';

export const plansApi = createCrudApi<Plan>(BASE_URL)({
    async togglePopular(id: number, is_popular: boolean): Promise<Plan> {
        const { data } = await api.put<Plan>(`${BASE_URL}/${id}/popular`, { is_popular });
        return data;
    },
});

export const comparisonFeaturesApi = {
    async list(): Promise<ComparisonFeature[]> {
        const { data } = await api.get<ComparisonFeature[]>(CF_BASE);
        return data;
    },
    async create(payload: { name: string; sort_order?: number }): Promise<ComparisonFeature> {
        const { data } = await api.post<ComparisonFeature>(CF_BASE, payload);
        return data;
    },
    async update(id: number, payload: { name?: string; sort_order?: number }): Promise<ComparisonFeature> {
        const { data } = await api.put<ComparisonFeature>(`${CF_BASE}/${id}`, payload);
        return data;
    },
    async delete(id: number): Promise<void> {
        await api.delete(`${CF_BASE}/${id}`);
    },
    async setAvailability(featureId: number, planId: number, available: boolean): Promise<void> {
        await api.put(`${CF_BASE}/${featureId}/availability/${planId}`, { available });
    },
};
