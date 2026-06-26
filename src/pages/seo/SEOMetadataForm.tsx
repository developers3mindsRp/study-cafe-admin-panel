import { useState, type FormEvent } from "react";
import { Link } from "react-router";
import Label from "../../components/form/Label";
import Button from "../../components/ui/button/Button";
import MetaFieldsForm, { type SEOMetaFields, emptySEOMetaFields } from "../../components/form/MetaFieldsForm";
import { normalizeAdminSeoPath } from "../../lib/slug";
import type { SeoEligiblePage } from "../../api/seo";

export interface SEOMetadataFormData {
  pageName: string;
  pageSlug: string;
  metaTitle: string;
  metaDescription: string;
  metaKeywords: string;
  canonicalUrl: string;
  ogTitle: string;
  ogDescription: string;
  ogImageUrl: string;
  robots: "index, follow" | "noindex, nofollow" | "index, nofollow" | "noindex, follow";
}

interface SEOMetadataFormProps {
  mode: "create" | "edit";
  defaultValues?: Partial<SEOMetadataFormData>;
  loading?: boolean;
  onSubmit: (data: SEOMetadataFormData) => void;
  pageOptions: SeoEligiblePage[];
  pagesLoading?: boolean;
  /** Total configured site pages (Site pages URLs), for empty-state messaging on create. */
  sitePageCount?: number | null;
  /** When true, the site page list failed to load. */
  pagesLoadError?: boolean;
  /** When true (e.g. edit), path is fixed — only meta fields update. */
  disablePageSelect?: boolean;
}

const emptyFormData: SEOMetadataFormData = {
  pageName: "",
  pageSlug: "",
  ...emptySEOMetaFields,
};

export default function SEOMetadataForm({
  mode,
  defaultValues,
  loading = false,
  onSubmit,
  pageOptions,
  pagesLoading = false,
  sitePageCount = null,
  pagesLoadError = false,
  disablePageSelect = false,
}: SEOMetadataFormProps) {
  const [formData, setFormData] = useState<SEOMetadataFormData>({
    ...emptyFormData,
    ...defaultValues,
  });

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    const slug = normalizeAdminSeoPath(formData.pageSlug);
    if (mode === "create") {
      const selected = pageOptions.find(
        (o) => normalizeAdminSeoPath(o.path) === slug,
      );
      if (selected?.hasSeo) {
        alert(
          "SEO metadata already exists for this path. Edit it from the SEO Metadata list.",
        );
        return;
      }
    }
    onSubmit({
      ...formData,
      pageSlug: slug,
      pageName: formData.pageName.trim() || slug || formData.pageName,
    });
  };

  const slugNorm = normalizeAdminSeoPath(formData.pageSlug);
  const selectValue =
    mode === "create" && slugNorm === "" ? "" : slugNorm;

  const onPageSelectChange = (rawPath: string) => {
    if (rawPath === "") {
      setFormData((prev) => ({ ...prev, pageSlug: "", pageName: "" }));
      return;
    }
    const path = normalizeAdminSeoPath(rawPath);
    const opt = pageOptions.find(
      (o) => normalizeAdminSeoPath(o.path) === path,
    );
    setFormData((prev) => {
      const label = opt?.label?.trim() || path || "";
      const nextMeta =
        mode === "create" && !(prev.metaTitle ?? "").trim() && label
          ? label
          : prev.metaTitle;
      return {
        ...prev,
        pageSlug: path,
        pageName: label,
        metaTitle: nextMeta,
      };
    });
  };

  const submitLabel = mode === "create" ? "Create SEO Metadata" : "Update SEO Metadata";

  const metaFields: Partial<SEOMetaFields> = {
    metaTitle: formData.metaTitle,
    metaDescription: formData.metaDescription,
    metaKeywords: formData.metaKeywords,
    canonicalUrl: formData.canonicalUrl,
    robots: formData.robots,
    ogTitle: formData.ogTitle,
    ogDescription: formData.ogDescription,
    ogImageUrl: formData.ogImageUrl,
  };

  const updateMetaFields = (patch: Partial<SEOMetaFields>) => {
    setFormData((prev) => ({ ...prev, ...patch }));
  };

  const selectClass =
    "w-full rounded-lg border border-gray-200 bg-white px-4 py-3 text-sm text-gray-800 dark:border-gray-800 dark:bg-white/[0.03] dark:text-white/90 disabled:cursor-not-allowed disabled:opacity-70";

  const creatablePageOptions =
    mode === "create"
      ? pageOptions.filter((o) => !o.hasSeo)
      : pageOptions;
  const hasValidCreateSelection =
    mode !== "create"
    || creatablePageOptions.some(
      (o) => normalizeAdminSeoPath(o.path) === slugNorm,
    );

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] sm:p-6">
        <h3 className="mb-4 text-lg font-semibold text-gray-800 dark:text-white/90">
          Page
        </h3>
        <div className="space-y-4">
          <div>
            <Label>
              Site page{" "}
              <span className="text-error-500">*</span>
            </Label>
            {pagesLoading ? (
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Loading page list…
              </p>
            ) : (
              <>
                <select
                  className={selectClass}
                  value={selectValue}
                  disabled={disablePageSelect || loading}
                  required={!disablePageSelect}
                  onChange={(e) =>
                    onPageSelectChange(e.target.value)
                  }
                >
                  {mode === "create" && (
                    <option value="">Select a page…</option>
                  )}
                  {normalizeAdminSeoPath(formData.pageSlug) !== "" &&
                  !pageOptions.some(
                    (o) =>
                      normalizeAdminSeoPath(o.path)
                      === normalizeAdminSeoPath(formData.pageSlug),
                  ) ? (
                    <option
                      key={`orphan:${normalizeAdminSeoPath(formData.pageSlug)}`}
                      value={normalizeAdminSeoPath(formData.pageSlug)}
                    >
                      {`${formData.pageName || formData.pageSlug} (${normalizeAdminSeoPath(formData.pageSlug)})`}
                    </option>
                  ) : null}
                  {pageOptions.map((o) => {
                    const path = normalizeAdminSeoPath(o.path);
                    const optionDisabled =
                      mode === "create" && Boolean(o.hasSeo);
                    return (
                      <option
                        key={path}
                        value={path}
                        disabled={optionDisabled}
                      >
                        {o.label}
                        {" "}
                        (
                        {path}
                        )
                      </option>
                    );
                  })}
                </select>
                {mode === "create" &&
                !pagesLoading &&
                !pagesLoadError &&
                sitePageCount === 0 ? (
                  <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                    No site pages are configured yet. Add paths under{" "}
                    <Link
                      className="text-brand-600 hover:underline dark:text-brand-400"
                      to="/seo-metadata/site-pages"
                    >
                      Site pages (URLs)
                    </Link>
                    {" "}
                    before creating SEO metadata.
                  </p>
                ) : null}
                {mode === "create" && pagesLoadError ? (
                  <p className="mt-1 text-xs text-error-500">
                    Could not load the site page list. Refresh the page or check your connection.
                  </p>
                ) : null}
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  The list comes from{" "}
                  <Link className="text-brand-600 hover:underline dark:text-brand-400" to="/seo-metadata/site-pages">
                    Site pages (URLs)
                  </Link>
                  . Pages that already have SEO are disabled — edit them from the{" "}
                  <Link className="text-brand-600 hover:underline dark:text-brand-400" to="/seo-metadata">
                    SEO Metadata list
                  </Link>
                  . Courses and articles use their own SEO fields.
                </p>
              </>
            )}
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] sm:p-6">
        <h3 className="mb-4 text-lg font-semibold text-gray-800 dark:text-white/90">
          Meta Tags &amp; Open Graph
        </h3>
        <MetaFieldsForm
          value={metaFields}
          onChange={updateMetaFields}
        />
      </div>

      <div className="flex gap-3">
        <button
          type="submit"
          disabled={
            loading ||
            pagesLoading ||
            (mode === "create"
              ? creatablePageOptions.length === 0
                || !hasValidCreateSelection
              : false)
          }
          className="inline-flex items-center justify-center gap-2 rounded-lg px-4 py-3 text-sm font-medium text-white transition bg-brand-500 shadow-theme-xs hover:bg-brand-600 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? "Saving..." : submitLabel}
        </button>
        <Link to="/seo-metadata">
          <Button variant="outline" size="sm">
            Cancel
          </Button>
        </Link>
      </div>
    </form>
  );
}
