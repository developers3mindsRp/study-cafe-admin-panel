import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router";
import PageMeta from "../../components/common/PageMeta";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import { categoriesApi } from "../../api/categories";

export default function CategoryEdit() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [name, setName] = useState("");
    const [slug, setSlug] = useState("");
    const [saving, setSaving] = useState(false);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!id) return;
        setLoading(true);
        categoriesApi
            .get(id)
            .then((cat) => {
                setName(cat.name || "");
                setSlug(cat.slug || "");
            })
            .catch((err) => {
                console.error("Failed to load category", err);
                setError("Failed to load category");
            })
            .finally(() => setLoading(false));
    }, [id]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!name.trim()) {
            setError("Name is required");
            return;
        }
        if (!id) return;
        setSaving(true);
        setError(null);
        try {
            await categoriesApi.update(id, { name: name.trim(), slug: slug.trim() || undefined } as any);
            navigate("/article-categories");
        } catch (err: any) {
            setError(err?.response?.data?.message || "Failed to update category");
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <>
                <PageMeta title="Edit Article Category | StudyCafe Admin" description="Edit article category" />
                <PageBreadcrumb pageTitle="Edit Article Category" />
                <div className="flex justify-center py-20">
                    <div className="h-8 w-8 animate-spin rounded-full border-4 border-brand-500 border-t-transparent" />
                </div>
            </>
        );
    }

    return (
        <>
            <PageMeta
                title="Edit Article Category | StudyCafe Admin"
                description="Edit article category"
            />
            <PageBreadcrumb pageTitle="Edit Article Category" />
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
                                onChange={(e) => setName(e.target.value)}
                                className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-brand-500 focus:ring-1 focus:ring-brand-500 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                                placeholder="e.g. Income Tax"
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
                                className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-brand-500 focus:ring-1 focus:ring-brand-500 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                                placeholder="income-tax"
                                maxLength={200}
                            />
                            <p className="mt-1 text-xs text-gray-400">
                                Leave empty to keep the current slug.
                            </p>
                        </div>
                        </div>
                        <div className="flex gap-3 pt-2">
                            <button
                                type="submit"
                                disabled={saving}
                                className="inline-flex items-center justify-center rounded-lg bg-brand-500 px-5 py-2.5 text-sm font-medium text-white hover:bg-brand-600 disabled:opacity-50"
                            >
                                {saving ? "Saving..." : "Update Category"}
                            </button>
                            <button
                                type="button"
                                onClick={() => navigate("/article-categories")}
                                className="inline-flex items-center justify-center rounded-lg border border-gray-300 px-5 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-800"
                            >
                                Cancel
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </>
    );
}
