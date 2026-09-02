import Label from "../../../components/form/Label";
import Input from "../../../components/form/input/InputField";
import {
    POST_PURCHASE_LINK_TYPES,
    defaultLabelFor,
    emptyPostPurchaseLink,
    urlPlaceholderFor,
    type PostPurchaseLink,
    type PostPurchaseLinkType,
} from "./postPurchase";

export default function PostPurchaseLinksEditor({
    value,
    onChange,
}: {
    value: PostPurchaseLink[];
    onChange: (links: PostPurchaseLink[]) => void;
}) {
    const updateLink = (index: number, patch: Partial<PostPurchaseLink>) => {
        onChange(value.map((link, i) => (i === index ? { ...link, ...patch } : link)));
    };

    /**
     * Switching type also swaps the button text, but only while the admin has not
     * written their own — never overwrite a customised label.
     */
    const handleTypeChange = (index: number, type: PostPurchaseLinkType) => {
        const current = value[index];
        const isDefaultLabel =
            current.label.trim() === "" || current.label.trim() === defaultLabelFor(current.type);
        updateLink(index, { type, ...(isDefaultLabel ? { label: defaultLabelFor(type) } : {}) });
    };

    return (
        <div className="space-y-3">
            {value.length === 0 && (
                <p className="rounded-lg border border-dashed border-gray-300 px-4 py-6 text-center text-sm text-gray-400 dark:border-gray-700">
                    No links yet. Buyers will see the standard thank-you page.
                </p>
            )}

            {value.map((link, idx) => (
                <div
                    key={idx}
                    className="rounded-xl border border-gray-200 bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-900/50"
                >
                    <div className="flex items-start gap-3">
                        <div className="grid flex-1 grid-cols-1 gap-3 sm:grid-cols-6">
                            <div className="sm:col-span-2">
                                <Label>Type</Label>
                                <select
                                    value={link.type}
                                    onChange={(e) =>
                                        handleTypeChange(idx, e.target.value as PostPurchaseLinkType)
                                    }
                                    className="h-11 w-full rounded-lg border border-gray-300 bg-white px-3 text-sm text-gray-700 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200"
                                >
                                    {POST_PURCHASE_LINK_TYPES.map((t) => (
                                        <option key={t.value} value={t.value}>
                                            {t.name}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div className="sm:col-span-4">
                                <Label>Button Text</Label>
                                <Input
                                    value={link.label}
                                    onChange={(e) => updateLink(idx, { label: e.target.value })}
                                    placeholder={defaultLabelFor(link.type)}
                                />
                            </div>
                            <div className="sm:col-span-6">
                                <Label>Link URL</Label>
                                <Input
                                    type="url"
                                    value={link.url}
                                    onChange={(e) => updateLink(idx, { url: e.target.value })}
                                    placeholder={urlPlaceholderFor(link.type)}
                                />
                            </div>
                        </div>
                        <button
                            type="button"
                            onClick={() => onChange(value.filter((_, i) => i !== idx))}
                            className="mt-7 rounded-lg p-1.5 text-gray-400 hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-500/10"
                            title="Remove link"
                        >
                            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>
                </div>
            ))}

            <button
                type="button"
                onClick={() => onChange([...value, emptyPostPurchaseLink()])}
                className="inline-flex items-center gap-1 rounded-lg bg-brand-50 px-3 py-1.5 text-xs font-medium text-brand-600 transition hover:bg-brand-100 dark:bg-brand-500/10 dark:text-brand-400 dark:hover:bg-brand-500/20"
            >
                + Add Link
            </button>
        </div>
    );
}
