import { useState } from "react";
import { useNavigate } from "react-router";
import PageMeta from "../../components/common/PageMeta";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import CouponForm from "./PromoCodeForm";
import type { CouponFormData } from "../../types/promoCode";
import { createCoupon } from "../../api/promoCodes";

function getErrorMessage(error: unknown): string | undefined {
  if (error instanceof Error) return error.message;
  if (typeof error === "object" && error !== null && "response" in error) {
    return (error as { response?: { data?: { message?: string } } }).response?.data?.message;
  }
  return undefined;
}

export default function PromoCodeCreate() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (formData: CouponFormData) => {
    try {
      setLoading(true);
      await createCoupon({
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
      console.error("Failed to create coupon", err);
      alert(getErrorMessage(err) || "Failed to create coupon");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <PageMeta
        title="Create Coupon | StudyCafe Admin"
        description="Create a new coupon for StudyCafe"
      />
      <PageBreadcrumb pageTitle="Create Coupon" compact />
      <CouponForm mode="create" onSubmit={handleSubmit} loading={loading} />
    </>
  );
}
