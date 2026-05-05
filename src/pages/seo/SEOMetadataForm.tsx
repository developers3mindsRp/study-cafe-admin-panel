import { useState } from "react";
import { Link } from "react-router";
import Label from "../../components/form/Label";
import Input from "../../components/form/input/InputField";
import Button from "../../components/ui/button/Button";
import MetaFieldsForm, { type SEOMetaFields, emptySEOMetaFields } from "../../components/form/MetaFieldsForm";
import { slugifyUrlPath, shouldResyncSlugFromSource } from "../../lib/slug";

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
}

const emptyFormData: SEOMetadataFormData = {
  pageName: "",
  pageSlug: "",
  ...emptySEOMetaFields,
};

function pagePathFromName(name: string): string {
  const t = name.trim();
  if (!t) return "";
  return slugifyUrlPath(t);
}

export default function SEOMetadataForm({
  mode,
  defaultValues,
  loading = false,
  onSubmit,
}: SEOMetadataFormProps) {
  const [formData, setFormData] = useState<SEOMetadataFormData>({
    ...emptyFormData,
    ...defaultValues,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      ...formData,
      pageSlug: slugifyUrlPath(formData.pageSlug),
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

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] sm:p-6">
        <h3 className="mb-4 text-lg font-semibold text-gray-800 dark:text-white/90">
          Page
        </h3>
        <div className="space-y-4">
          <div>
            <Label>Page Name <span className="text-error-500">*</span></Label>
            <Input
              value={formData.pageName}
              onChange={(e) => {
                const pageName = e.target.value;
                setFormData((prev) => {
                  const keepSync = shouldResyncSlugFromSource(
                    prev.pageSlug,
                    prev.pageName,
                    pagePathFromName,
                  );
                  const pageSlug =
                    keepSync
                      ? pagePathFromName(pageName)
                      : prev.pageSlug;
                  return { ...prev, pageName, pageSlug };
                });
              }}
              placeholder="e.g. Home, About, Privacy Policy"
              required
            />
          </div>
          <div>
            <Label>Page Slug / Path</Label>
            <Input
              value={formData.pageSlug}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  pageSlug: e.target.value,
                }))
              }
              onBlur={() =>
                setFormData((prev) => ({
                  ...prev,
                  pageSlug: slugifyUrlPath(prev.pageSlug),
                }))
              }
              placeholder="e.g. /, /about, /privacy-policy"
              required
            />
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              Use only for static pages (e.g. /about, /privacy-policy). Do not use
              course or article slugs; those pages use their own SEO fields.
            </p>
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
          disabled={loading}
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
