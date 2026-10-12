import { useNavigate, useSearchParams } from "react-router";
import MembershipForm, { type MembershipFormData, parseFeaturesToArray } from "./MembershipForm";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import PageMeta from "../../components/common/PageMeta";
import { plansApi } from "../../api/plans";
import { useState, useEffect } from "react";
import { getApiErrorMessage } from "../../lib/apiError";
import { buildMembershipDuplicateInitial } from "../../lib/membershipDuplicate";

export default function MembershipCreate() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const duplicateFrom = searchParams.get("duplicateFrom")?.trim() || "";
  const [loading, setLoading] = useState(false);
  const [duplicateInitial, setDuplicateInitial] = useState<Partial<MembershipFormData> | null>(null);
  const [duplicateLoadError, setDuplicateLoadError] = useState<string | null>(null);
  const [duplicateLoading, setDuplicateLoading] = useState(Boolean(duplicateFrom));

  useEffect(() => {
    if (!duplicateFrom) {
      setDuplicateInitial(null);
      setDuplicateLoadError(null);
      setDuplicateLoading(false);
      return;
    }
    let cancelled = false;
    setDuplicateLoading(true);
    setDuplicateLoadError(null);
    plansApi
      .get(duplicateFrom)
      .then((plan) => {
        if (cancelled) return;
        if (!plan) {
          setDuplicateLoadError("Membership not found.");
          setDuplicateInitial(null);
          return;
        }
        setDuplicateInitial(buildMembershipDuplicateInitial(plan));
      })
      .catch(() => {
        if (!cancelled) {
          setDuplicateLoadError("Could not load membership to duplicate.");
          setDuplicateInitial(null);
        }
      })
      .finally(() => {
        if (!cancelled) setDuplicateLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [duplicateFrom]);

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

  if (duplicateFrom && duplicateLoading) {
    return (
      <>
        <PageMeta title="Duplicate Membership | StudyCafe Admin" description="Create a membership from an existing one" />
        <PageBreadcrumb pageTitle="Duplicate Membership" />
        <div className="py-12 text-center text-gray-500 dark:text-gray-400">Loading membership…</div>
      </>
    );
  }

  if (duplicateFrom && duplicateLoadError) {
    return (
      <>
        <PageMeta title="Duplicate Membership | StudyCafe Admin" description="Create a membership from an existing one" />
        <PageBreadcrumb pageTitle="Duplicate Membership" />
        <div className="rounded-xl border border-error-200 bg-error-50 px-4 py-6 text-center text-error-800 dark:border-error-900/50 dark:bg-error-950/30 dark:text-error-200">
          <p className="mb-4">{duplicateLoadError}</p>
          <button
            type="button"
            className="rounded-lg bg-brand-500 px-4 py-2 text-sm font-medium text-white hover:bg-brand-600"
            onClick={() => navigate("/memberships/create", { replace: true })}
          >
            Start blank membership instead
          </button>
        </div>
      </>
    );
  }

  const isDuplicate = Boolean(duplicateFrom && duplicateInitial);

  return (
    <>
      <PageMeta
        title={isDuplicate ? "Duplicate Membership | StudyCafe Admin" : "Create Membership | StudyCafe Admin"}
        description={isDuplicate ? "Review copied fields and save as a new membership" : "Create a new membership plan"}
      />
      <PageBreadcrumb pageTitle={isDuplicate ? "Duplicate Membership" : "Create Membership"} />
      <MembershipForm
        key={duplicateFrom || "new"}
        mode="create"
        defaultValues={duplicateInitial ?? undefined}
        onSubmit={handleSubmit}
        loading={loading}
      />
    </>
  );
}
