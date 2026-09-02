/**
 * Shape and (de)serialization for a course's post-purchase ("thank you" page) configuration:
 * the join buttons shown to a buyer and the optional redirect that follows them.
 */

/** Controls the icon and accent colour of the button rendered on the thank-you page. */
export type PostPurchaseLinkType = "whatsapp" | "zoom" | "telegram" | "link";

export interface PostPurchaseLink {
    type: PostPurchaseLinkType;
    /** Button text shown to the buyer — fully editable per link. */
    label: string;
    url: string;
}

export const POST_PURCHASE_LINK_TYPES: {
    value: PostPurchaseLinkType;
    name: string;
    defaultLabel: string;
    urlPlaceholder: string;
}[] = [
    {
        value: "whatsapp",
        name: "WhatsApp Group",
        defaultLabel: "Click Here to Join WhatsApp Group",
        urlPlaceholder: "https://chat.whatsapp.com/...",
    },
    {
        value: "zoom",
        name: "Zoom Meeting",
        defaultLabel: "Click Here to Join Zoom Meeting",
        urlPlaceholder: "https://zoom.us/j/...",
    },
    {
        value: "telegram",
        name: "Telegram Group",
        defaultLabel: "Click Here to Join Telegram Group",
        urlPlaceholder: "https://t.me/...",
    },
    {
        value: "link",
        name: "Other Link",
        defaultLabel: "Click Here",
        urlPlaceholder: "https://...",
    },
];

/** Matches the server-side cap, so the form cannot save a value the API would clamp. */
export const POST_PURCHASE_DELAY_MAX_SECONDS = 600;

export const defaultLabelFor = (type: PostPurchaseLinkType) =>
    POST_PURCHASE_LINK_TYPES.find((t) => t.value === type)?.defaultLabel ?? "";

export const urlPlaceholderFor = (type: PostPurchaseLinkType) =>
    POST_PURCHASE_LINK_TYPES.find((t) => t.value === type)?.urlPlaceholder ?? "https://...";

export const emptyPostPurchaseLink = (): PostPurchaseLink => ({
    type: "whatsapp",
    label: defaultLabelFor("whatsapp"),
    url: "",
});

/** Reads the JSON column back into form state, tolerating legacy/partial rows. */
export function parsePostPurchaseLinks(raw: string | null | undefined): PostPurchaseLink[] {
    if (!raw) return [];
    let parsed: unknown;
    try {
        parsed = JSON.parse(raw);
    } catch {
        return [];
    }
    if (!Array.isArray(parsed)) return [];
    return parsed.map((entry): PostPurchaseLink => {
        const item = (entry ?? {}) as Record<string, unknown>;
        const type = POST_PURCHASE_LINK_TYPES.some((t) => t.value === item.type)
            ? (item.type as PostPurchaseLinkType)
            : "link";
        return {
            type,
            label: typeof item.label === "string" ? item.label : defaultLabelFor(type),
            url: typeof item.url === "string" ? item.url : "",
        };
    });
}

/** Drops blank rows and returns the JSON string to store, or null when nothing is configured. */
export function serializePostPurchaseLinks(links: PostPurchaseLink[] | undefined): string | null {
    const cleaned = (links ?? [])
        .map((link) => ({
            type: link.type,
            label: link.label.trim() || defaultLabelFor(link.type),
            url: link.url.trim(),
        }))
        .filter((link) => link.url !== "");
    return cleaned.length ? JSON.stringify(cleaned) : null;
}

/** Blank / invalid input means "use the default countdown", which the server decides. */
export function serializePostPurchaseDelay(raw: string | undefined): number | null {
    const seconds = Number.parseInt((raw ?? "").trim(), 10);
    if (!Number.isFinite(seconds) || seconds < 0) return null;
    return Math.min(seconds, POST_PURCHASE_DELAY_MAX_SECONDS);
}
