import { useNavigate } from "react-router";
import MembershipForm, { type MembershipFormData, parseFeaturesToArray } from "./MembershipForm";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import PageMeta from "../../components/common/PageMeta";
import { plansApi } from "../../api/plans";
import { useState } from "react";
import { getApiErrorMessage } from "../../lib/apiError";

export default function MembershipCreate() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (formData: MembershipFormData) => {
    try {
      setLoading(true);
      // Transform form data to match API expectations
      const included = parseFeaturesToArray(formData.features_included);
      const payload = {
        ...formData,
        features: (included.length > 0 || formData.mrp > 0)
          ? { mrp: formData.mrp, included, excluded: [] }
          : [],
        price: Number(formData.price),
        duration_days: Number(formData.duration_days),
        is_lifetime: formData.is_lifetime,
        is_popular: formData.is_popular,
        sort_order: Number(formData.sort_order),
        tier_rank: Number(formData.tier_rank),
        affiliate_commission: Math.min(
          100,
          Math.max(0, Number(formData.affiliate_commission)) || 0,
        ),
        course_ids: formData.course_ids,
        course_cat_ids: formData.course_cat_ids,
      };
      // Remove form-only fields from payload
      delete (payload as Record<string, unknown>).features_included;
      delete (payload as Record<string, unknown>).mrp;

      await plansApi.create(payload);
      navigate("/memberships");
    } catch (err: unknown) {
      console.error("Failed to create membership", err);
      alert(getApiErrorMessage(err, "Failed to create membership"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <PageMeta
        title="Create Membership | StudyCafe Admin"
        description="Create a new membership plan"
      />
      <PageBreadcrumb pageTitle="Create Membership" />
      <MembershipForm mode="create" onSubmit={handleSubmit} loading={loading} />
    </>
  );
}
