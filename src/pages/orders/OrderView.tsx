import { useState, useEffect } from "react";
import { useParams, Link } from "react-router";
import PageMeta from "../../components/common/PageMeta";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import Badge from "../../components/ui/badge/Badge";
import Button from "../../components/ui/button/Button";
import { fetchOrderByOrderId, orderStatusAllowsRefund, type OrderRecord } from "../../api/orders";
import { fetchCourse } from "../../api/courses";
import { plansApi } from "../../api/plans";
import { usersApi } from "../../api/users";
import { PencilIcon, DollarLineIcon } from "../../icons";
import RefundModal from "./RefundModal";
import { orderGatewayLabel } from "../../utils/orderGateway";

function detailStatusBadgeColor(status: string) {
  const s = status.toLowerCase();
  if (s === "paid" || s === "completed") return "success";
  if (s === "pending") return "warning";
  if (s === "refunded") return "info";
  return "error";
}

function normalizeUtm(utm: OrderRecord["utm"] | string | null | undefined): OrderRecord["utm"] | null {
  if (utm == null) return null;
  if (typeof utm === "string") {
    const s = utm.trim();
    if (!s) return null;
    try {
      const o = JSON.parse(s) as Record<string, unknown>;
      if (o && typeof o === "object") return o as OrderRecord["utm"];
    } catch {
      return null;
    }
    return null;
  }
  if (typeof utm === "object") return utm;
  return null;
}

function displayValue(v: string | null | undefined): string {
  const s = v != null ? String(v).trim() : "";
  return s !== "" ? s : "—";
}

/** API/list fallbacks when plan/course title could not be resolved — still fetch real title in UI. */
const GENERIC_ENTITY_LABELS = new Set(["Plan", "Course", "Payment link"]);

export default function OrderView() {
  const { orderId } = useParams<{ orderId: string }>();
  const [order, setOrder] = useState<OrderRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [entityName, setEntityName] = useState<string | null>(null);
  const [userName, setUserName] = useState<string | null>(null);
  const [refundOpen, setRefundOpen] = useState(false);

  const loadOrder = () => {
    if (!orderId) return;
    setLoading(true);
    fetchOrderByOrderId(orderId)
      .then(setOrder)
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadOrder();
  }, [orderId]);

  useEffect(() => {
    if (!order) return;

    const resolved = order.entity_name?.trim() ?? "";
    if (resolved && !GENERIC_ENTITY_LABELS.has(resolved)) {
      setEntityName(resolved);
    } else {
      setEntityName(null);
      if (order.type === "course" && order.entity_id) {
        fetchCourse(order.entity_id)
          .then((res) => {
            if (res) setEntityName(res.title);
          })
          .catch(console.error);
      } else if (order.type === "membership" && order.entity_id) {
        plansApi
          .get(order.entity_id)
          .then((plan) => {
            if (plan) setEntityName(plan.name);
          })
          .catch(console.error);
      }
    }

    if (order.user_id) {
      usersApi
        .get(String(order.user_id))
        .then((u) => {
          if (u) setUserName(`${u.name} (${u.email})`);
        })
        .catch(console.error);
    } else {
      setUserName(null);
    }
  }, [order]);

  if (loading || !order) {
    return (
      <div className="flex items-center justify-center py-12">
        {loading ? "Loading..." : "Order not found."}
      </div>
    );
  }

  const statusColor = detailStatusBadgeColor(order.status);
  const utm = normalizeUtm(order.utm);
  const hasUtm =
    !!utm &&
    Boolean(utm.source || utm.medium || utm.campaign || utm.content || utm.term);
  const orderType = (order.type || "").toLowerCase();
  const itemLabel =
    orderType === "course"
      ? "Course name"
      : orderType === "membership"
        ? "Membership plan"
        : orderType === "payment_link"
          ? "Payment link"
          : "Item";
  const resolvedEntityTitle =
    entityName || order.entity_name || (order.entity_id ? `ID: ${order.entity_id}` : "—");

  const showRefundDetails =
    order.status?.toLowerCase() === "refunded" ||
    (order.refund_remarks != null && String(order.refund_remarks).trim() !== "") ||
    (order.refund_amount != null && String(order.refund_amount).trim() !== "");

  return (
    <>
      <PageMeta title={`Order ${order.order_id} | StudyCafe Admin`} description="Order details" />
      <PageBreadcrumb
        pageTitle={order.order_id}
        items={[{ label: "Orders", path: "/orders" }]}
        actions={
          <div className="flex flex-wrap gap-3">
            {orderStatusAllowsRefund(order.status) && (
              <Button
                variant="outline"
                className="border-error-200 text-error-600 hover:bg-error-50 dark:border-error-900 dark:text-error-400 dark:hover:bg-error-950/30"
                startIcon={<DollarLineIcon className="h-4 w-4" />}
                onClick={() => setRefundOpen(true)}
              >
                Refund
              </Button>
            )}
            <Link to={`/orders/${orderId}/edit`}>
              <Button
                variant="outline"
                startIcon={<PencilIcon className="h-4 w-4" />}
              >
                Edit Order
              </Button>
            </Link>
            <Link
              to="/orders"
              className="inline-flex items-center justify-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700"
            >
              Back to list
            </Link>
          </div>
        }
      />
      <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Details Card */}
        <div className="lg:col-span-2 space-y-6">
          <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-white/[0.03]">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">Order Information</h3>
              <Badge size="md" color={statusColor}>
                {order.status}
              </Badge>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
              <div className="space-y-1">
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Transaction ID</p>
                <p className="font-mono text-sm font-semibold text-gray-900 dark:text-white">{order.order_id}</p>
              </div>
              <div className="space-y-1">
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Order Type</p>
                <p className="text-sm font-semibold text-gray-900 dark:text-white capitalize">{order.type}</p>
              </div>
              <div className="space-y-1 md:col-span-2">
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">{itemLabel}</p>
                <p className="text-sm font-semibold">
                  {order.entity_id ? (
                    orderType === "course" || orderType === "membership" ? (
                      <Link
                        to={
                          orderType === "course"
                            ? `/courses/${order.entity_id}`
                            : `/memberships/${order.entity_id}`
                        }
                        className="text-brand-500 hover:text-brand-600 underline"
                      >
                        {resolvedEntityTitle}
                      </Link>
                    ) : (
                      <span className="text-gray-900 dark:text-white">{resolvedEntityTitle}</span>
                    )
                  ) : (
                    "—"
                  )}
                </p>
              </div>
              <div className="space-y-1">
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Date Created</p>
                <p className="text-sm font-semibold text-gray-900 dark:text-white">
                  {order.created_at ? new Date(order.created_at).toLocaleString('en-IN', {
                    day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit'
                  }) : "—"}
                </p>
              </div>
              <div className="space-y-1">
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Payment Method</p>
                <p className="text-sm font-semibold text-gray-900 dark:text-white">
                  {orderGatewayLabel(order.gateway)}
                </p>
              </div>
              <div className="space-y-1 md:col-span-2">
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Payment ID (gateway / Razorpay)
                </p>
                <p className="break-all font-mono text-xs font-semibold text-gray-900 dark:text-white">
                  {displayValue(order.payment_id ?? undefined)}
                </p>
              </div>
            </div>

            {showRefundDetails && (
              <div className="mt-8 border-t border-gray-200 pt-6 dark:border-gray-700">
                <h4 className="mb-3 text-sm font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                  Refund details
                </h4>
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  {order.refund_amount != null && String(order.refund_amount).trim() !== "" && (
                    <div className="space-y-1">
                      <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Refund amount</p>
                      <p className="text-sm font-semibold text-gray-900 dark:text-white">
                        {order.currency} {Number(order.refund_amount).toFixed(2)}
                      </p>
                    </div>
                  )}
                  {order.refund_remarks != null && String(order.refund_remarks).trim() !== "" && (
                    <div className="space-y-1 md:col-span-2">
                      <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Refund remarks</p>
                      <p className="whitespace-pre-wrap rounded-lg border border-gray-100 bg-gray-50 px-4 py-3 text-sm text-gray-800 dark:border-gray-700 dark:bg-gray-900/40 dark:text-gray-200">
                        {order.refund_remarks}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-white/[0.03]">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-6">User & Buyer Details</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
              <div className="space-y-1">
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Assigned User</p>
                <p className="text-sm font-semibold">
                  {order.user_id ? (
                    <Link to={`/users/${order.user_id}`} className="text-brand-500 hover:text-brand-600 underline">
                      {userName || `User ID: ${order.user_id}`}
                    </Link>
                  ) : (
                    "Guest checkout"
                  )}
                </p>
              </div>
              <div className="space-y-1">
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Name</p>
                <p className="text-sm font-semibold text-gray-900 dark:text-white">
                  {displayValue(order.buyer_name ?? undefined)}
                </p>
              </div>
              <div className="space-y-1">
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Email</p>
                <p className="break-all text-sm font-semibold text-gray-900 dark:text-white">
                  {displayValue(order.buyer_email ?? undefined)}
                </p>
              </div>
              <div className="space-y-1">
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Phone</p>
                <p className="text-sm font-semibold text-gray-900 dark:text-white">
                  {displayValue(order.buyer_mobile ?? undefined)}
                </p>
              </div>
              {order.buyer_gst && (
                <div className="space-y-1">
                  <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">GST Number</p>
                  <p className="text-sm font-semibold text-gray-900 dark:text-white">{order.buyer_gst}</p>
                </div>
              )}
              {order.affiliate && (
                <div className="space-y-1">
                  <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Affiliate / Referral</p>
                  <p className="text-sm font-semibold text-brand-600">{order.affiliate}</p>
                </div>
              )}
            </div>
          </div>

          <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-white/[0.03]">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-6">UTM (marketing)</h3>
            {hasUtm ? (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3">
                <div className="space-y-1">
                  <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Source</p>
                  <p className="text-sm text-gray-900 dark:text-white">{displayValue(utm?.source)}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Medium</p>
                  <p className="text-sm text-gray-900 dark:text-white">{displayValue(utm?.medium)}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Campaign</p>
                  <p className="text-sm text-gray-900 dark:text-white">{displayValue(utm?.campaign)}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Content</p>
                  <p className="text-sm text-gray-900 dark:text-white">{displayValue(utm?.content)}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Term</p>
                  <p className="text-sm text-gray-900 dark:text-white">{displayValue(utm?.term)}</p>
                </div>
              </div>
            ) : (
              <p className="text-sm text-gray-500 dark:text-gray-400">No UTM data recorded for this order.</p>
            )}
          </div>
        </div>

        {/* Price Breakdown Sidebar */}
        <div className="lg:col-span-1">
          <div className="rounded-2xl border border-gray-200 bg-gray-50 p-6 shadow-sm dark:border-gray-800 dark:bg-white/[0.03] sticky top-24">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-6">Payment Summary</h3>
            
            <div className="space-y-4">
              <div className="flex justify-between items-center text-sm">
                <span className="text-gray-500">Subtotal</span>
                <span className="font-semibold text-gray-900 dark:text-white">
                  {order.currency} {(Number(order.amount) / 1.18 + Number(order.coupon_discount || 0)).toFixed(2)}
                </span>
              </div>

              {order.coupon_code && (
                <div className="flex justify-between items-center text-sm">
                  <div className="flex flex-col">
                    <span className="text-gray-500">Discount</span>
                    <span className="text-[10px] text-success-600 font-medium font-mono">{order.coupon_code}</span>
                  </div>
                  <span className="font-semibold text-success-600">
                    -{order.currency} {Number(order.coupon_discount || 0).toFixed(2)}
                  </span>
                </div>
              )}

              <div className="flex justify-between items-center text-sm">
                <span className="text-gray-500">Taxable Amount</span>
                <span className="font-semibold text-gray-900 dark:text-white">
                  {order.currency} {(Number(order.amount) / 1.18).toFixed(2)}
                </span>
              </div>

              <div className="border-t border-gray-200 dark:border-gray-700 my-2"></div>

              <div className="flex justify-between items-center text-sm">
                <span className="text-gray-500">GST (18%)</span>
                <span className="font-semibold text-gray-900 dark:text-white">
                  {order.currency} {(Number(order.amount) * 0.18 / 1.18).toFixed(2)}
                </span>
              </div>

              <div className="border-t-2 border-dashed border-gray-200 dark:border-gray-700 my-4"></div>

              <div className="flex justify-between items-center">
                <span className="text-base font-bold text-gray-900 dark:text-white">Total Paid</span>
                <span className="text-xl font-black text-brand-600 dark:text-brand-400">
                  {order.currency} {Number(order.amount).toFixed(2)}
                </span>
              </div>

              <div className="mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
                <div className="flex items-center gap-3 p-3 bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700">
                  <div
                    className={`h-3 w-3 rounded-full ${
                      order.status?.toLowerCase() === "paid" || order.status?.toLowerCase() === "completed"
                        ? "bg-success-500"
                        : order.status?.toLowerCase() === "refunded"
                          ? "bg-gray-400"
                          : "bg-warning-500 animate-pulse"
                    }`}
                  />
                  <span className="text-xs font-medium text-gray-600 dark:text-gray-300 capitalize">
                    Payment {order.status}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      </div>

      <RefundModal
        order={order}
        isOpen={refundOpen}
        onClose={() => setRefundOpen(false)}
        onSuccess={loadOrder}
      />
    </>
  );
}
