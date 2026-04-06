import { useState } from "react";
import { useNavigate } from "react-router";
import PageMeta from "../../components/common/PageMeta";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import PromoCodeForm from "./PromoCodeForm";
import type { PromoCodeFormData } from "../../types/promoCode";
import { createPromoCode } from "../../api/promoCodes";

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

  const handleSubmit = async (formData: PromoCodeFormData) => {
    try {
      setLoading(true);
      await createPromoCode({
        code: formData.code,
        description: formData.description,
        discount_type: formData.discount_type,
        discount_value: Number(formData.discount_value),
        max_discount_amount: formData.max_discount_amount
          ? Number(formData.max_discount_amount)
          : undefined,
        min_cart_value: formData.min_cart_value
          ? Number(formData.min_cart_value)
          : undefined,
        active: formData.active,
        valid_from: formData.valid_from || undefined,
        valid_to: formData.valid_to || undefined,
        usage_limit: formData.usage_limit
          ? Number(formData.usage_limit)
          : undefined,
      });
      navigate("/promo-codes");
    } catch (err: unknown) {
      console.error("Failed to create promo code", err);
      alert(getErrorMessage(err) || "Failed to create promo code");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <PageMeta
        title="Create Promo Code | StudyCafe Admin"
        description="Create a new promo code for StudyCafe"
      />
      <PageBreadcrumb pageTitle="Create Promo Code" compact />
      <PromoCodeForm mode="create" onSubmit={handleSubmit} loading={loading} />
    </>
  );
}
