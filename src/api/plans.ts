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

export interface UpgradeSummaryCurrentPlan {
    id: number | null;
    name: string;
    slug: string;
    price: number;
    /** Days used for pro-rate (capped at plan duration). */
    remainingDays: number;
    /** Present when calendar time left exceeds one plan period (e.g. far-future expiry). */
    remainingCalendarDays?: number;
    remainingAmount: number;
}

export interface UpgradeSummaryTargetPlan {
    id: number;
    name: string;
    price: number;
}

export interface UpgradeSummaryPricing {
    targetAmount: number;
    deductAmount: number;
    couponDiscount: number;
    finalAmount: number;
    gstAmount: number;
    grandTotal: number;
}

export interface UpgradeSummaryCoupon {
    code: string;
    discountAmount: number;
}

export interface UpgradeSummaryResponse {
    canUpgrade: boolean;
    message?: string;
    currentPlan: UpgradeSummaryCurrentPlan | null;
    targetPlan: UpgradeSummaryTargetPlan;
    coupon: UpgradeSummaryCoupon | null;
    pricing: UpgradeSummaryPricing;
}

export interface CreateOrderResponse {
    orderId: string;
    free: boolean;
    paid: boolean;
    razorpayOrderId: string | null;
    amount: number;
    originalAmount: number;
    upgradeAdjustment: number;
    adjustedMembershipAmount: number;
    discountAmount: number;
    gstAmount: number;
    grandTotal: number;
    currency: string;
    key: string | null;
    prefill: { name: string; email: string; contact: string };
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

export async function fetchUpgradeSummary(
    targetPlanId: number,
    couponCode?: string
): Promise<UpgradeSummaryResponse> {
    const res = await api.post<{ success: boolean; data: UpgradeSummaryResponse }>(
        '/platform/membership/upgrade-summary',
        { targetPlanId, ...(couponCode?.trim() ? { couponCode: couponCode.trim() } : {}) }
    );
    return res.data.data ?? (res.data as unknown as UpgradeSummaryResponse);
}

export async function createMembershipOrder(
    entityId: number,
    couponCode?: string
): Promise<CreateOrderResponse> {
    const res = await api.post<{ success: boolean; data: CreateOrderResponse }>('/orders/create', {
        type: 'MEMBERSHIP',
        entityId,
        couponCode: couponCode || undefined,
    });
    return res.data.data ?? (res.data as unknown as CreateOrderResponse);
}

export interface BulkMembershipResult {
  email: string;
  status: "granted" | "user_not_found" | "error";
  message?: string;
}

export async function bulkGrantMembershipByEmails(payload: {
  emails: string[];
  membershipType: string;
  startsAt: string;
  expiresAt: string;
}): Promise<BulkMembershipResult[]> {
  const res = await api.post<BulkMembershipResult[]>("/admin/memberships/bulk", payload);
  return Array.isArray(res.data) ? res.data : [];
}

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
