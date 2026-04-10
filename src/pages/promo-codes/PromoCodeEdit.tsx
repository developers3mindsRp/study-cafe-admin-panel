import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router";
import PageMeta from "../../components/common/PageMeta";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import CouponForm from "./PromoCodeForm";
import type { CouponFormData, Coupon } from "../../types/promoCode";
import { fetchCoupon, updateCoupon } from "../../api/promoCodes";

function getErrorMessage(error: unknown): string | undefined {
  if (error instanceof Error) return error.message;
  if (typeof error === "object" && error !== null && "response" in error) {
    return (error as { response?: { data?: { message?: string } } }).response?.data?.message;
  }
  return undefined;
}

export default function PromoCodeEdit() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [data, setData] = useState<Coupon | null>(null);

  useEffect(() => {
    if (!id) return;

    const load = async () => {
      try {
        setLoading(true);
        const coupon = await fetchCoupon(id);
        setData(coupon);
      } catch (err) {
        console.error("Failed to load coupon", err);
        alert("Failed to load coupon or it does not exist.");
        navigate("/coupons");
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [id, navigate]);

  const handleSubmit = async (formData: CouponFormData) => {
    if (!id) return;

    try {
      setSaving(true);
      await updateCoupon(id, {
        code: formData.code,
        description: formData.description,
        type: formData.type,
        value: Number(formData.value),
        max_discount: formData.max_discount ? Number(formData.max_discount) : undefined,
        min_order: formData.min_order ? Number(formData.min_order) : undefined,
        discount_on: formData.discount_on,
        start_date: formData.start_date || undefined,
        expire_date: formData.expire_date || undefined,
        status: formData.status,
      });
      navigate("/coupons");
    } catch (err: unknown) {
      console.error("Failed to update coupon", err);
      alert(getErrorMessage(err) || "Failed to update coupon");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-20">
        <p className="text-gray-500">Loading coupon...</p>
      </div>
    );
  }

  if (!data) {
    return null;
  }

  const defaultValues: CouponFormData = {
    code: data.code,
    description: data.description ?? "",
    type: data.type ?? "Percentage",
    value: data.value != null ? String(data.value) : "0",
    max_discount: data.max_discount != null ? String(data.max_discount) : "",
    min_order: data.min_order != null ? String(data.min_order) : "",
    discount_on: data.discount_on ?? "Membership Only",
    start_date: data.start_date ?? "",
    expire_date: data.expire_date ?? "",
    status: data.status ?? "publish",
  };

  return (
    <>
      <PageMeta
        title="Edit Coupon | StudyCafe Admin"
        description="Edit an existing coupon for StudyCafe"
      />
      <PageBreadcrumb pageTitle="Edit Coupon" compact />
      <CouponForm
        mode="edit"
        defaultValues={defaultValues}
        loading={saving}
        onSubmit={handleSubmit}
        excludeId={id}
      />
    </>
  );
}
