import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router";
import PageMeta from "../../components/common/PageMeta";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import PaymentLinkForm from "./PaymentLinkForm";
import type { PaymentLink, PaymentLinkFormValues } from "../../types/paymentLink";
import { fetchPaymentLink, updatePaymentLink } from "../../api/paymentLinks";

export default function PaymentLinkEdit() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [data, setData] = useState<PaymentLink | null>(null);

  useEffect(() => {
    if (!id) return;
    (async () => {
      try {
        setLoading(true);
        const row = await fetchPaymentLink(id);
        setData(row);
      } catch {
        alert("Failed to load payment link");
        navigate("/payment-links");
      } finally {
        setLoading(false);
      }
    })();
  }, [id, navigate]);

  const handleSubmit = async (form: PaymentLinkFormValues) => {
    if (!id) return;
    try {
      setSaving(true);
      await updatePaymentLink(id, {
        title: form.title,
        slug: form.slug || undefined,
        description: form.description || null,
        amount: Number(form.amount),
        sale_price: Number(form.sale_price),
        expiry: form.expiry,
        total_seats: Number(form.total_seats),
        random_value: form.random_value?.trim() || null,
        status: form.status,
      });
      navigate("/payment-links");
    } catch {
      alert("Failed to update payment link");
    } finally {
      setSaving(false);
    }
  };

  if (loading || !data) {
    return (
      <div className="flex items-center justify-center p-20">
        <p className="text-gray-500">Loading…</p>
      </div>
    );
  }

  const defaultValues: PaymentLinkFormValues = {
    title: data.title,
    slug: data.slug,
    description: data.description ?? "",
    amount: String(data.amount ?? ""),
    sale_price: String(data.sale_price ?? ""),
    expiry: typeof data.expiry === "string" ? data.expiry : String(data.expiry),
    total_seats: String(data.total_seats ?? ""),
    random_value: data.random_value ?? "",
    status: (data.status === "publish" ? "publish" : "draft") as PaymentLinkFormValues["status"],
  };

  return (
    <>
      <PageMeta title="Edit Payment Link | StudyCafe Admin" description="Edit payment link" />
      <PageBreadcrumb pageTitle="Edit Payment Link" compact />
      <PaymentLinkForm
        mode="edit"
        defaultValues={defaultValues}
        paidOrdersCount={data.paid_orders_count ?? data.seats_booked ?? 0}
        onSubmit={handleSubmit}
        loading={saving}
      />
    </>
  );
}
