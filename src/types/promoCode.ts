export type PromoCodeTargetType = "membership_plans" | "courses";

export const PROMO_CODE_TARGET_TYPES = [
  { value: "membership_plans", label: "Membership Plans" },
  { value: "courses", label: "Courses" },
] as const;

export interface PromoCode {
  id: number | string;
  code: string;
  description?: string;
  discount_type?: "percentage" | "fixed";
  discount_value?: number;
  max_discount_amount?: number;
  min_cart_value?: number;
  target_type?: PromoCodeTargetType;
  active?: boolean;
  valid_from?: string;
  valid_to?: string;
  usage_limit?: number;
  used_count?: number;
  created_at?: string;
  updated_at?: string;
}

export interface PromoCodeFormData {
  code: string;
  description: string;
  discount_type: "percentage" | "fixed";
  discount_value: string;
  max_discount_amount: string;
  min_cart_value: string;
  target_type: PromoCodeTargetType;
  active: boolean;
  valid_from: string;
  valid_to: string;
  usage_limit: string;
}
