import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router";
import PageMeta from "../../components/common/PageMeta";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import MembershipForm, { type MembershipFormData, parseFeaturesToArray, arrayToFeaturesHtml } from "./MembershipForm";
import { plansApi } from "../../api/plans";

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
      setInitialData({
        name: plan.name,
        slug: plan.slug,
        description: plan.description,
        price: Number(plan.price),
        currency: plan.currency,
        duration_days: plan.duration_days ?? 365,
        is_lifetime: plan.is_lifetime ?? false,
        features: Array.isArray(plan.features) ? arrayToFeaturesHtml(plan.features) : "",
        is_active: plan.is_active,
        is_popular: plan.is_popular ?? false,
        sort_order: plan.sort_order ?? 0,
        course_ids: Array.isArray(plan.course_ids) ? plan.course_ids : [],
        course_cat_ids: Array.isArray(plan.course_cat_ids) ? plan.course_cat_ids : [],
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
      const payload = {
        ...formData,
        features: parseFeaturesToArray(formData.features),
        price: Number(formData.price),
        duration_days: Number(formData.duration_days),
        is_lifetime: formData.is_lifetime,
        is_popular: formData.is_popular,
        sort_order: Number(formData.sort_order),
        course_ids: formData.course_ids,
        course_cat_ids: formData.course_cat_ids,
      };
      await plansApi.update(id, payload);
      navigate("/memberships");
    } catch (err) {
      console.error("Failed to update membership", err);
      alert("Failed to update membership");
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
      <PageBreadcrumb pageTitle="Edit Membership" />
      <MembershipForm
        mode="edit"
        defaultValues={initialData}
        onSubmit={handleSubmit}
        loading={submitting}
      />
    </>
  );
}
