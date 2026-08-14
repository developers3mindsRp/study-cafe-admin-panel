import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router";
import PageMeta from "../../components/common/PageMeta";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import PaymentLinkForm from "./PaymentLinkForm";
import type { PaymentLink, PaymentLinkFormValues } from "../../types/paymentLink";
import { fetchPaymentLink, updatePaymentLink } from "../../api/paymentLinks";
import { getApiErrorMessage } from "../../lib/apiError";

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

  const loadedAccumulator = useMemo(
    () => String(data?.random_boost_accumulator ?? 0),
    [data?.random_boost_accumulator],
  );
  const loadedTotalSeats = useMemo(
    () => String(data?.total_seats ?? ""),
    [data?.total_seats],
  );
  const loadedRandomValue = useMemo(
    () => data?.random_value ?? "",
    [data?.random_value],
  );

  const defaultValues = useMemo<PaymentLinkFormValues | undefined>(() => {
    if (!data) return undefined;
    return {
      title: data.title,
      slug: data.slug,
      description: data.description ?? "",
      amount: String(data.amount ?? ""),
      sale_price: String(data.sale_price ?? ""),
      expiry:
        typeof data.expiry === "string"
          ? data.expiry
          : data.expiry
            ? new Date(data.expiry).toISOString()
            : "",
      total_seats: String(data.total_seats ?? ""),
      random_value: data.random_value ?? "",
      random_boost_accumulator: loadedAccumulator,
      status: (data.status === "publish" ? "publish" : "draft") as PaymentLinkFormValues["status"],
      product_type: data.product_type ?? "custom",
      product_id: data.product_id != null ? String(data.product_id) : "",
      batch_id: data.batch_id != null ? String(data.batch_id) : "",
      auto_enroll: data.auto_enroll !== false,
    };
  }, [data, loadedAccumulator]);

  const handleSubmit = async (form: PaymentLinkFormValues) => {
    if (!id) return;
    try {
      setSaving(true);
      const payload: Parameters<typeof updatePaymentLink>[1] = {
        title: form.title,
        slug: form.slug || undefined,
        description: form.description || null,
        amount: Number(form.amount),
        sale_price: Number(form.sale_price),
        expiry: form.expiry,
        total_seats: Number(form.total_seats),
        random_value: form.random_value?.trim() || null,
        status: form.status,
        product_type: form.product_type,
        product_id: form.product_type === "custom" ? null : form.product_id || null,
        batch_id: form.product_type === "course" && form.batch_id ? Number(form.batch_id) : null,
        auto_enroll: form.auto_enroll,
      };

      const accInput = String(form.random_boost_accumulator ?? "").trim();
      const totalSeatsChanged = String(form.total_seats ?? "").trim() !== loadedTotalSeats;
      const randomValueChanged =
        (form.random_value?.trim() || "") !== (loadedRandomValue?.trim() || "");

      // Send accumulator when admin changed it, or when total seats / random range changed
      // (backend resets accumulator on those changes unless a new value is provided).
      if (accInput !== loadedAccumulator || totalSeatsChanged || randomValueChanged) {
        payload.random_boost_accumulator = accInput === "" ? 0 : Number(accInput) || 0;
      }

      await updatePaymentLink(id, payload);
      alert("Payment link updated successfully!");
      navigate(`/payment-links/${id}/edit`);
    } catch (err: unknown) {
      alert(getApiErrorMessage(err, "Failed to update payment link"));
    } finally {
      setSaving(false);
    }
  };

  if (loading || !data || !defaultValues) {
    return (
      <div className="flex items-center justify-center p-20">
        <p className="text-gray-500">Loading…</p>
      </div>
    );
  }

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
