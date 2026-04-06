import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router";
import PageMeta from "../../components/common/PageMeta";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import PromoCodeForm from "./PromoCodeForm";
import type { PromoCodeFormData } from "../../types/promoCode";
import { fetchPromoCode, updatePromoCode } from "../../api/promoCodes";
import type { PromoCode } from "../../types/promoCode";

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
  const [data, setData] = useState<PromoCode | null>(null);

  useEffect(() => {
    if (!id) return;

    const load = async () => {
      try {
        setLoading(true);
        const promoCode = await fetchPromoCode(id);
        setData(promoCode);
      } catch (err) {
        console.error("Failed to load promo code", err);
        alert("Failed to load promo code or it does not exist.");
        navigate("/promo-codes");
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [id, navigate]);

  const handleSubmit = async (formData: PromoCodeFormData) => {
    if (!id) return;

    try {
      setSaving(true);
      await updatePromoCode(id, {
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
      console.error("Failed to update promo code", err);
      alert(getErrorMessage(err) || "Failed to update promo code");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-20">
        <p className="text-gray-500">Loading promo code...</p>
      </div>
    );
  }

  if (!data) {
    return null;
  }

  const defaultValues: PromoCodeFormData = {
    code: data.code,
    description: data.description ?? "",
    discount_type: data.discount_type ?? "percentage",
    discount_value: data.discount_value != null ? String(data.discount_value) : "0",
    max_discount_amount: data.max_discount_amount != null ? String(data.max_discount_amount) : "",
    min_cart_value: data.min_cart_value != null ? String(data.min_cart_value) : "",
    active: data.active ?? true,
    valid_from: data.valid_from ?? "",
    valid_to: data.valid_to ?? "",
    usage_limit: data.usage_limit != null ? String(data.usage_limit) : "",
  };

  return (
    <>
      <PageMeta
        title="Edit Promo Code | StudyCafe Admin"
        description="Edit an existing promo code for StudyCafe"
      />
      <PageBreadcrumb pageTitle="Edit Promo Code" compact />
      <PromoCodeForm
        mode="edit"
        defaultValues={defaultValues}
        loading={saving}
        onSubmit={handleSubmit}
      />
    </>
  );
}
