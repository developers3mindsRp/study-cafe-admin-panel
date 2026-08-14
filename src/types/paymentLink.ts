export type PaymentLinkStatus = "publish" | "draft";

/** What a paid checkout on the link grants. "custom" = money only, assigned by hand. */
export type PaymentLinkProductType = "custom" | "course" | "membership";

/** Resolved display block for the linked course/plan, attached by the API. */
export interface PaymentLinkProduct {
  type: Exclude<PaymentLinkProductType, "custom">;
  id: string;
  name: string | null;
  slug: string | null;
  /** Courses only. */
  thumbnail_url: string | null;
  auto_enroll: boolean;
}

export interface PaymentLink {
  id: number | string;
  title: string;
  slug: string;
  description: string | null;
  amount: number | string;
  sale_price: number | string;
  expiry: string;
  total_seats: number;
  /** Mirror of paid_orders_count in API responses (paid payment-link orders). */
  seats_booked: number;
  paid_orders_count?: number;
  random_value: string | null;
  /** Persisted incremental boost accumulator. Admin can set the initial start value. */
  random_boost_accumulator?: number;
  status: PaymentLinkStatus | string;
  product_type?: PaymentLinkProductType;
  /** Course id or membership plan id, per product_type. */
  product_id?: string | null;
  /** Course links only; null means the purchase batch is picked at checkout. */
  batch_id?: number | null;
  auto_enroll?: boolean;
  /** Resolved name/thumbnail for product_id; null for money-only links. */
  product?: PaymentLinkProduct | null;
  created_at?: string;
  updated_at?: string;
}

export interface PaymentLinkFormValues {
  title: string;
  slug: string;
  description: string;
  amount: string;
  sale_price: string;
  expiry: string;
  total_seats: string;
  random_value: string;
  /** Initial/current start value for the random boost accumulator. */
  random_boost_accumulator: string;
  status: PaymentLinkStatus;
  product_type: PaymentLinkProductType;
  /** Course/plan id as a string; "" when product_type is "custom". */
  product_id: string;
  /** Course links only; "" means auto-select the purchase batch. */
  batch_id: string;
  auto_enroll: boolean;
}
