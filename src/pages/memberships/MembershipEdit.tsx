import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router";
import PageMeta from "../../components/common/PageMeta";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import MembershipForm, { type MembershipFormData, parseFeaturesToArray, arrayToFeaturesHtml } from "./MembershipForm";
import { plansApi, type MembershipFeatures } from "../../api/plans";
import { planIsLifetime } from "./membershipUtils";
import { getApiErrorMessage } from "../../lib/apiError";

export default function MembershipEdit() {
  const navigate = useNavigate();
  const { id } = useParams();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [initialData, setInitialData] = useState<Partial<MembershipFormData>>({});

  useEffect(() => {
    if (id) {
      loadPlan(id);
    }
  }, [id]);

  const loadPlan = async (planId: string) => {
    try {
      setLoading(true);
      const plan = await plansApi.get(planId);

      // Deserialize features: can be { mrp, included, excluded } object or legacy string[]
      let mrp = 0;
      let featuresIncludedHtml = "";

      if (plan.features && !Array.isArray(plan.features) && typeof plan.features === "object") {
        const feat = plan.features as MembershipFeatures;
        mrp = feat.mrp ?? 0;
        featuresIncludedHtml = arrayToFeaturesHtml(feat.included ?? []);
      } else if (Array.isArray(plan.features) && plan.features.length > 0) {
        // Legacy flat string[] — treat all as included
        featuresIncludedHtml = arrayToFeaturesHtml(plan.features as string[]);
      }

      setInitialData({
        name: plan.name,
        slug: plan.slug,
        description: plan.description,
        price: Number(plan.price),
        mrp,
        currency: plan.currency,
        duration_days: plan.duration_days ?? 365,
        is_lifetime: planIsLifetime(plan),
        features_included: featuresIncludedHtml,
        is_active: plan.is_active,
        is_popular: plan.is_popular ?? false,
        sort_order: plan.sort_order ?? 0,
        course_ids: Array.isArray(plan.course_ids) ? plan.course_ids : [],
        course_cat_ids: Array.isArray(plan.course_cat_ids) ? plan.course_cat_ids : [],
        affiliate_commission: Math.min(
          100,
          Math.max(
            0,
            Number(
              plan.affiliate_commission != null && plan.affiliate_commission !== ""
                ? plan.affiliate_commission
                : 0,
            ) || 0,
          ),
        ),
      });
    } catch (err) {
      console.error("Failed to load plan", err);
      navigate("/memberships");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (formData: MembershipFormData) => {
    if (!id) return;
    try {
      setSubmitting(true);
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

      await plansApi.update(id, payload);
      navigate("/memberships");
    } catch (err: unknown) {
      console.error("Failed to update membership", err);
      alert(getApiErrorMessage(err, "Failed to update membership"));
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div className="p-6 text-center">Loading...</div>;

  return (
    <>
      <PageMeta
        title="Edit Membership | StudyCafe Admin"
        description="Edit membership plan"
      />
      <PageBreadcrumb items={[{ label: "Memberships", path: "/memberships" }]} pageTitle="Edit Membership" />
      <MembershipForm
        mode="edit"
        defaultValues={initialData}
        onSubmit={handleSubmit}
        loading={submitting}
      />
    </>
  );
}
