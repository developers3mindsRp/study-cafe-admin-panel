import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router";
import PageMeta from "../../components/common/PageMeta";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import { categoriesApi } from "../../api/categories";
import { slugifyForSeo, shouldResyncSlugFromSource } from "../../lib/slug";

export default function CategoryEdit() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [name, setName] = useState("");
    const [slug, setSlug] = useState("");
    const [whatsappLinks, setWhatsappLinks] = useState<string[]>([""]);
    const [telegramLinks, setTelegramLinks] = useState<string[]>([""]);
    const [googleNewsUrl, setGoogleNewsUrl] = useState("");
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
                setWhatsappLinks(cat.whatsapp_links?.length ? cat.whatsapp_links : [""]);
                setTelegramLinks(cat.telegram_links?.length ? cat.telegram_links : [""]);
                setGoogleNewsUrl(cat.google_news_url || "");
            })
            .catch((err) => {
                console.error("Failed to load category", err);
                setError("Failed to load category");
            })
            .finally(() => setLoading(false));
    }, [id]);

    const handleNameChange = (value: string) => {
        setSlug((prevSlug) =>
            shouldResyncSlugFromSource(prevSlug, name, (t) => slugifyForSeo(t))
                ? slugifyForSeo(value)
                : prevSlug,
        );
        setName(value);
    };

    const handleLinkChange = (
        list: string[],
        setList: (v: string[]) => void,
        index: number,
        value: string,
    ) => {
        const updated = [...list];
        updated[index] = value;
        setList(updated);
    };

    const addLink = (list: string[], setList: (v: string[]) => void) => {
        setList([...list, ""]);
    };

    const removeLink = (list: string[], setList: (v: string[]) => void, index: number) => {
        const updated = list.filter((_, i) => i !== index);
        setList(updated.length > 0 ? updated : [""]);
    };

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
            await categoriesApi.update(id, {
                name: name.trim(),
                slug: slug.trim() ? slugifyForSeo(slug) : undefined,
                whatsapp_links: whatsappLinks.map((l) => l.trim()).filter(Boolean),
                telegram_links: telegramLinks.map((l) => l.trim()).filter(Boolean),
                google_news_url: googleNewsUrl.trim() || undefined,
            } as any);
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

                        {/* Name + Slug */}
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
                                    onBlur={(e) => setSlug(slugifyForSeo(e.target.value))}
                                    className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-brand-500 focus:ring-1 focus:ring-brand-500 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                                    placeholder="income-tax"
                                    maxLength={200}
                                />
                                <p className="mt-1 text-xs text-gray-400">
                                    Leave empty to keep the current slug.
                                </p>
                            </div>
                        </div>

                        {/* WhatsApp Links */}
                        <div>
                            <div className="mb-1.5 flex items-center justify-between">
                                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                    WhatsApp Group Links
                                </label>
                                <button
                                    type="button"
                                    onClick={() => addLink(whatsappLinks, setWhatsappLinks)}
                                    className="flex items-center gap-1 rounded-md border border-green-500 px-2.5 py-1 text-xs font-medium text-green-600 hover:bg-green-50 dark:border-green-400 dark:text-green-400 dark:hover:bg-green-500/10"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor">
                                        <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
                                    </svg>
                                    Add Link
                                </button>
                            </div>
                            <div className="space-y-2">
                                {whatsappLinks.map((link, idx) => (
                                    <div key={idx} className="flex items-center gap-2">
                                        <input
                                            type="url"
                                            value={link}
                                            onChange={(e) => handleLinkChange(whatsappLinks, setWhatsappLinks, idx, e.target.value)}
                                            className="flex-1 rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-brand-500 focus:ring-1 focus:ring-brand-500 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                                            placeholder="https://chat.whatsapp.com/..."
                                        />
                                        {whatsappLinks.length > 1 && (
                                            <button
                                                type="button"
                                                onClick={() => removeLink(whatsappLinks, setWhatsappLinks, idx)}
                                                className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg border border-gray-300 text-gray-400 hover:border-error-300 hover:text-error-500 dark:border-gray-600 dark:hover:border-error-500"
                                            >
                                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                                                    <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                                                </svg>
                                            </button>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Telegram Links */}
                        <div>
                            <div className="mb-1.5 flex items-center justify-between">
                                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                    Telegram Group Links
                                </label>
                                <button
                                    type="button"
                                    onClick={() => addLink(telegramLinks, setTelegramLinks)}
                                    className="flex items-center gap-1 rounded-md border border-blue-500 px-2.5 py-1 text-xs font-medium text-blue-600 hover:bg-blue-50 dark:border-blue-400 dark:text-blue-400 dark:hover:bg-blue-500/10"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor">
                                        <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
                                    </svg>
                                    Add Link
                                </button>
                            </div>
                            <div className="space-y-2">
                                {telegramLinks.map((link, idx) => (
                                    <div key={idx} className="flex items-center gap-2">
                                        <input
                                            type="url"
                                            value={link}
                                            onChange={(e) => handleLinkChange(telegramLinks, setTelegramLinks, idx, e.target.value)}
                                            className="flex-1 rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-brand-500 focus:ring-1 focus:ring-brand-500 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                                            placeholder="https://t.me/..."
                                        />
                                        {telegramLinks.length > 1 && (
                                            <button
                                                type="button"
                                                onClick={() => removeLink(telegramLinks, setTelegramLinks, idx)}
                                                className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg border border-gray-300 text-gray-400 hover:border-error-300 hover:text-error-500 dark:border-gray-600 dark:hover:border-error-500"
                                            >
                                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                                                    <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                                                </svg>
                                            </button>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Google News URL */}
                        <div>
                            <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
                                Google News URL
                            </label>
                            <input
                                type="url"
                                value={googleNewsUrl}
                                onChange={(e) => setGoogleNewsUrl(e.target.value)}
                                className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-brand-500 focus:ring-1 focus:ring-brand-500 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                                placeholder="https://news.google.com/..."
                            />
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
