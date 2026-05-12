import React, { useState, useEffect, useRef } from "react";
import { useNavigate, useParams } from "react-router";
import PageMeta from "../../components/common/PageMeta";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import Button from "../../components/ui/button/Button";
import Input from "../../components/form/input/InputField";
import Select from "../../components/form/Select";
import Label from "../../components/form/Label";
import { fetchOrderByOrderId, updateOrder, UpdateOrderPayload, OrderRecord } from "../../api/orders";
import { fetchCourses, Course } from "../../api/courses";
import { plansApi, Plan } from "../../api/plans";
import { usersApi } from "../../api/users";
import AsyncSelect from "react-select/async";

export default function OrderEdit() {
  const navigate = useNavigate();
  const { orderId } = useParams<{ orderId: string }>();
  const [loading, setLoading] = useState(false);
  const [order, setOrder] = useState<OrderRecord | null>(null);

  const [formData, setFormData] = useState<UpdateOrderPayload>({
    status: "pending",
    buyer_name: "",
    buyer_email: "",
    buyer_mobile: "",
    buyer_gst: "",
    affiliate: "",
    amount: 0,
  });

  const [courses, setCourses] = useState<Course[]>([]);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [initialUserLabel, setInitialUserLabel] = useState<string>("");
  const [initialEntityLabel, setInitialEntityLabel] = useState<string>("");

  useEffect(() => {
    fetchCourses().then(setCourses).catch(console.error);
    plansApi.list({ limit: 100 }).then(res => setPlans(res.data || [])).catch(console.error);
  }, []);

  useEffect(() => {
    if (orderId) {
      fetchOrderByOrderId(orderId).then(data => {
        if (data) {
          setOrder(data);
          setFormData({
            status: data.status as any,
            buyer_name: data.buyer_name || "",
            buyer_email: data.buyer_email || "",
            buyer_mobile: (data as any).buyer_mobile || "",
            buyer_gst: (data as any).buyer_gst || "",
            affiliate: (data as any).affiliate || "",
            amount: data.amount || 0,
          });

          if (data.user_id) {
            usersApi.get(String(data.user_id)).then(u => {
              if (u) setInitialUserLabel(`${u.name} (${u.email})`);
            }).catch(() => {});
          }
        }
      });
    }
  }, [orderId]);

  useEffect(() => {
    if (order?.type && order?.entity_id) {
      if (order.type === "course" && courses.length > 0) {
        const c = courses.find(c => String(c.id) === order.entity_id);
        if (c) setInitialEntityLabel(c.title);
      } else if (order.type === "membership" && plans.length > 0) {
        const p = plans.find(p => String(p.id) === order.entity_id);
        if (p) setInitialEntityLabel(p.name);
      }
    }
  }, [order, courses, plans]);

  const handleChange = (field: keyof UpdateOrderPayload, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!order) return;
    
    setLoading(true);
    try {
      await updateOrder(order.id, {
        ...formData,
        amount: Number(formData.amount),
      });
      alert("Order updated successfully!");
      navigate(`/orders/${orderId}`);
    } catch (error: any) {
      alert(error.response?.data?.message || "Failed to update order");
      setLoading(false);
    }
  };

  if (!order) return <div className="p-6">Loading order...</div>;

  return (
    <>
      <PageMeta title={`Edit Order ${orderId} | StudyCafe Admin`} description="Edit manual order" />
      <PageBreadcrumb 
        pageTitle="Edit Order"
        items={[
          { label: "Orders", path: "/orders" },
          { label: String(orderId), path: `/orders/${orderId}` }
        ]}
      />
      
      <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] sm:p-6">
        <h2 className="mb-4 text-xl font-semibold text-gray-800 dark:text-white/90">Edit Order: {orderId}</h2>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div>
              <Label>Search & Select User</Label>
              <AsyncSelect
                isDisabled
                value={order?.user_id ? { value: String(order.user_id), label: initialUserLabel || `User ID: ${order.user_id}` } : null}
                className="text-sm text-gray-800 dark:text-gray-200"
                styles={{
                  control: (base) => ({
                    ...base,
                    minHeight: "44px",
                    borderRadius: "0.5rem",
                    borderColor: "rgb(209 213 219)",
                    boxShadow: "none",
                    backgroundColor: "rgb(243 244 246)",
                  })
                }}
              />
            </div>
            <div>
              <Label>Order Type</Label>
              <select
                disabled
                className="h-11 w-full appearance-none rounded-lg border border-gray-300 bg-gray-100 px-4 py-2.5 text-sm shadow-theme-xs text-gray-500 focus:outline-hidden dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400"
                value={order.type || ""}
              >
                <option value="course">Course</option>
                <option value="membership">Membership</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div>
              <Label>Select {order.type === "course" ? "Course" : "Membership"}</Label>
              <AsyncSelect
                isDisabled
                value={order?.entity_id ? { value: String(order.entity_id), label: initialEntityLabel || `ID: ${order.entity_id}` } : null}
                className="text-sm text-gray-800 dark:text-gray-200"
                styles={{
                  control: (base) => ({
                    ...base,
                    minHeight: "44px",
                    borderRadius: "0.5rem",
                    borderColor: "rgb(209 213 219)",
                    boxShadow: "none",
                    backgroundColor: "rgb(243 244 246)",
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
                onChange={(e) => handleChange("status", e.target.value)}
              >
                <option value="pending">Pending</option>
                <option value="paid">Paid</option>
                <option value="failed">Failed</option>
                <option value="cancelled">Cancelled</option>
              </select>
              {formData.status === "paid" && order.status !== "paid" && (
                <p className="mt-1 text-xs text-brand-500">
                  Marking as "Paid" will automatically trigger fulfillment (course enrollment/membership access).
                </p>
              )}
            </div>
          </div>

          <div className="rounded-xl border border-gray-100 bg-gray-50 p-4 dark:border-gray-800 dark:bg-white/[0.03]">
            <h3 className="mb-3 text-sm font-semibold text-gray-800 dark:text-white/90">Order Summary Breakdown</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between text-gray-500 dark:text-gray-400">
                <span>Taxable Amount</span>
                <span>₹{(Number(formData.amount) / 1.18).toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-gray-500 dark:text-gray-400">
                <span>GST (18%)</span>
                <span>₹{(Number(formData.amount) * 0.18 / 1.18).toFixed(2)}</span>
              </div>
              <div className="flex justify-between border-t border-gray-200 pt-2 font-bold text-gray-900 dark:border-gray-700 dark:text-white">
                <span>Total Amount</span>
                <span>₹{Number(formData.amount).toFixed(2)}</span>
              </div>
            </div>
          </div>

          {/* 
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div>
              <Label>Buyer Name</Label>
              <Input 
                placeholder="Buyer Name"
                value={formData.buyer_name || ""} 
                onChange={(e) => handleChange("buyer_name", e.target.value)} 
              />
            </div>
            <div>
              <Label>Buyer Email</Label>
              <Input 
                type="email"
                placeholder="Buyer Email"
                value={formData.buyer_email || ""} 
                onChange={(e) => handleChange("buyer_email", e.target.value)} 
              />
            </div>
            <div>
              <Label>Buyer Mobile</Label>
              <Input 
                placeholder="Buyer Mobile"
                value={formData.buyer_mobile || ""} 
                onChange={(e) => handleChange("buyer_mobile", e.target.value)} 
              />
            </div>
            <div>
              <Label>Buyer GST</Label>
              <Input 
                placeholder="Buyer GST"
                value={formData.buyer_gst || ""} 
                onChange={(e) => handleChange("buyer_gst", e.target.value)} 
              />
            </div>
            <div>
              <Label>Affiliate (Referral Code)</Label>
              <Input 
                placeholder="Affiliate Code"
                value={formData.affiliate || ""} 
                onChange={(e) => handleChange("affiliate", e.target.value)} 
              />
            </div>
          </div>
          */}

          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="outline" onClick={() => navigate(`/orders/${orderId}`)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </form>
      </div>
    </>
  );
}
