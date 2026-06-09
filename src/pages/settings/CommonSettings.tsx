import { useState, useEffect } from "react";
import PageMeta from "../../components/common/PageMeta";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import Label from "../../components/form/Label";
import Button from "../../components/ui/button/Button";
import Input from "../../components/form/input/InputField";
import { fetchGlobalSettings, updateGlobalSetting } from "../../api/globalSettings";
import { useAuth } from "../../context/AuthContext";

export default function CommonSettings() {
    const { hasPermission } = useAuth();
    const canEdit = hasPermission("global_settings:edit");

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [affiliateMinWithdrawal, setAffiliateMinWithdrawal] = useState("1000");
    const [affiliateEarningsExpiryDays, setAffiliateEarningsExpiryDays] = useState("90");

    useEffect(() => {
        (async () => {
            try {
                const settings = await fetchGlobalSettings();
                setAffiliateMinWithdrawal(settings.affiliate_min_withdrawal ?? "1000");
                setAffiliateEarningsExpiryDays(settings.affiliate_earnings_expiry_days ?? "90");
            } catch (err) {
                console.error("Failed to load common settings", err);
            } finally {
                setLoading(false);
            }
        })();
    }, []);

    const handleSave = async () => {
        if (!canEdit) return;
        const minWithdrawal = parseFloat(affiliateMinWithdrawal);
        const expiryDays = parseInt(affiliateEarningsExpiryDays, 10);
        if (!Number.isFinite(minWithdrawal) || minWithdrawal <= 0) {
            alert("Minimum withdrawal must be a positive number.");
            return;
        }
        if (!Number.isFinite(expiryDays) || expiryDays < 0) {
            alert("Earnings expiry days must be zero or a positive whole number.");
            return;
        }
        setSaving(true);
        try {
            await Promise.all([
                updateGlobalSetting("affiliate_min_withdrawal", String(minWithdrawal)),
                updateGlobalSetting("affiliate_earnings_expiry_days", String(expiryDays)),
            ]);
            alert("Common settings saved successfully!");
        } catch (err) {
            console.error("Failed to save common settings", err);
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
            <PageMeta title="Common Settings | StudyCafe Admin" description="Shared platform options used across modules" />
            <PageBreadcrumb pageTitle="Common Settings" />

            <div className="space-y-6">
                {!canEdit && (
                    <p className="rounded-lg border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-600 dark:border-gray-800 dark:bg-white/[0.03] dark:text-gray-400">
                        You have view-only access. Ask a super admin to grant <span className="font-mono text-xs">global_settings:edit</span> to change these values.
                    </p>
                )}

                <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] sm:p-6">
                    <h3 className="mb-1 text-lg font-semibold text-gray-800 dark:text-white/90">Affiliate program</h3>
                    <p className="mb-4 text-sm text-gray-500 dark:text-gray-400">
                        Controls minimum payout requests and how long unredeemed commission stays withdrawable.
                    </p>
                    <div className="grid gap-5 sm:grid-cols-2">
                        <div>
                            <Label>Minimum withdrawal amount (₹)</Label>
                            <Input
                                type="number"
                                min="1"
                                step="1"
                                value={affiliateMinWithdrawal}
                                onChange={(e) => setAffiliateMinWithdrawal(e.target.value)}
                                disabled={!canEdit}
                            />
                        </div>
                        <div>
                            <Label>Earnings expiry (days)</Label>
                            <Input
                                type="number"
                                min="0"
                                step="1"
                                value={affiliateEarningsExpiryDays}
                                onChange={(e) => setAffiliateEarningsExpiryDays(e.target.value)}
                                disabled={!canEdit}
                            />
                            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                                Confirmed commission expires if not withdrawn within this many days. Use 0 to disable expiry.
                            </p>
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
