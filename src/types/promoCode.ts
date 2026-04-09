export type CouponDiscountOn = "Membership Only" | "Everything" | "All Courses";

export const COUPON_DISCOUNT_ON_OPTIONS = [
  { value: "Membership Only", label: "Membership Only" },
  { value: "Everything", label: "Everything" },
  { value: "All Courses", label: "All Courses" },
] as const;

export type CouponStatus = "publish" | "draft";
export type CouponType = "Percentage" | "Amount";

export interface Coupon {
  id: number | string;
  wp_post_id?: number | string;
  code: string;
  description?: string;
  type?: CouponType;
  value?: number;
  min_order?: number;
  max_discount?: number;
  discount_on?: CouponDiscountOn;
  start_date?: string;
  expire_date?: string;
  status?: CouponStatus;
  created_at?: string;
}

export interface CouponFormData {
  code: string;
  description: string;
  type: CouponType;
  value: string;
  min_order: string;
  max_discount: string;
  discount_on: CouponDiscountOn;
  start_date: string;
  expire_date: string;
  status: CouponStatus;
}
