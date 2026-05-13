import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import PageMeta from "../../components/common/PageMeta";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import BackLink from "../../components/common/BackLink";
import SEOMetadataForm, { type SEOMetadataFormData } from "./SEOMetadataForm";
import {
  createSeoMetadata,
  fetchSeoEligiblePages,
  fetchSeoMetadata,
  type SeoEligiblePage,
} from "../../api/seo";
import { normalizeAdminSeoPath } from "../../lib/slug";

function sortSeoPages(a: SeoEligiblePage, b: SeoEligiblePage): number {
  const pa = normalizeAdminSeoPath(a.path);
  const pb = normalizeAdminSeoPath(b.path);
  if (pa === "/") return -1;
  if (pb === "/") return 1;
  return pa.localeCompare(pb);
}

export default function SEOMetadataCreate() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [pageOptions, setPageOptions] = useState<SeoEligiblePage[]>([]);
  const [pagesLoading, setPagesLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setPagesLoading(true);
      try {
        const [routes, existing] = await Promise.all([
          fetchSeoEligiblePages(),
          fetchSeoMetadata(),
        ]);
        if (cancelled) return;
        const used = new Set(
          existing.map((e) => normalizeAdminSeoPath(e.pageSlug)),
        );
        const open = routes
          .filter((r) => !used.has(normalizeAdminSeoPath(r.path)))
          .sort(sortSeoPages);
        setPageOptions(open);
      } catch (err) {
        console.error("Failed to load SEO page list", err);
        alert("Failed to load the site page list for SEO metadata.");
      } finally {
        if (!cancelled) setPagesLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const handleSubmit = async (formData: SEOMetadataFormData) => {
    try {
      setLoading(true);
      await createSeoMetadata({
        pageName: formData.pageName,
        pageSlug: formData.pageSlug,
        metaTitle: formData.metaTitle || formData.pageName,
        metaDescription: formData.metaDescription || "",
        metaKeywords: formData.metaKeywords || "",
        canonicalUrl: formData.canonicalUrl || "",
        ogTitle: formData.ogTitle || "",
        ogDescription: formData.ogDescription || "",
        ogImageUrl: formData.ogImageUrl || "",
        robots: formData.robots || "index, follow",
      });
      navigate("/seo-metadata");
    } catch (err: unknown) {
      console.error("Failed to create SEO metadata", err);
      const msg =
        err && typeof err === "object" && "response" in err
          ? (err as { response?: { data?: { message?: string } } }).response?.data?.message
          : undefined;
      alert(msg || "Failed to create SEO metadata");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <PageMeta
        title="Create SEO Metadata | StudyCafe Admin"
        description="Add new SEO metadata for studycafe.in"
      />
      <PageBreadcrumb
        pageTitle="Create SEO Metadata"
        compact
        actions={
          <BackLink to="/seo-metadata">Back to SEO Metadata</BackLink>
        }
      />
      <SEOMetadataForm
        mode="create"
        loading={loading}
        pagesLoading={pagesLoading}
        pageOptions={pageOptions}
        onSubmit={handleSubmit}
      />
    </>
  );
}
