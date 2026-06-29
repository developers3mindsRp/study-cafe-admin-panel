import type { FilterFieldDef } from "../../components/filters";
import type { CouponUsageFilters } from "../../api/couponUsage";
import { formatDateTimeLong } from "../../utils/formatDate";

export const usageFilterFields: FilterFieldDef[] = [
  {
    type: "select",
    id: "status",
    label: "Order status",
    placeholder: "All statuses",
    options: [
      { value: "completed", label: "Completed" },
      { value: "paid", label: "Paid" },
      { value: "pending", label: "Pending" },
      { value: "failed", label: "Failed" },
      { value: "refunded", label: "Refunded" },
    ],
  },
  {
    type: "select",
    id: "type",
    label: "Order type",
    placeholder: "All types",
    options: [
      { value: "course", label: "Course" },
      { value: "membership", label: "Membership" },
    ],
  },
  {
    type: "date-range",
    id: "used",
    label: "Used on",
    fromId: "dateFrom",
    toId: "dateTo",
  },
];

export function filtersFromValues(values: Record<string, string | undefined>): CouponUsageFilters {
  return {
    status: values.status ?? "",
    type: values.type ?? "",
    dateFrom: values.dateFrom ?? "",
    dateTo: values.dateTo ?? "",
    couponId: values.couponId ?? "",
  };
}

export function formatMoney(val: string | number | null | undefined, currency = "INR") {
  if (val == null || val === "") return "—";
  const n = Number(val);
  if (!Number.isFinite(n)) return String(val);
  return new Intl.NumberFormat("en-IN", { style: "currency", currency, maximumFractionDigits: 2 }).format(n);
}

export function formatDate(dateStr?: string | null) {
  return formatDateTimeLong(dateStr);
}
