import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import PageMeta from "../../components/common/PageMeta";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import BackLink from "../../components/common/BackLink";
import SEOMetadataForm, { type SEOMetadataFormData } from "./SEOMetadataForm";
import { fetchSiteSeoRoutes } from "../../api/siteSeoRoutes";
import {
  buildSeoSitePagePickerOptions,
  createSeoMetadata,
  fetchSeoMetadata,
  type SeoEligiblePage,
} from "../../api/seo";

export default function SEOMetadataCreate() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [pageOptions, setPageOptions] = useState<SeoEligiblePage[]>([]);
  const [pagesLoading, setPagesLoading] = useState(true);
  const [sitePageCount, setSitePageCount] = useState<number | null>(null);
  const [pagesLoadError, setPagesLoadError] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setPagesLoading(true);
      setPagesLoadError(false);
      try {
        const [siteRoutes, existingSeo] = await Promise.all([
          fetchSiteSeoRoutes(),
          fetchSeoMetadata(),
        ]);
        if (cancelled) return;
        setPageOptions(buildSeoSitePagePickerOptions(siteRoutes, existingSeo));
        setSitePageCount(siteRoutes.length);
      } catch (err) {
        console.error("Failed to load SEO page list", err);
        if (!cancelled) {
          setPagesLoadError(true);
          setSitePageCount(null);
          setPageOptions([]);
        }
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
        pagesLoadError={pagesLoadError}
        sitePageCount={sitePageCount}
        pageOptions={pageOptions}
        onSubmit={handleSubmit}
      />
    </>
  );
}
