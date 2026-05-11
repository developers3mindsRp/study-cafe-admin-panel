import { useState, useEffect } from "react";
import PageMeta from "../../components/common/PageMeta";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import Label from "../../components/form/Label";
import Button from "../../components/ui/button/Button";
import TextArea from "../../components/form/input/TextArea";
import { fetchGlobalSettings, updateGlobalSetting } from "../../api/globalSettings";
import { useAuth } from "../../context/AuthContext";

export default function GlobalSettings() {
    const { hasPermission } = useAuth();
    const canEdit = hasPermission("global_settings:edit");

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [trackingMetaPixel, setTrackingMetaPixel] = useState("");
    const [trackingGoogleAnalytics, setTrackingGoogleAnalytics] = useState("");
    const [trackingLinkedinPixel, setTrackingLinkedinPixel] = useState("");

    useEffect(() => {
        (async () => {
            try {
                const settings = await fetchGlobalSettings();
                setTrackingMetaPixel(settings.tracking_meta_pixel ?? "");
                setTrackingGoogleAnalytics(settings.tracking_google_analytics ?? "");
                setTrackingLinkedinPixel(settings.tracking_linkedin_pixel ?? "");
            } catch (err) {
                console.error("Failed to load global settings", err);
            } finally {
                setLoading(false);
            }
        })();
    }, []);

    const handleSave = async () => {
        if (!canEdit) return;
        setSaving(true);
        try {
            await Promise.all([
                updateGlobalSetting("tracking_meta_pixel", trackingMetaPixel.trim() || null),
                updateGlobalSetting("tracking_google_analytics", trackingGoogleAnalytics.trim() || null),
                updateGlobalSetting("tracking_linkedin_pixel", trackingLinkedinPixel.trim() || null),
            ]);
            alert("Global settings saved successfully!");
        } catch (err) {
            console.error("Failed to save global settings", err);
            alert("Failed to save settings");
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return <div className="flex items-center justify-center p-20"><p className="text-gray-500">Loading…</p></div>;
    }

    return (
        <>
            <PageMeta title="Global Settings | StudyCafe Admin" description="Site-wide options for the public storefront" />
            <PageBreadcrumb pageTitle="Global Settings" />

            <div className="space-y-6">
                {!canEdit && (
                    <p className="rounded-lg border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-600 dark:border-gray-800 dark:bg-white/[0.03] dark:text-gray-400">
                        You have view-only access. Ask a super admin to grant <span className="font-mono text-xs">global_settings:edit</span> to change these values.
                    </p>
                )}

                <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] sm:p-6">
                    <h3 className="mb-4 text-lg font-semibold text-gray-800 dark:text-white/90">Marketing &amp; analytics</h3>
                    <div className="space-y-5">
                        <div>
                            <Label>Google Tag Manager / Google Analytics (gtag)</Label>
                            <TextArea
                                rows={8}
                                className="font-mono text-xs"
                                placeholder="GTM container snippet + gtag (and GTM noscript iframe if you use it)"
                                value={trackingGoogleAnalytics}
                                onChange={setTrackingGoogleAnalytics}
                                disabled={!canEdit}
                            />
                        </div>
                        <div>
                            <Label>Meta (Facebook) Pixel</Label>
                            <TextArea
                                rows={8}
                                className="font-mono text-xs"
                                placeholder="Meta Pixel base code from Events Manager (script + noscript)"
                                value={trackingMetaPixel}
                                onChange={setTrackingMetaPixel}
                                disabled={!canEdit}
                            />
                        </div>
                        <div>
                            <Label>LinkedIn Insight Tag · other third-party scripts</Label>
                            <TextArea
                                rows={8}
                                className="font-mono text-xs"
                                placeholder="LinkedIn, OneSignal, retargeting scripts, etc."
                                value={trackingLinkedinPixel}
                                onChange={setTrackingLinkedinPixel}
                                disabled={!canEdit}
                            />
                        </div>
                    </div>
                </div>

                {canEdit && (
                    <div className="flex justify-end gap-2">
                        <Button type="button" size="sm" onClick={handleSave} disabled={saving}>
                            {saving ? "Saving…" : "Save"}
                        </Button>
                    </div>
                )}
            </div>
        </>
    );
}
