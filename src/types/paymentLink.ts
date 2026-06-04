export type PaymentLinkStatus = "publish" | "draft";

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
}
