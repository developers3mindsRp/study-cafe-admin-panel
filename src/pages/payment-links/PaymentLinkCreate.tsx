import { useState } from "react";
import { useNavigate } from "react-router";
import PageMeta from "../../components/common/PageMeta";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import PaymentLinkForm from "./PaymentLinkForm";
import type { PaymentLinkFormValues } from "../../types/paymentLink";
import { createPaymentLink } from "../../api/paymentLinks";
import { getApiErrorMessage } from "../../lib/apiError";

export default function PaymentLinkCreate() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (form: PaymentLinkFormValues) => {
    try {
      setLoading(true);
      const payload: Parameters<typeof createPaymentLink>[0] = {
        title: form.title,
        slug: form.slug || undefined,
        description: form.description || null,
        amount: Number(form.amount),
        sale_price: Number(form.sale_price),
        expiry: form.expiry,
        total_seats: Number(form.total_seats),
        random_value: form.random_value?.trim() || null,
        random_boost_accumulator: Number(String(form.random_boost_accumulator ?? "").trim()) || 0,
        status: form.status,
      };
      await createPaymentLink(payload);
      navigate("/payment-links");
    } catch (err: unknown) {
      console.error(err);
      alert(getApiErrorMessage(err, "Failed to create payment link"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <PageMeta title="Create Payment Link | StudyCafe Admin" description="Add a payment link" />
      <PageBreadcrumb pageTitle="Create Payment Link" compact />
      <PaymentLinkForm mode="create" onSubmit={handleSubmit} loading={loading} />
    </>
  );
}
