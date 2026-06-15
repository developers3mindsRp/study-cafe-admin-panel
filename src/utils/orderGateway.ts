export type OrderPaymentGateway = "razorpay" | "admin";

/** Map stored gateway value to admin form value. */
export function normalizeOrderGateway(gateway?: string | null): OrderPaymentGateway {
  const g = (gateway || "").toLowerCase().trim();
  if (g === "razorpay") return "razorpay";
  return "admin";
}

/** Human-readable label for admin UI and exports. */
export function orderGatewayLabel(gateway?: string | null): string {
  const g = (gateway || "").toLowerCase().trim();
  if (g === "free") return "Free";
  if (g === "razorpay") return "Razorpay";
  if (g === "admin" || g === "manual") return "Admin";
  if (!g) return "—";
  return g.charAt(0).toUpperCase() + g.slice(1);
}
