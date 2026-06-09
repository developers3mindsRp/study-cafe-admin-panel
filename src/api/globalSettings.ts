import { api } from "./axios";

/** All keys in global_settings (tracking_*, site_display_ads, affiliate_*, future). */
export async function fetchGlobalSettings(): Promise<Record<string, string | null>> {
    const res = await api.get<Record<string, string | null>>("/admin/platform/global-settings");
    return res.data ?? {};
}

export async function updateGlobalSetting(key: string, value: string | null): Promise<void> {
    await api.put(`/admin/platform/global-settings/${encodeURIComponent(key)}`, { value });
}
