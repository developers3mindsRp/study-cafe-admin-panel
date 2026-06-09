import { useState, useEffect } from "react";
import PageMeta from "../../components/common/PageMeta";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import Label from "../../components/form/Label";
import Input from "../../components/form/input/InputField";
import ImageUpload from "../../components/form/ImageUpload";
import Button from "../../components/ui/button/Button";
import { ArrayEditor } from "./components/ArrayEditor";
import { fetchCoursePageSettings, updateCoursePageSetting } from "../../api/courseSettings";

const safeJsonParse = (str: string | null | undefined, fallback: any = []) => {
    if (!str) return fallback;
    try { return JSON.parse(str); } catch { return fallback; }
};

function apiErrorMessage(err: unknown, fallback: string): string {
    const ax = err as { response?: { data?: { message?: string; error?: string } }; message?: string };
    return ax.response?.data?.message || ax.response?.data?.error || ax.message || fallback;
}

export default function CoursePageSettings() {
    const [loading, setLoading] = useState(true);
    const [settingsError, setSettingsError] = useState<string | null>(null);
    const [saving, setSaving] = useState(false);
    const [alumniLogos, setAlumniLogos] = useState<any[]>([]);
    const [featuredInLogos, setFeaturedInLogos] = useState<any[]>([]);
    const [galleryImages, setGalleryImages] = useState<string[]>([]);

    useEffect(() => {
        (async () => {
            setSettingsError(null);
            try {
                const settings = await fetchCoursePageSettings();
                setAlumniLogos(safeJsonParse(settings.alumni_logos, []));
                setFeaturedInLogos(safeJsonParse(settings.featured_in_logos, []));
                const rawGallery = safeJsonParse(settings.gallery_images, []);
                setGalleryImages(
                    rawGallery.map((item: string | { image_url?: string; url?: string; image?: string }) => {
                        if (typeof item === "string") return item;
                        return item?.image_url || item?.url || item?.image || "";
                    }).filter(Boolean)
                );
            } catch (err) {
                console.error("Failed to load course page settings", err);
                setSettingsError(apiErrorMessage(err, "Failed to load course page settings."));
            } finally {
                setLoading(false);
            }
        })();
    }, []);

    const handleSave = async () => {
        setSaving(true);
        try {
            await Promise.all([
                updateCoursePageSetting("alumni_logos", JSON.stringify(alumniLogos)),
                updateCoursePageSetting("featured_in_logos", JSON.stringify(featuredInLogos)),
                updateCoursePageSetting("gallery_images", JSON.stringify(galleryImages)),
            ]);
            alert("Settings saved successfully!");
        } catch (err) {
            console.error("Failed to save settings", err);
            alert(apiErrorMessage(err, "Failed to save settings"));
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return <div className="flex items-center justify-center p-20"><p className="text-gray-500">Loading settings…</p></div>;
    }

    return (
        <>
            <PageMeta title="Course Page Settings | StudyCafe Admin" description="Manage reusable sections displayed on all course pages" />
            <PageBreadcrumb pageTitle="Course Page Settings" />

            <div className="space-y-6">
                {settingsError && (
                    <p className="rounded-lg border border-error-200 bg-error-50 px-4 py-3 text-sm text-error-700 dark:border-error-500/30 dark:bg-error-500/10 dark:text-error-400">
                        {settingsError}
                    </p>
                )}

                <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] sm:p-6">
                    <h3 className="mb-1 text-lg font-semibold text-gray-800 dark:text-white/90">Our Alumni at Leading Companies</h3>
                    <p className="mb-4 text-sm text-gray-500 dark:text-gray-400">Logos of companies where alumni work. Displayed on all course detail pages.</p>
                    <ArrayEditor
                        value={alumniLogos}
                        onChange={setAlumniLogos}
                        defaultItem={{ name: "", logo_url: "", link: "" }}
                        addButtonLabel="Add Company"
                        renderItem={(item: any, index, update) => (
                            <div className="space-y-4">
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div>
                                        <Label>Company Name</Label>
                                        <Input value={item.name || ""} onChange={e => update(index, { name: e.target.value })} />
                                    </div>
                                    <div>
                                        <Label>Link (optional)</Label>
                                        <Input value={item.link || ""} onChange={e => update(index, { link: e.target.value })} placeholder="https://..." />
                                    </div>
                                </div>
                                <ImageUpload
                                    label="Company Logo"
                                    value={item.logo_url || ""}
                                    onChange={(url) => update(index, { logo_url: url })}
                                    placeholder="Upload or enter logo URL"
                                />
                            </div>
                        )}
                    />
                </div>

                {/* Featured In Logos */}
                <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] sm:p-6">
                    <h3 className="mb-1 text-lg font-semibold text-gray-800 dark:text-white/90">Featured In</h3>
                    <p className="mb-4 text-sm text-gray-500 dark:text-gray-400">Media outlet logos where StudyCafe has been featured. Displayed on all course detail pages.</p>
                    <ArrayEditor
                        value={featuredInLogos}
                        onChange={setFeaturedInLogos}
                        defaultItem={{ name: "", logo_url: "", link: "" }}
                        addButtonLabel="Add Media Outlet"
                        renderItem={(item: any, index, update) => (
                            <div className="space-y-4">
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div>
                                        <Label>Media Name</Label>
                                        <Input value={item.name || ""} onChange={e => update(index, { name: e.target.value })} />
                                    </div>
                                    <div>
                                        <Label>Link (optional)</Label>
                                        <Input value={item.link || ""} onChange={e => update(index, { link: e.target.value })} placeholder="https://..." />
                                    </div>
                                </div>
                                <ImageUpload
                                    label="Media Logo"
                                    value={item.logo_url || ""}
                                    onChange={(url) => update(index, { logo_url: url })}
                                    placeholder="Upload or enter logo URL"
                                />
                            </div>
                        )}
                    />
                </div>

                {/* Photo Gallery */}
                <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] sm:p-6">
                    <h3 className="mb-1 text-lg font-semibold text-gray-800 dark:text-white/90">Photo Gallery</h3>
                    <p className="mb-4 text-sm text-gray-500 dark:text-gray-400">
                        Images for the gallery section on all course detail and marketing pages.
                    </p>
                    <ArrayEditor
                        value={galleryImages}
                        onChange={setGalleryImages}
                        defaultItem=""
                        addButtonLabel="Add image"
                        renderItem={(url, index) => (
                            <ImageUpload
                                value={url}
                                onChange={(imageUrl) => {
                                    const next = [...galleryImages];
                                    next[index] = imageUrl;
                                    setGalleryImages(next);
                                }}
                                placeholder="Upload gallery image"
                            />
                        )}
                    />
                </div>


                {/* Save */}
                <div className="flex justify-end gap-2">
                    <Button type="button" size="sm" onClick={handleSave} disabled={saving || !!settingsError}>
                        {saving ? "Saving…" : "Save All Settings"}
                    </Button>
                </div>
            </div>
        </>
    );
}
