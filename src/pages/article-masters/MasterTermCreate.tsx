import { useState } from "react";
import { Link, Navigate, useNavigate, useParams } from "react-router";
import PageMeta from "../../components/common/PageMeta";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import { getMasterApi, getMasterKindConfig } from "../../api/articleMasters";
import { slugifyForSeo, shouldResyncSlugFromSource } from "../../lib/slug";

export default function MasterTermCreate() {
  const { kind: kindParam } = useParams<{ kind: string }>();
  const config = getMasterKindConfig(kindParam);
  const navigate = useNavigate();

  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!config) {
    return <Navigate to="/article-masters/tags" replace />;
  }

  const handleNameChange = (value: string) => {
    setSlug((prevSlug) =>
      shouldResyncSlugFromSource(prevSlug, name, (t) => slugifyForSeo(t))
        ? slugifyForSeo(value)
        : prevSlug,
    );
    setName(value);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError("Name is required");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      await getMasterApi(config.kind).create({
        name: name.trim(),
        slug: slug.trim() ? slugifyForSeo(slug) : undefined,
      });
      navigate(config.listPath);
    } catch (err: unknown) {
      setError(
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
          `Failed to create ${config.labelSingular.toLowerCase()}`,
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <PageMeta
        title={`Create ${config.labelSingular} | StudyCafe Admin`}
        description={`Create a new ${config.labelSingular.toLowerCase()}`}
      />
      <PageBreadcrumb pageTitle={`Create ${config.labelSingular}`} />
      <div className="mx-auto">
        <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/[0.03]">
          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <div className="rounded-lg bg-error-50 p-3 text-sm text-error-600 dark:bg-error-500/10 dark:text-error-400">
                {error}
              </div>
            )}

            <div className="flex w-full gap-3">
              <div className="w-1/2">
                <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Name <span className="text-error-500">*</span>
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => handleNameChange(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-brand-500 focus:ring-1 focus:ring-brand-500 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                  placeholder={`e.g. ${config.labelSingular}`}
                  maxLength={200}
                  required
                />
              </div>
              <div className="w-1/2">
                <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Slug
                </label>
                <input
                  type="text"
                  value={slug}
                  onChange={(e) => setSlug(e.target.value)}
                  onBlur={(e) => setSlug(slugifyForSeo(e.target.value))}
                  className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-brand-500 focus:ring-1 focus:ring-brand-500 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                  placeholder="auto-generated"
                  maxLength={200}
                />
                <p className="mt-1 text-xs text-gray-400">Auto-generated from name if left empty.</p>
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                type="submit"
                disabled={saving}
                className="inline-flex items-center justify-center rounded-lg bg-brand-500 px-5 py-2.5 text-sm font-medium text-white hover:bg-brand-600 disabled:opacity-50"
              >
                {saving ? "Saving..." : `Create ${config.labelSingular}`}
              </button>
              <Link
                to={config.listPath}
                className="inline-flex items-center justify-center rounded-lg border border-gray-300 px-5 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-800"
              >
                Cancel
              </Link>
            </div>
          </form>
        </div>
      </div>
    </>
  );
}
