import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router";
import PageMeta from "../../components/common/PageMeta";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import BackLink from "../../components/common/BackLink";
import SEOMetadataForm, { type SEOMetadataFormData } from "./SEOMetadataForm";
import { fetchSiteSeoRoutes } from "../../api/siteSeoRoutes";
import {
  fetchSeoMetadataById,
  sortSeoEligiblePages,
  updateSeoMetadata,
  type SeoEligiblePage,
} from "../../api/seo";
import { normalizeAdminSeoPath } from "../../lib/slug";
import { isModuleManagedSeoPath } from "../../lib/seoPaths";

/** Ensure the edited row's path appears even if absent from eligible API (legacy rows). */
function mergeEditPageOptions(
  eligible: SeoEligiblePage[],
  current:
    Pick<SEOMetadataFormData, "pageSlug" | "pageName">
    | null,
): SeoEligiblePage[] {
  if (!current) return [...eligible].sort(sortSeoEligiblePages);
  const p = normalizeAdminSeoPath(current.pageSlug);
  if (!p) return [...eligible].sort(sortSeoEligiblePages);
  const has = eligible.some((o) => normalizeAdminSeoPath(o.path) === p);
  const next = has
    ? [...eligible]
    : [
      ...eligible,
      { path: p, label: (current.pageName || p).trim() || p },
    ];
  return next.sort(sortSeoEligiblePages);
}

export default function SEOMetadataEdit() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [defaultValues, setDefaultValues] = useState<SEOMetadataFormData | null>(
    null,
  );
  const [eligiblePages, setEligiblePages] = useState<SeoEligiblePage[]>([]);

  useEffect(() => {
    if (!id) return;
    let cancelled = false;
    const metadataId = parseInt(id, 10);

    (async () => {
      setLoading(true);
      try {
        const [entry, siteRoutes] = await Promise.all([
          fetchSeoMetadataById(metadataId),
          fetchSiteSeoRoutes(),
        ]);
        if (cancelled) return;
        if (isModuleManagedSeoPath(entry.pageSlug)) {
          setError(
            "This entry belongs to an article or course. Edit SEO from Articles or Courses instead.",
          );
          setDefaultValues(null);
          return;
        }
        const routes: SeoEligiblePage[] = siteRoutes.map((r) => ({
          path: r.path,
          label: r.label,
        }));
        setEligiblePages([...routes].sort(sortSeoEligiblePages));
        setDefaultValues({
          pageName: entry.pageName,
          pageSlug: entry.pageSlug,
          metaTitle: entry.metaTitle,
          metaDescription: entry.metaDescription,
          metaKeywords: entry.metaKeywords,
          canonicalUrl: entry.canonicalUrl,
          ogTitle: entry.ogTitle,
          ogDescription: entry.ogDescription,
          ogImageUrl: entry.ogImageUrl,
          robots: (entry.robots as SEOMetadataFormData["robots"]) || "index, follow",
        });
        setError(null);
      } catch (err: unknown) {
        console.error("Failed to load SEO metadata", err);
        if (!cancelled) setError("Failed to load SEO metadata");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [id]);

  const pageOptions = useMemo(
    () => mergeEditPageOptions(eligiblePages, defaultValues),
    [eligiblePages, defaultValues],
  );

  const handleSubmit = async (formData: SEOMetadataFormData) => {
    if (!id) return;
    try {
      setSaving(true);
      await updateSeoMetadata(parseInt(id, 10), {
        pageName: formData.pageName,
        pageSlug: formData.pageSlug,
        metaTitle: formData.metaTitle,
        metaDescription: formData.metaDescription,
        metaKeywords: formData.metaKeywords,
        canonicalUrl: formData.canonicalUrl,
        ogTitle: formData.ogTitle,
        ogDescription: formData.ogDescription,
        ogImageUrl: formData.ogImageUrl,
        robots: formData.robots,
      });
      alert("SEO metadata updated successfully!");
      navigate(`/seo-metadata/${id}/edit`);
    } catch (err: unknown) {
      console.error("Failed to update SEO metadata", err);
      const msg =
        err && typeof err === "object" && "response" in err
          ? (err as { response?: { data?: { message?: string } } }).response?.data?.message
          : undefined;
      alert(msg || "Failed to update SEO metadata");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-full min-h-[400px] items-center justify-center">
        <p className="text-gray-500">Loading SEO metadata...</p>
      </div>
    );
  }

  if (error || !defaultValues) {
    return (
      <div className="flex h-full min-h-[400px] items-center justify-center">
        <p className="text-red-500">{error || "SEO Metadata not found"}</p>
      </div>
    );
  }

  return (
    <>
      <PageMeta
        title="Edit SEO Metadata | StudyCafe Admin"
        description="Edit SEO metadata for studycafe.in"
      />
      <PageBreadcrumb
        pageTitle="Edit SEO Metadata"
        compact
        actions={<BackLink to="/seo-metadata">Back to SEO Metadata</BackLink>}
      />
      <SEOMetadataForm
        mode="edit"
        defaultValues={defaultValues}
        loading={saving}
        pagesLoading={false}
        disablePageSelect
        pageOptions={pageOptions}
        onSubmit={handleSubmit}
      />
    </>
  );
}
