import { useState, useEffect } from "react";
import PageMeta from "../../components/common/PageMeta";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import Label from "../../components/form/Label";
import Input from "../../components/form/input/InputField";
import ImageUpload from "../../components/form/ImageUpload";
import Button from "../../components/ui/button/Button";
import { ArrayEditor } from "./components/ArrayEditor";
import { fetchCoursePageSettings, updateCoursePageSetting } from "../../api/courseSettings";
import { fetchCourses } from "../../api/courses";

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
    const [coursesWarning, setCoursesWarning] = useState<string | null>(null);
    const [saving, setSaving] = useState(false);
    const [alumniLogos, setAlumniLogos] = useState<any[]>([]);
    const [featuredInLogos, setFeaturedInLogos] = useState<any[]>([]);
    const [trendingCourseIds, setTrendingCourseIds] = useState<number[]>([]);
    const [courses, setCourses] = useState<any[]>([]);
    const [newTrendingId, setNewTrendingId] = useState("");

    useEffect(() => {
        (async () => {
            setSettingsError(null);
            setCoursesWarning(null);
            try {
                const settings = await fetchCoursePageSettings();
                setAlumniLogos(safeJsonParse(settings.alumni_logos, []));
                setFeaturedInLogos(safeJsonParse(settings.featured_in_logos, []));
                setTrendingCourseIds(safeJsonParse(settings.trending_course_ids, []));
            } catch (err) {
                console.error("Failed to load course page settings", err);
                setSettingsError(apiErrorMessage(err, "Failed to load course page settings."));
            }
            try {
                const courseList = await fetchCourses();
                setCourses(courseList);
            } catch (err) {
                console.error("Failed to load courses for trending picker", err);
                setCoursesWarning(apiErrorMessage(err, "Could not load the course list for the trending picker."));
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
                updateCoursePageSetting("trending_course_ids", JSON.stringify(trendingCourseIds)),
            ]);
            alert("Settings saved successfully!");
        } catch (err) {
            console.error("Failed to save settings", err);
            alert(apiErrorMessage(err, "Failed to save settings"));
        } finally {
            setSaving(false);
        }
    };

    const addTrendingCourse = () => {
        const id = Number(newTrendingId);
        if (id && !trendingCourseIds.includes(id)) {
            setTrendingCourseIds([...trendingCourseIds, id]);
            setNewTrendingId("");
        }
    };

    const removeTrendingCourse = (id: number) => {
        setTrendingCourseIds(trendingCourseIds.filter(tId => tId !== id));
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
                {coursesWarning && (
                    <p className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-300">
                        {coursesWarning}
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

                {/* Trending Courses */}
                <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] sm:p-6">
                    <h3 className="mb-1 text-lg font-semibold text-gray-800 dark:text-white/90">Trending Courses</h3>
                    <p className="mb-4 text-sm text-gray-500 dark:text-gray-400">Manually select courses to show in the "Trending Courses" section on all course pages.</p>

                    {/* Selected courses */}
                    <div className="space-y-2 mb-4">
                        {trendingCourseIds.length === 0 && (
                            <p className="text-sm text-gray-400 italic">No trending courses selected yet.</p>
                        )}
                        {trendingCourseIds.map(id => {
                            const course = courses.find(c => c.id === id);
                            return (
                                <div key={id} className="flex items-center justify-between gap-4 p-3 border border-gray-200 dark:border-gray-800 rounded-lg bg-gray-50/50 dark:bg-white/[0.02]">
                                    <span className="text-sm text-gray-700 dark:text-gray-300">
                                        <span className="font-medium text-gray-500 dark:text-gray-400 mr-2">#{id}</span>
                                        {course?.title || "Unknown Course"}
                                    </span>
                                    <button
                                        type="button"
                                        onClick={() => removeTrendingCourse(id)}
                                        className="p-1 text-gray-400 hover:text-error-500 transition-colors"
                                        title="Remove"
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                                    </button>
                                </div>
                            );
                        })}
                    </div>

                    {/* Add trending course */}
                    <div className="flex items-end gap-3">
                        <div className="flex-grow">
                            <Label>Select Course</Label>
                            <select
                                value={newTrendingId}
                                onChange={(e) => setNewTrendingId(e.target.value)}
                                className="w-full rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm text-gray-800 dark:border-gray-700 dark:bg-white/[0.03] dark:text-white/90 focus:border-brand-300 focus:outline-none focus:ring focus:ring-brand-500/10"
                            >
                                <option value="">— Pick a course —</option>
                                {courses
                                    .filter(c => !trendingCourseIds.includes(c.id))
                                    .map(c => (
                                        <option key={c.id} value={c.id}>{c.title}</option>
                                    ))
                                }
                            </select>
                        </div>
                        <Button type="button" variant="outline" size="sm" onClick={addTrendingCourse} disabled={!newTrendingId}>
                            + Add
                        </Button>
                    </div>
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
