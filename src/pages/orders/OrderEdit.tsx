import React, { useState, useEffect, useMemo, useRef } from "react";
import { useNavigate, useParams } from "react-router";
import PageMeta from "../../components/common/PageMeta";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import Button from "../../components/ui/button/Button";
import Input from "../../components/form/input/InputField";
import Label from "../../components/form/Label";
import {
  fetchOrderByOrderId,
  updateOrder,
  applyCouponAdmin,
  type UpdateOrderPayload,
  type OrderRecord,
} from "../../api/orders";
import { fetchCourses, type Course } from "../../api/courses";
import { plansApi, type Plan } from "../../api/plans";
import { usersApi } from "../../api/users";
import AsyncSelect from "react-select/async";
import type { CSSObjectWithLabel } from "react-select";
import { CloseLineIcon } from "../../icons";

function statusLabel(s: string) {
  const x = (s || "").toLowerCase();
  if (x === "payment_link") return "Payment link";
  return x || "—";
}

function listPriceForCourse(c: Course): number | null {
  const sale = c.sale_price;
  if (sale != null && sale !== "" && Number(sale) > 0) {
    const n = Number(sale);
    return Number.isFinite(n) ? n : null;
  }
  const p = Number(c.price);
  return Number.isFinite(p) ? p : null;
}

function listPriceForPlan(p: Plan): number | null {
  const n = Number(p.price);
  return Number.isFinite(n) ? n : null;
}

export default function OrderEdit() {
  const navigate = useNavigate();
  const { orderId } = useParams<{ orderId: string }>();
  const [loading, setLoading] = useState(false);
  const [order, setOrder] = useState<OrderRecord | null>(null);
  const originalRef = useRef<OrderRecord | null>(null);

  const [formData, setFormData] = useState<UpdateOrderPayload>({
    status: "pending",
    affiliate: "",
    amount: 0,
    refund_amount: "",
    refund_remarks: "",
  });

  const [selectedEntityId, setSelectedEntityId] = useState("");
  const [batchIdInput, setBatchIdInput] = useState("");

  const [courses, setCourses] = useState<Course[]>([]);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [initialUserLabel, setInitialUserLabel] = useState<string>("");
  const [couponCodeInput, setCouponCodeInput] = useState("");
  const [appliedCouponPreview, setAppliedCouponPreview] = useState<{
    amount: number;
    discount: number;
    coupon: { code: string };
  } | null>(null);
  const [couponApplying, setCouponApplying] = useState(false);

  useEffect(() => {
    fetchCourses().then(setCourses).catch(console.error);
    plansApi.list({ limit: 500 }).then((res) => setPlans(res.data || [])).catch(console.error);
  }, []);

  useEffect(() => {
    if (!orderId) return;
    fetchOrderByOrderId(orderId).then((data) => {
      if (!data) return;
      setOrder(data);
      originalRef.current = data;
      setSelectedEntityId(data.entity_id != null ? String(data.entity_id) : "");
      setBatchIdInput(data.batch_id != null ? String(data.batch_id) : "");
      setFormData({
        status: (data.status || "pending") as UpdateOrderPayload["status"],
        affiliate: data.affiliate || "",
        amount: data.amount ?? 0,
        refund_amount:
          data.refund_amount != null && data.refund_amount !== ""
            ? String(data.refund_amount)
            : "",
        refund_remarks: data.refund_remarks || "",
      });
      setCouponCodeInput(data.coupon_code || "");
      setAppliedCouponPreview(null);

      if (data.user_id) {
        usersApi
          .get(String(data.user_id))
          .then((u) => {
            if (u) setInitialUserLabel(`${u.name} (${u.email})`);
          })
          .catch(() => {});
      }
    });
  }, [orderId]);

  const orderType = (order?.type || "").toLowerCase();
  const canEditEntity = orderType === "course" || orderType === "membership";

  const entityChanged = useMemo(() => {
    if (!order || !canEditEntity) return false;
    const orig = originalRef.current?.entity_id != null ? String(originalRef.current.entity_id) : "";
    return selectedEntityId !== orig;
  }, [order, canEditEntity, selectedEntityId]);

  const wasFulfilled = useMemo(() => {
    const s = (originalRef.current?.status || "").toLowerCase();
    return s === "paid" || s === "completed";
  }, [order]);

  /** Refund inputs only when the order is refunded and the status field still says Refunded. */
  const showRefundFields = useMemo(() => {
    const formSt = (formData.status || "").toLowerCase();
    const savedSt = (order?.status || "").toLowerCase();
    return formSt === "refunded" && savedSt === "refunded";
  }, [formData.status, order?.status]);

  const catalogFromSelection = useMemo(() => {
    if (!selectedEntityId) return null;
    const ot = (order?.type || "").toLowerCase();
    if (ot === "course") {
      const c = courses.find((x) => String(x.id) === selectedEntityId);
      return c ? listPriceForCourse(c) : null;
    }
    if (ot === "membership") {
      const p = plans.find((x) => String(x.id) === selectedEntityId);
      return p ? listPriceForPlan(p) : null;
    }
    return null;
  }, [order?.type, selectedEntityId, courses, plans]);

  const originalListPriceForDisplay = useMemo(() => {
    if (appliedCouponPreview) return appliedCouponPreview.amount;
    if (order?.original_amount != null && order.original_amount !== "")
      return Number(order.original_amount);
    return catalogFromSelection;
  }, [appliedCouponPreview, order?.original_amount, catalogFromSelection]);

  const discountAmountDisplay = useMemo(() => {
    if (appliedCouponPreview) return appliedCouponPreview.discount;
    return Number(order?.coupon_discount || 0);
  }, [appliedCouponPreview, order?.coupon_discount]);

  const couponCodeDisplay = useMemo(() => {
    if (appliedCouponPreview?.coupon?.code) return appliedCouponPreview.coupon.code;
    if (order?.coupon_code) return order.coupon_code;
    return couponCodeInput.trim();
  }, [appliedCouponPreview, order?.coupon_code, couponCodeInput]);

  const handleChange = (field: keyof UpdateOrderPayload, value: string | number) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleEntitySelectChange = (nextId: string) => {
    setSelectedEntityId(nextId);
    setAppliedCouponPreview(null);
    if (!nextId) return;
    const ot = (order?.type || "").toLowerCase();
    if (ot === "course") {
      const c = courses.find((x) => String(x.id) === nextId);
      if (c) {
        const amt = listPriceForCourse(c);
        if (amt != null) setFormData((prev) => ({ ...prev, amount: amt }));
      }
    } else if (ot === "membership") {
      const p = plans.find((x) => String(x.id) === nextId);
      if (p) {
        const amt = listPriceForPlan(p);
        if (amt != null) setFormData((prev) => ({ ...prev, amount: amt }));
      }
    }
  };

  const handleApplyCoupon = async () => {
    if (!couponCodeInput.trim()) {
      alert("Enter a coupon code.");
      return;
    }
    if (!selectedEntityId) {
      alert("Select a course or membership plan first.");
      return;
    }
    if (!order?.user_id) {
      alert("This order has no linked user; coupon limits cannot be validated.");
      return;
    }
    const ot = (order?.type || "").toLowerCase();
    if (ot !== "course" && ot !== "membership") {
      alert("Coupons apply only to course or membership orders.");
      return;
    }
    setCouponApplying(true);
    try {
      const res = (await applyCouponAdmin({
        couponCode: couponCodeInput.trim(),
        type: ot === "course" ? "COURSE" : "MEMBERSHIP",
        id: selectedEntityId,
        userId: order.user_id,
      })) as {
        amount: number;
        discount?: number;
        coupon?: { code: string };
      };
      const discount = Number(res.discount ?? 0);
      setAppliedCouponPreview({
        amount: Number(res.amount),
        discount,
        coupon: { code: res.coupon?.code ?? couponCodeInput.trim().toUpperCase() },
      });
      const taxable = Math.max(0, Number(res.amount) - discount);
      const gst = Number((taxable * 0.18).toFixed(2));
      const grandTotal = Number((taxable + gst).toFixed(2));
      setFormData((prev) => ({ ...prev, amount: grandTotal }));
    } catch (error: unknown) {
      const msg =
        error && typeof error === "object" && "response" in error
          ? (error as { response?: { data?: { message?: string } } }).response?.data?.message
          : undefined;
      alert(msg || "Could not apply coupon.");
      setAppliedCouponPreview(null);
    } finally {
      setCouponApplying(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!order) return;

    if (entityChanged && wasFulfilled) {
      const ok = window.confirm(
        "This order was already paid or completed. Changing the course or plan will remove access for the original item and grant access for the newly selected one. Continue?",
      );
      if (!ok) return;
    }

    if (formData.status === "refunded" && (originalRef.current?.status || "").toLowerCase() !== "refunded") {
      const ok = window.confirm(
        "Marking as refunded will revoke course/membership access for this order. Continue?",
      );
      if (!ok) return;
    }

    setLoading(true);
    try {
      const payload: UpdateOrderPayload = {
        ...formData,
        amount: Number(formData.amount),
        affiliate: formData.affiliate || undefined,
      };

      if (canEditEntity && selectedEntityId) {
        payload.entity_id = selectedEntityId;
      }

      if (orderType === "course") {
        if (batchIdInput.trim() !== "") {
          payload.batch_id = Number(batchIdInput);
        } else if (entityChanged) {
          payload.batch_id = undefined;
        }
      }

      if (showRefundFields) {
        if (formData.refund_amount !== "" && formData.refund_amount != null) {
          payload.refund_amount = Number(formData.refund_amount);
        } else {
          payload.refund_amount = undefined;
        }
        if (formData.refund_remarks) {
          payload.refund_remarks = formData.refund_remarks;
        } else {
          payload.refund_remarks = undefined;
        }
      } else {
        payload.refund_amount = undefined;
        payload.refund_remarks = undefined;
      }

      if (appliedCouponPreview) {
        payload.coupon_code = appliedCouponPreview.coupon.code;
        payload.coupon_discount = appliedCouponPreview.discount;
        payload.original_amount = appliedCouponPreview.amount;
      } else if (
        !couponCodeInput.trim() &&
        (originalRef.current?.coupon_code || Number(originalRef.current?.coupon_discount || 0) > 0)
      ) {
        payload.coupon_code = null;
        payload.coupon_discount = 0;
        payload.original_amount = null;
      }

      await updateOrder(order.id, payload);
      alert("Order updated successfully!");
      navigate(`/orders/${orderId}`);
    } catch (error: unknown) {
      const msg =
        error && typeof error === "object" && "response" in error
          ? (error as { response?: { data?: { message?: string } } }).response?.data?.message
          : undefined;
      alert(msg || "Failed to update order");
      setLoading(false);
    }
  };

  if (!order) return <div className="p-6">Loading order...</div>;

  const courseOptions =
    orderType === "course"
      ? courses.map((c) => (
          <option key={c.id} value={String(c.id)}>
            {c.title}
          </option>
        ))
      : null;

  const planOptions =
    orderType === "membership"
      ? plans.map((p) => (
          <option key={p.id} value={String(p.id)}>
            {p.name}
          </option>
        ))
      : null;

  return (
    <>
      <PageMeta title={`Edit Order ${orderId} | StudyCafe Admin`} description="Edit order" />
      <PageBreadcrumb
        pageTitle="Edit Order"
        items={[
          { label: "Orders", path: "/orders" },
          { label: String(orderId), path: `/orders/${orderId}` },
        ]}
      />

      <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] sm:p-6">
        <h2 className="mb-4 text-xl font-semibold text-gray-800 dark:text-white/90">
          Edit Order: {orderId}
        </h2>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            <div>
              <Label>User</Label>
              <AsyncSelect
                isDisabled
                value={
                  order.user_id
                    ? {
                        value: String(order.user_id),
                        label: initialUserLabel || `User ID: ${order.user_id}`,
                      }
                    : null
                }
                className="text-sm text-gray-800 dark:text-gray-200"
                styles={{
                  control: (base: CSSObjectWithLabel) => ({
                    ...base,
                    minHeight: "44px",
                    borderRadius: "0.5rem",
                    borderColor: "rgb(209 213 219)",
                    boxShadow: "none",
                    backgroundColor: "rgb(243 244 246)",
                  }),
                }}
              />
            </div>
            <div>
              <Label>Order type</Label>
              <select
                disabled
                className="h-11 w-full cursor-not-allowed appearance-none rounded-lg border border-gray-300 bg-gray-100 px-4 py-2.5 text-sm text-gray-500 shadow-theme-xs dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400"
                value={order.type || ""}
              >
                <option value="course">Course</option>
                <option value="membership">Membership</option>
                <option value="payment_link">Payment link</option>
              </select>
              <p className="mt-1 text-theme-xs text-gray-500 dark:text-gray-400">
                Type cannot be changed. Switch course or plan below when applicable.
              </p>
            </div>
          </div>

          {canEditEntity ? (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              <div>
                <Label>{orderType === "course" ? "Course" : "Membership plan"}</Label>
                <select
                  required
                  className="h-11 w-full appearance-none rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm shadow-theme-xs focus:border-brand-300 focus:outline-hidden focus:ring-3 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90"
                  value={selectedEntityId}
                  onChange={(e) => handleEntitySelectChange(e.target.value)}
                >
                  <option value="">Select…</option>
                  {courseOptions || planOptions}
                </select>
                {entityChanged && wasFulfilled ? (
                  <p className="mt-1 text-xs text-amber-600 dark:text-amber-400">
                    Access for the previous {orderType === "course" ? "course" : "plan"} will be removed and the new
                    one will be granted after save.
                  </p>
                ) : null}
              </div>
              {orderType === "course" ? (
                <div>
                  <Label>Batch ID (optional)</Label>
                  <Input
                    type="number"
                    placeholder="Leave empty to auto-assign when changing course"
                    value={batchIdInput}
                    onChange={(e) => setBatchIdInput(e.target.value)}
                  />
                </div>
              ) : (
                <div />
              )}
            </div>
          ) : (
            <div className="rounded-lg border border-gray-100 bg-gray-50 p-3 text-sm text-gray-600 dark:border-gray-800 dark:bg-white/[0.03] dark:text-gray-400">
              Item linked to this order ({statusLabel(order.type || "")}) cannot be changed from this screen.
            </div>
          )}

          {canEditEntity ? (
            <div className="rounded-xl border border-gray-100 bg-gray-50 p-4 dark:border-gray-800 dark:bg-white/[0.03]">
              <h3 className="mb-3 text-sm font-semibold text-gray-800 dark:text-white/90">Coupon</h3>
              {(couponCodeDisplay ||
                discountAmountDisplay > 0 ||
                originalListPriceForDisplay != null) && (
                <div className="mb-4 space-y-2 text-sm">
                  <div className="flex justify-between text-gray-600 dark:text-gray-400">
                    <span>Coupon code</span>
                    <span className="font-mono text-gray-900 dark:text-white/90">
                      {couponCodeDisplay || "—"}
                    </span>
                  </div>
                  <div className="flex justify-between text-gray-600 dark:text-gray-400">
                    <span>List / original amount (before discount)</span>
                    <span>
                      {originalListPriceForDisplay != null
                        ? `₹${Number(originalListPriceForDisplay).toFixed(2)}`
                        : "—"}
                    </span>
                  </div>
                  <div className="flex justify-between text-success-600 dark:text-success-400">
                    <span>Discount</span>
                    <span>
                      {discountAmountDisplay > 0
                        ? `-₹${Number(discountAmountDisplay).toFixed(2)}`
                        : "₹0.00"}
                    </span>
                  </div>
                </div>
              )}
              <Label>Apply or change coupon</Label>
              <div className="mt-1 flex gap-2">
                <div className="relative flex-1">
                  <Input
                    placeholder="Coupon code"
                    value={couponCodeInput}
                    onChange={(e) => setCouponCodeInput(e.target.value.toUpperCase())}
                    className="pr-10"
                  />
                  {couponCodeInput ? (
                    <button
                      type="button"
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                      onClick={() => {
                        setCouponCodeInput("");
                        setAppliedCouponPreview(null);
                      }}
                      aria-label="Clear coupon"
                    >
                      <CloseLineIcon className="h-4 w-4" />
                    </button>
                  ) : null}
                </div>
                <Button
                  type="button"
                  variant="outline"
                  disabled={couponApplying || !couponCodeInput.trim()}
                  onClick={() => void handleApplyCoupon()}
                >
                  {couponApplying ? "…" : "Apply"}
                </Button>
              </div>
              {appliedCouponPreview ? (
                <p className="mt-2 text-xs text-success-600 dark:text-success-400">
                  Preview applied — save to store on the order. Amount below updated to match GST-inclusive total.
                </p>
              ) : null}
              {!order.user_id ? (
                <p className="mt-2 text-xs text-amber-600 dark:text-amber-400">
                  Link a user on the order before applying a coupon (usage limits).
                </p>
              ) : null}
            </div>
          ) : null}

          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            <div>
              <Label>Amount (INR)</Label>
              <Input
                type="number"
                step="0.01"
                placeholder="Amount"
                value={formData.amount}
                onChange={(e) => handleChange("amount", e.target.value)}
                required
              />
              {canEditEntity ? (
                <p className="mt-1 text-theme-xs text-gray-500 dark:text-gray-400">
                  Choosing another course or plan fills this from catalog price (sale price when set).
                </p>
              ) : null}
            </div>
            <div>
              <Label>Status</Label>
              <select
                className="h-11 w-full appearance-none rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm shadow-theme-xs placeholder:text-gray-400 focus:border-brand-300 focus:outline-hidden focus:ring-3 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90"
                value={formData.status || ""}
                onChange={(e) => handleChange("status", e.target.value)}
              >
                <option value="pending">Pending</option>
                <option value="paid">Paid</option>
                <option value="completed">Completed</option>
                <option value="failed">Failed</option>
                <option value="cancelled">Cancelled</option>
                <option value="refunded">Refunded</option>
              </select>
              {formData.status === "paid" &&
                (originalRef.current?.status || "").toLowerCase() !== "paid" &&
                (originalRef.current?.status || "").toLowerCase() !== "completed" && (
                  <p className="mt-1 text-xs text-brand-500">
                    Marking as paid will trigger fulfillment (enrollment / membership activation).
                  </p>
                )}
              {formData.status === "refunded" &&
                (originalRef.current?.status || "").toLowerCase() !== "refunded" && (
                  <p className="mt-1 text-xs text-error-500">
                    Refunded status revokes access tied to this order.
                  </p>
                )}
            </div>
          </div>

          {showRefundFields && (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              <div>
                <Label>Refund amount (INR)</Label>
                <Input
                  type="number"
                  step="0.01"
                  placeholder="Defaults to order amount"
                  value={formData.refund_amount ?? ""}
                  onChange={(e) => handleChange("refund_amount", e.target.value)}
                />
              </div>
              <div>
                <Label>Refund remarks</Label>
                <Input
                  placeholder="Notes shown on the order"
                  value={formData.refund_remarks || ""}
                  onChange={(e) => handleChange("refund_remarks", e.target.value)}
                />
              </div>
            </div>
          )}

          <div className="rounded-xl border border-gray-100 bg-gray-50 p-4 dark:border-gray-800 dark:bg-white/[0.03]">
            <h3 className="mb-3 text-sm font-semibold text-gray-800 dark:text-white/90">Order summary</h3>
            <div className="space-y-2 text-sm">
              {originalListPriceForDisplay != null ? (
                <>
                  <div className="flex justify-between text-gray-500 dark:text-gray-400">
                    <span>List / original amount</span>
                    <span>₹{Number(originalListPriceForDisplay).toFixed(2)}</span>
                  </div>
                  {discountAmountDisplay > 0 ? (
                    <div className="flex justify-between text-success-600 dark:text-success-400">
                      <span>Discount{couponCodeDisplay ? ` (${couponCodeDisplay})` : ""}</span>
                      <span>-₹{Number(discountAmountDisplay).toFixed(2)}</span>
                    </div>
                  ) : null}
                  <div className="flex justify-between font-medium text-gray-700 dark:text-gray-200">
                    <span>Taxable (after discount)</span>
                    <span>
                      ₹
                      {Math.max(
                        0,
                        Number(originalListPriceForDisplay) - Number(discountAmountDisplay),
                      ).toFixed(2)}
                    </span>
                  </div>
                  <div className="flex justify-between text-gray-500 dark:text-gray-400">
                    <span>GST (18%)</span>
                    <span>
                      ₹
                      {(
                        Math.max(
                          0,
                          Number(originalListPriceForDisplay) - Number(discountAmountDisplay),
                        ) * 0.18
                      ).toFixed(2)}
                    </span>
                  </div>
                  <div className="flex justify-between border-t border-gray-200 pt-2 font-bold text-gray-900 dark:border-gray-700 dark:text-white">
                    <span>Total (GST inclusive)</span>
                    <span>₹{Number(formData.amount).toFixed(2)}</span>
                  </div>
                </>
              ) : (
                <>
                  <div className="flex justify-between text-gray-500 dark:text-gray-400">
                    <span>Taxable amount (illustrative)</span>
                    <span>₹{(Number(formData.amount) / 1.18).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-gray-500 dark:text-gray-400">
                    <span>GST (18%)</span>
                    <span>₹{((Number(formData.amount) * 0.18) / 1.18).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between border-t border-gray-200 pt-2 font-bold text-gray-900 dark:border-gray-700 dark:text-white">
                    <span>Total amount</span>
                    <span>₹{Number(formData.amount).toFixed(2)}</span>
                  </div>
                </>
              )}
            </div>
          </div>

          <div className="max-w-md">
            <Label>Affiliate (referral code)</Label>
            <Input
              placeholder="Affiliate code"
              value={formData.affiliate || ""}
              onChange={(e) => handleChange("affiliate", e.target.value)}
            />
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="outline" onClick={() => navigate(`/orders/${orderId}`)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Saving..." : "Save changes"}
            </Button>
          </div>
        </form>
      </div>
    </>
  );
}
