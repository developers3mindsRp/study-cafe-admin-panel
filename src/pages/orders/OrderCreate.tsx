import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import PageMeta from "../../components/common/PageMeta";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import Button from "../../components/ui/button/Button";
import Input from "../../components/form/input/InputField";
import Label from "../../components/form/Label";
import { createOrder, CreateOrderPayload, applyCouponAdmin } from "../../api/orders";
import { fetchCourses, Course } from "../../api/courses";
import { plansApi, Plan } from "../../api/plans";
import { usersApi } from "../../api/users";
import AsyncSelect from "react-select/async";
import type { CSSObjectWithLabel } from "react-select";
import { CloseLineIcon } from "../../icons";
import { type OrderPaymentGateway } from "../../utils/orderGateway";

export default function OrderCreate() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [courses, setCourses] = useState<Course[]>([]);
  const [plans, setPlans] = useState<Plan[]>([]);

  const [paymentId, setPaymentId] = useState("");
  const [paymentGateway, setPaymentGateway] = useState<OrderPaymentGateway>("admin");

  const [formData, setFormData] = useState<CreateOrderPayload>({
    user_id: 0,
    type: "course",
    entity_id: "",
    amount: 0,
    status: "paid",
    buyer_name: "",
    buyer_email: "",
    buyer_mobile: "",
    buyer_gst: "",
    affiliate: "",
  });

  useEffect(() => {
    fetchCourses().then(setCourses).catch(console.error);
    plansApi.list({ limit: 100 }).then(res => setPlans(res.data || [])).catch(console.error);
  }, []);

  const loadUserOptions = async (inputValue: string) => {
    if (!inputValue || inputValue.length < 2) return [];
    try {
      const res = await usersApi.list({ search: inputValue, limit: 10 });
      return (res.data || []).map(u => ({
        value: String(u.id),
        label: `${u.name} (${u.email})`
      }));
    } catch {
      return [];
    }
  };

  const loadCourseOptions = async (inputValue: string) => {
    const filtered = courses.filter(c => 
      (c.title || "").toLowerCase().includes(inputValue.toLowerCase()) || 
      (c.short_title || "").toLowerCase().includes(inputValue.toLowerCase())
    );
    return filtered.slice(0, 10).map(c => ({
      value: String(c.id),
      label: c.title
    }));
  };

  const loadPlanOptions = async (inputValue: string) => {
    const filtered = plans.filter(p => 
      (p.name || "").toLowerCase().includes(inputValue.toLowerCase())
    );
    return filtered.slice(0, 10).map(p => ({
      value: String(p.id),
      label: p.name
    }));
  };

  const handleChange = (field: keyof CreateOrderPayload, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleEntityChange = (value: string) => {
    setFormData(prev => {
      let amount = prev.amount;
      if (prev.type === "course") {
        const course = courses.find(c => String(c.id) === value);
        if (course) {
          amount =
            course.sale_price != null && course.sale_price !== ""
              ? course.sale_price
              : course.price;
        }
      } else {
        const plan = plans.find(p => String(p.id) === value);
        if (plan) amount = plan.price;
      }
      return { ...prev, entity_id: value, amount: amount };
    });
  };

  const [couponCode, setCouponCode] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState<any>(null);
  const [calculating, setCalculating] = useState(false);

  const subtotal = formData.amount;
  const discount = appliedCoupon?.discount || appliedCoupon?.discountAmount || 0;
  const taxable = Math.max(0, Number(subtotal) - discount);
  const gst = Number((taxable * 0.18).toFixed(2));
  const grandTotal = Number((taxable + gst).toFixed(2));

  const handleApplyCoupon = async () => {
    if (!couponCode || !formData.entity_id) {
      alert("Please select a user and course/plan first");
      return;
    }
    setCalculating(true);
    try {
      const res = await applyCouponAdmin({
        couponCode,
        type: formData.type,
        id: formData.entity_id,
        userId: formData.user_id || undefined
      });
      setAppliedCoupon(res);
      // We don't force update the formData.amount because admin might want to override,
      // but we show the breakdown.
    } catch (error: any) {
      const msg = error.response?.data?.message || error.response?.data?.error || "Invalid coupon code";
      alert(msg);
      setAppliedCoupon(null);
    } finally {
      setCalculating(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.user_id) {
      alert("Please select a user");
      return;
    }
    if (!formData.entity_id) {
      alert(`Please select a ${formData.type}`);
      return;
    }
    if (formData.status === "paid" && paymentGateway === "razorpay" && !paymentId.trim()) {
      alert("Razorpay Payment ID is required when payment method is Razorpay.");
      return;
    }
    setLoading(true);
    try {
      const res = await createOrder({
        ...formData,
        amount: Number(grandTotal), // Use the calculated grand total
        user_id: Number(formData.user_id),
        coupon_code: appliedCoupon?.coupon.code || couponCode || undefined,
        gateway: formData.status === "paid" ? paymentGateway : undefined,
        payment_id:
          formData.status === "paid" && paymentId.trim() ? paymentId.trim() : undefined,
      });
      alert("Order created successfully!");
      navigate(`/orders/${res.order_id}`);
    } catch (error: any) {
      const msg = error.response?.data?.message || error.response?.data?.error || "Failed to create order";
      alert(msg);
      setLoading(false);
    }
  };

  return (
    <>
      <PageMeta title="Create Order | StudyCafe Admin" description="Create a manual order" />
      <PageBreadcrumb 
        pageTitle="Create Order" 
        items={[{ label: "Orders", path: "/orders" }]}
      />
      
      <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] sm:p-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div>
              <Label>Search & Select User</Label>
              <AsyncSelect
                cacheOptions
                defaultOptions
                loadOptions={loadUserOptions}
                onChange={(option: any) => handleChange("user_id", option?.value)}
                placeholder="Type name or email..."
                className="text-sm text-gray-800 dark:text-gray-200"
                styles={{
                  control: (base: CSSObjectWithLabel) => ({
                    ...base,
                    minHeight: "44px",
                    borderRadius: "0.5rem",
                    borderColor: "rgb(209 213 219)", // Tailwind gray-300
                    boxShadow: "none",
                    "&:hover": { borderColor: "rgb(156 163 175)" }
                  })
                }}
              />
            </div>
            <div>
              <Label>Order Type</Label>
              <select
                className="h-11 w-full appearance-none rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm shadow-theme-xs placeholder:text-gray-400 focus:outline-hidden focus:ring-3 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90"
                value={formData.type}
                onChange={(e) => {
                  handleChange("type", e.target.value);
                  handleChange("entity_id", "");
                  handleChange("amount", 0);
                }}
              >
                <option value="course">Course</option>
                <option value="membership">Membership</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div>
              <Label>Select {formData.type === "course" ? "Course" : "Membership"}</Label>
              <AsyncSelect
                key={formData.type} // Force remount when type changes
                cacheOptions
                defaultOptions
                loadOptions={formData.type === "course" ? loadCourseOptions : loadPlanOptions}
                onChange={(option: any) => handleEntityChange(option?.value)}
                placeholder={`Search ${formData.type}...`}
                className="text-sm text-gray-800 dark:text-gray-200"
                styles={{
                  control: (base: CSSObjectWithLabel) => ({
                    ...base,
                    minHeight: "44px",
                    borderRadius: "0.5rem",
                    borderColor: "rgb(209 213 219)",
                    boxShadow: "none",
                  })
                }}
              />
            </div>
            <div>
              <Label>Amount (INR)</Label>
              <Input 
                type="number" 
                placeholder="Amount"
                value={formData.amount} 
                onChange={(e) => handleChange("amount", e.target.value)} 
                required 
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div>
              <Label>Status</Label>
              <select
                className="h-11 w-full appearance-none rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm shadow-theme-xs placeholder:text-gray-400 focus:outline-hidden focus:ring-3 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90"
                value={formData.status}
                onChange={(e) => {
                  handleChange("status", e.target.value);
                  if (e.target.value !== "paid") {
                    setPaymentId("");
                    setPaymentGateway("admin");
                  }
                }}
              >
                <option value="pending">Pending</option>
                <option value="paid">Paid (Triggers fulfillment)</option>
                <option value="failed">Payment failed</option>
              </select>
            </div>
            {formData.status === "paid" && (
              <>
                <div>
                  <Label>Payment method</Label>
                  <select
                    className="h-11 w-full appearance-none rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm shadow-theme-xs placeholder:text-gray-400 focus:outline-hidden focus:ring-3 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90"
                    value={paymentGateway}
                    onChange={(e) => {
                      const next = e.target.value as OrderPaymentGateway;
                      setPaymentGateway(next);
                      if (next === "admin") setPaymentId("");
                    }}
                  >
                    <option value="admin">Admin (manual / offline)</option>
                    <option value="razorpay">Razorpay</option>
                  </select>
                  <p className="mt-1 text-theme-xs text-gray-500 dark:text-gray-400">
                    Shown to the user on invoices and purchase history.
                  </p>
                </div>
                {paymentGateway === "razorpay" && (
                  <div>
                    <Label>
                      Razorpay Payment ID <span className="text-error-500">*</span>
                    </Label>
                    <Input
                      placeholder="e.g. pay_xxxxxxxx"
                      value={paymentId}
                      onChange={(e) => setPaymentId(e.target.value.trim())}
                      required
                    />
                    <p className="mt-1 text-theme-xs text-gray-500 dark:text-gray-400">
                      Enter the payment ID from the Razorpay dashboard.
                    </p>
                  </div>
                )}
              </>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div>
              <Label>Coupon Code</Label>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Input 
                    placeholder="Enter coupon code"
                    value={couponCode} 
                    onChange={(e) => setCouponCode(e.target.value.toUpperCase())} 
                    className="w-full pr-10"
                  />
                  {couponCode && (
                    <button
                      type="button"
                      onClick={() => {
                        setCouponCode("");
                        setAppliedCoupon(null);
                      }}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                    >
                      <CloseLineIcon className="h-4 w-4" />
                    </button>
                  )}
                </div>
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={handleApplyCoupon}
                  disabled={calculating || !couponCode}
                >
                  {calculating ? "..." : "Apply"}
                </Button>
              </div>
              {appliedCoupon && (
                <p className="mt-1 text-xs text-success-500">
                  Coupon applied: {appliedCoupon.coupon.code} (-₹{appliedCoupon.discount || appliedCoupon.discountAmount || 0})
                </p>
              )}
            </div>
            <div>
              <Label>Affiliate (Referral Code)</Label>
              <Input 
                placeholder="Affiliate Code (Optional)"
                value={formData.affiliate || ""} 
                onChange={(e) => handleChange("affiliate", e.target.value)} 
              />
            </div>
          </div>

          <div className="rounded-xl border border-gray-100 bg-gray-50 p-4 dark:border-gray-800 dark:bg-white/[0.03]">
            <h3 className="mb-3 text-sm font-semibold text-gray-800 dark:text-white/90">Order Summary</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between text-gray-500 dark:text-gray-400">
                <span>Subtotal (Course Price)</span>
                <span>₹{Number(subtotal).toFixed(2)}</span>
              </div>
              {discount > 0 && (
                <div className="flex justify-between text-success-600">
                  <div className="flex flex-col">
                    <span>Discount</span>
                    {appliedCoupon?.coupon?.code && (
                      <span className="text-[10px] font-mono opacity-70">({appliedCoupon.coupon.code})</span>
                    )}
                  </div>
                  <span>-₹{Number(discount).toFixed(2)}</span>
                </div>
              )}
              <div className="border-t border-gray-100 dark:border-gray-800 my-1"></div>
              <div className="flex justify-between font-medium text-gray-700 dark:text-gray-200">
                <span>Taxable Amount (After Discount)</span>
                <span>₹{taxable.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-gray-500 dark:text-gray-400">
                <span>GST (18%)</span>
                <span>₹{gst.toFixed(2)}</span>
              </div>
              <div className="flex justify-between border-t border-gray-200 pt-2 font-bold text-gray-900 dark:border-gray-700 dark:text-white">
                <span className="text-base">Payable Amount (Grand Total)</span>
                <span className="text-base text-brand-500">₹{grandTotal.toFixed(2)}</span>
              </div>
            </div>
            <p className="mt-3 text-[10px] text-gray-400 italic">
              * The total amount will be used for the final order.
            </p>
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="outline" onClick={() => navigate("/orders")}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Creating..." : "Create Order"}
            </Button>
          </div>
        </form>
      </div>
    </>
  );
}
