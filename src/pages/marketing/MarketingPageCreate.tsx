import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router";
import PageMeta from "../../components/common/PageMeta";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import MarketingPageForm, { type MarketingPageFormData } from "./MarketingPageForm";
import {
  createMarketingPage,
  fetchMarketingPage,
  type MarketingPage,
} from "../../api/marketingPages";
import { buildMarketingPageDuplicateInitial } from "../../lib/marketingPageDuplicate";

export default function MarketingPageCreate() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const duplicateFrom = searchParams.get("duplicateFrom")?.trim() || "";
  const [loading, setLoading] = useState(false);
  const [duplicateSource, setDuplicateSource] = useState<MarketingPage | null>(null);
  const [duplicateInitial, setDuplicateInitial] =
    useState<Partial<MarketingPageFormData> | null>(null);
  const [duplicateLoadError, setDuplicateLoadError] = useState<string | null>(null);
  const [duplicateLoading, setDuplicateLoading] = useState(Boolean(duplicateFrom));

  useEffect(() => {
    if (!duplicateFrom) {
      setDuplicateSource(null);
      setDuplicateInitial(null);
      setDuplicateLoadError(null);
      setDuplicateLoading(false);
      return;
    }
    let cancelled = false;
    setDuplicateLoading(true);
    setDuplicateLoadError(null);
    fetchMarketingPage(Number(duplicateFrom))
      .then((row) => {
        if (cancelled) return;
        if (!row) {
          setDuplicateLoadError("Marketing page not found.");
          setDuplicateSource(null);
          setDuplicateInitial(null);
          return;
        }
        setDuplicateSource(row);
        setDuplicateInitial(buildMarketingPageDuplicateInitial(row));
      })
      .catch(() => {
        if (!cancelled) {
          setDuplicateLoadError("Could not load the marketing page to duplicate.");
          setDuplicateSource(null);
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

  const handleSubmit = async (form: MarketingPageFormData) => {
    try {
      setLoading(true);
      await createMarketingPage({
        course_id: Number(form.course_id),
        slug: form.slug.trim(),
        is_published: form.is_published,
        meta: form.meta,
      });
      navigate("/marketing-pages");
    } catch (err: unknown) {
      alert(
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
          "Failed to create marketing page",
      );
    } finally {
      setLoading(false);
    }
  };

  if (duplicateFrom && duplicateLoading) {
    return (
      <>
        <PageMeta
          title="Duplicate Marketing Page | StudyCafe Admin"
          description="Create a marketing page from an existing one"
        />
        <PageBreadcrumb pageTitle="Duplicate marketing page" compact />
        <div className="py-12 text-center text-gray-500 dark:text-gray-400">
          Loading marketing page…
        </div>
      </>
    );
  }

  if (duplicateFrom && duplicateLoadError) {
    return (
      <>
        <PageMeta
          title="Duplicate Marketing Page | StudyCafe Admin"
          description="Create a marketing page from an existing one"
        />
        <PageBreadcrumb pageTitle="Duplicate marketing page" compact />
        <div className="rounded-xl border border-error-200 bg-error-50 px-4 py-6 text-center text-error-800 dark:border-error-900/50 dark:bg-error-950/30 dark:text-error-200">
          <p className="mb-4">{duplicateLoadError}</p>
          <button
            type="button"
            className="rounded-lg bg-brand-500 px-4 py-2 text-sm font-medium text-white hover:bg-brand-600"
            onClick={() => navigate("/marketing-pages/create", { replace: true })}
          >
            Start a blank page instead
          </button>
        </div>
      </>
    );
  }

  const isDuplicate = Boolean(duplicateFrom && duplicateInitial);

  return (
    <>
      <PageMeta
        title={
          isDuplicate
            ? "Duplicate Marketing Page | StudyCafe Admin"
            : "Create Marketing Page | StudyCafe Admin"
        }
        description={
          isDuplicate
            ? "Review the copied content and save it as a new marketing page"
            : "New course marketing page"
        }
      />
      <PageBreadcrumb
        pageTitle={isDuplicate ? "Duplicate marketing page" : "Create marketing page"}
        compact
      />
      <MarketingPageForm
        key={duplicateFrom || "new"}
        mode="create"
        defaultValues={duplicateInitial ?? undefined}
        duplicatedFromSlug={isDuplicate ? duplicateSource?.slug : undefined}
        loading={loading}
        onSubmit={handleSubmit}
      />
    </>
  );
}
