import { useState, useEffect, useCallback } from "react";
import PageMeta from "../../components/common/PageMeta";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import Badge from "../../components/ui/badge/Badge";
import {
    fetchCourses,
    fetchCourseSessions,
    fetchBatchEnrollments,
    createBatch,
    deleteBatch,
    deleteSession,
    addRecording,
    deleteRecording,
    syncBatchSessions,
    type Course,
    type BatchRecord,
    type SessionRecord,
    type BatchEnrollmentRecord,
} from "../../api/courses";
import { DataTablePagination } from "../../components/tables/data-table/DataTablePagination";
import type { DataTableMeta } from "../../components/tables/data-table/DataTable.types";
import { CourseSearchSelect } from "../../components/courses/CourseSearchSelect";

/* ─── helpers ─────────────────────────────────────────────────────── */

function fmtDate(d: string | null) {
    if (!d) return "—";
    return new Date(d).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
}

/* ─── Create Batch Modal ──────────────────────────────────────────── */

function CreateBatchPanel({
    courses,
    onCreated,
}: {
    courses: Course[];
    onCreated: () => void;
}) {
    const [courseId, setCourseId] = useState("");
    const [startDate, setStartDate] = useState("");
    const [meetLink, setMeetLink] = useState("");
    const [saving, setSaving] = useState(false);

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        if (!courseId) return;
        setSaving(true);
        try {
            await createBatch(courseId, {
                start_date: startDate || null,
                meet_link: meetLink || null,
            });
            setStartDate("");
            setMeetLink("");
            onCreated();
        } catch (err: any) {
            alert(err?.response?.data?.error || "Failed to create batch");
        } finally {
            setSaving(false);
        }
    }

    return (
        <form onSubmit={handleSubmit} className="rounded-xl border border-gray-200 bg-white p-5 dark:border-gray-700 dark:bg-gray-800 space-y-3">
            <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-200">Create New Batch</h3>
            <p className="text-xs text-gray-400 dark:text-gray-500">Sessions & recordings will be auto-created from the course curriculum.</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                <div>
                    <label className="mb-1 block text-xs font-medium text-gray-500 dark:text-gray-400">Course *</label>
                    <CourseSearchSelect
                        courses={courses}
                        value={courseId}
                        onChange={setCourseId}
                    />
                </div>
                <div>
                    <label className="mb-1 block text-xs font-medium text-gray-500 dark:text-gray-400">Start Date</label>
                    <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)}
                        className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white" />
                </div>
                <div>
                    <label className="mb-1 block text-xs font-medium text-gray-500 dark:text-gray-400">Room Link</label>
                    <input value={meetLink} onChange={(e) => setMeetLink(e.target.value)} placeholder="https://meet.google.com/..."
                        className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white" />
                </div>
                <div className="flex items-end">
                    <button type="submit" disabled={saving}
                        className="w-full rounded-lg bg-brand-500 px-4 py-2 text-sm font-medium text-white hover:bg-brand-600 disabled:opacity-50">
                        {saving ? "Creating..." : "Create Batch"}
                    </button>
                </div>
            </div>
        </form>
    );
}

/* ─── Add Session Form (removed — sessions auto-created from curriculum) ── */

/* ─── Section Row (1 section = 1 video) ──────────────────────────── */

function SectionItem({ session, onChanged }: { session: SessionRecord; onChanged: () => void }) {
    const [url, setUrl] = useState("");
    const [source, setSource] = useState("vimeo");
    const [saving, setSaving] = useState(false);
    const [deleting, setDeleting] = useState(false);
    const [deletingRec, setDeletingRec] = useState(false);

    const displayTitle = session.section_title || session.title || `Section ${(session.section_index ?? 0) + 1}`;
    const recording = session.recordings?.[0] ?? null;

    async function handleAdd(e: React.FormEvent) {
        e.preventDefault();
        if (!url.trim()) return;
        setSaving(true);
        try {
            await addRecording(session.id, { url: url.trim(), source: source || null, is_visible: true });
            setUrl("");
            onChanged();
        } catch { alert("Failed to add recording"); } finally { setSaving(false); }
    }

    async function handleDeleteRecording() {
        if (!recording) return;
        if (!confirm("Remove video from this section?")) return;
        setDeletingRec(true);
        try { await deleteRecording(recording.id); onChanged(); } finally { setDeletingRec(false); }
    }

    async function handleDeleteSection() {
        if (!confirm(`Delete section "${displayTitle}"?`)) return;
        setDeleting(true);
        try { await deleteSession(session.id); onChanged(); } finally { setDeleting(false); }
    }

    return (
        <div className="flex items-center gap-3 rounded-lg border border-gray-200 bg-white px-4 py-2.5 dark:border-gray-600 dark:bg-gray-800/50">
            {/* Section index badge */}
            <span className="inline-flex size-5 shrink-0 items-center justify-center rounded bg-gray-200 text-[10px] font-bold text-gray-600 dark:bg-gray-600 dark:text-gray-300">
                {(session.section_index ?? 0) + 1}
            </span>

            {/* Title & duration */}
            <div className="flex items-center gap-2 min-w-[180px]">
                <span className="font-medium text-sm text-gray-800 dark:text-white truncate max-w-[160px]">
                    {displayTitle}
                </span>
                {session.duration != null && session.duration > 0 && (
                    <span className="shrink-0 rounded bg-brand-50 px-1.5 py-0.5 text-xs font-medium text-brand-600 dark:bg-brand-500/10 dark:text-brand-400">
                        {session.duration} min
                    </span>
                )}
            </div>

            {/* Video: either show existing or add form */}
            <div className="flex-1 flex items-center gap-2 min-w-0">
                {recording ? (
                    <>
                        <span className="font-mono text-xs text-gray-600 dark:text-gray-300 truncate">{recording.url}</span>
                        {recording.source && <Badge color="info">{recording.source}</Badge>}
                        <button onClick={handleDeleteRecording} disabled={deletingRec}
                            className="shrink-0 rounded bg-red-100 px-2 py-0.5 text-xs text-red-600 hover:bg-red-200 dark:bg-red-900/30 dark:text-red-400">
                            {deletingRec ? "..." : "×"}
                        </button>
                    </>
                ) : (
                    <form onSubmit={handleAdd} className="flex items-center gap-2 flex-1">
                        <input value={url} onChange={(e) => setUrl(e.target.value)} placeholder="Video ID or URL"
                            className="flex-1 rounded border border-gray-300 px-2 py-1.5 text-xs dark:border-gray-600 dark:bg-gray-700 dark:text-white" required />
                        <select value={source} onChange={(e) => setSource(e.target.value)}
                            className="rounded border border-gray-300 px-2 py-1.5 text-xs dark:border-gray-600 dark:bg-gray-700 dark:text-white">
                            <option value="vimeo">Vimeo</option>
                            <option value="youtube">YouTube</option>
                            <option value="other">Other</option>
                        </select>
                        <button type="submit" disabled={saving}
                            className="shrink-0 rounded bg-green-500 px-3 py-1.5 text-xs font-medium text-white hover:bg-green-600 disabled:opacity-50 whitespace-nowrap">
                            {saving ? "..." : "+ Add"}
                        </button>
                    </form>
                )}
            </div>

            {/* Delete section */}
            <button onClick={handleDeleteSection} disabled={deleting}
                className="shrink-0 rounded bg-red-50 px-2 py-0.5 text-xs text-red-600 hover:bg-red-100 dark:bg-red-900/30 dark:text-red-400">
                {deleting ? "..." : "Delete"}
            </button>
        </div>
    );
}

/* ─── Day Group (groups sections under a day) ────────────────────────── */

function DayGroup({ dayNumber, dayTitle, sessions, onChanged }: { dayNumber: number; dayTitle: string; sessions: SessionRecord[]; onChanged: () => void }) {
    const totalDuration = sessions.reduce((sum, s) => sum + (s.duration ?? 0), 0);
    const videosAdded = sessions.filter((s) => s.recordings && s.recordings.length > 0).length;

    return (
        <div className="rounded-lg border border-gray-200 bg-gray-50 p-4 dark:border-gray-600 dark:bg-gray-800/30">
            <div className="flex items-center gap-2 mb-3 flex-wrap">
                <span className="inline-flex size-7 items-center justify-center rounded-full bg-brand-100 text-xs font-bold text-brand-600 dark:bg-brand-900/30 dark:text-brand-400">
                    {dayNumber}
                </span>
                <span className="font-semibold text-sm text-gray-800 dark:text-white">
                    {dayTitle}
                </span>
                <span className="text-xs text-gray-400 dark:text-gray-500">
                    {sessions.length} section{sessions.length !== 1 ? "s" : ""}
                </span>
                {totalDuration > 0 && (
                    <span className="rounded bg-gray-200 px-1.5 py-0.5 text-xs text-gray-600 dark:bg-gray-700 dark:text-gray-300">{totalDuration} min total</span>
                )}
                <span className="text-xs text-gray-400 dark:text-gray-500">
                    {videosAdded}/{sessions.length} video{sessions.length !== 1 ? "s" : ""} added
                </span>
            </div>
            <div className="space-y-2 ml-9">
                {sessions.length > 0
                    ? sessions.map((s) => <SectionItem key={s.id} session={s} onChanged={onChanged} />)
                    : <p className="text-xs text-gray-400 italic">No sections added</p>
                }
            </div>
        </div>
    );
}

/* ─── Batch Enrollments ───────────────────────────────────────────── */

function BatchEnrollmentsPanel({ batchId }: { batchId: number }) {
    const [enrollments, setEnrollments] = useState<BatchEnrollmentRecord[]>([]);
    const [loading, setLoading] = useState(true);

    const load = useCallback(async () => {
        setLoading(true);
        const rows = await fetchBatchEnrollments(batchId);
        setEnrollments(rows);
        setLoading(false);
    }, [batchId]);

    useEffect(() => { load(); }, [load]);

    if (loading) return <p className="text-xs text-gray-500 p-2">Loading enrollments...</p>;

    return (
        <div className="mt-3 rounded-lg border border-blue-200 bg-blue-50 p-3 dark:border-blue-700 dark:bg-blue-900/20">
            <h4 className="text-xs font-semibold text-blue-700 dark:text-blue-300 mb-2">
                Enrolled Students ({enrollments.length})
            </h4>
            {enrollments.length === 0 ? (
                <p className="text-xs text-gray-500 dark:text-gray-400">No students enrolled yet.</p>
            ) : (
                <div className="space-y-1 max-h-40 overflow-y-auto">
                    {enrollments.map((e) => (
                        <div key={e.id} className="flex items-center justify-between rounded bg-white px-2 py-1 text-xs dark:bg-gray-700">
                            <span className="text-gray-700 dark:text-gray-300">User #{e.user_id}</span>
                            <span className="text-gray-400">{fmtDate(e.enrolled_at)}</span>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

/* ─── Batch Card (per course) ─────────────────────────────────────── */

function BatchCard({ batch, courseName, onChanged }: { batch: BatchRecord; courseName: string; onChanged: () => void }) {
    const [showEnrollments, setShowEnrollments] = useState(false);
    const [deleting, setDeleting] = useState(false);
    const [syncing, setSyncing] = useState(false);

    // Group sessions by day_number
    const dayGroups: { dayNumber: number; dayTitle: string; sessions: SessionRecord[] }[] = [];
    const dayMap = new Map<number, SessionRecord[]>();
    const dayTitleMap = new Map<number, string>();
    for (const s of batch.sessions) {
        const dn = s.day_number;
        if (!dayMap.has(dn)) {
            dayMap.set(dn, []);
            dayTitleMap.set(dn, s.title || `Day ${dn}`);
        }
        dayMap.get(dn)!.push(s);
    }
    for (const [dayNumber, sessions] of dayMap) {
        dayGroups.push({ dayNumber, dayTitle: dayTitleMap.get(dayNumber) || `Day ${dayNumber}`, sessions });
    }
    dayGroups.sort((a, b) => a.dayNumber - b.dayNumber);

    const totalSections = batch.sessions.length;

    async function handleDelete() {
        if (!confirm(`Delete batch "${batch.name}" and ALL sessions/recordings? This cannot be undone.`)) return;
        setDeleting(true);
        try { await deleteBatch(batch.id); onChanged(); } finally { setDeleting(false); }
    }

    async function handleSync() {
        if (!confirm("Sync sections from curriculum? This will re-create all sessions from the current course curriculum. Existing recordings will be preserved where possible.")) return;
        setSyncing(true);
        try {
            await syncBatchSessions(batch.id);
            onChanged();
        } catch (err: any) {
            alert(err?.response?.data?.error || "Failed to sync sections");
        } finally {
            setSyncing(false);
        }
    }

    return (
        <div className="rounded-xl border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-800">
            <div className="flex items-center justify-between border-b border-gray-100 px-5 py-3 dark:border-gray-700">
                <div className="flex items-center gap-3 flex-wrap">
                    <h3 className="font-semibold text-gray-800 dark:text-white">{batch.name}</h3>
                    <Badge color="primary">{courseName}</Badge>
                    <span className="text-xs text-gray-500">{dayGroups.length} day{dayGroups.length !== 1 ? "s" : ""} · {totalSections} section{totalSections !== 1 ? "s" : ""}</span>
                    {batch.start_date && <span className="text-xs text-gray-400">{fmtDate(batch.start_date)} → {fmtDate(batch.end_date)}</span>}
                    {batch.created_at && <span className="text-xs text-gray-400 italic">Created: {fmtDate(batch.created_at)}</span>}
                </div>
                <div className="flex gap-2">
                    <button onClick={handleSync} disabled={syncing}
                        className="rounded bg-amber-50 px-3 py-1 text-xs font-medium text-amber-600 hover:bg-amber-100 dark:bg-amber-900/30 dark:text-amber-400 disabled:opacity-50">
                        {syncing ? "Syncing..." : "Sync Sections"}
                    </button>
                    <button onClick={() => setShowEnrollments(!showEnrollments)}
                        className="rounded bg-blue-50 px-3 py-1 text-xs font-medium text-blue-600 hover:bg-blue-100 dark:bg-blue-900/30 dark:text-blue-400">
                        👥 {showEnrollments ? "Hide" : "Enrollments"}
                    </button>
                    <button onClick={handleDelete} disabled={deleting}
                        className="rounded bg-red-50 px-3 py-1 text-xs font-medium text-red-600 hover:bg-red-100 dark:bg-red-900/30 dark:text-red-400">
                        {deleting ? "..." : "Delete"}
                    </button>
                </div>
            </div>

            <div className="p-4 space-y-3">
                {dayGroups.map((group) => (
                    <DayGroup
                        key={group.dayNumber}
                        dayNumber={group.dayNumber}
                        dayTitle={group.dayTitle}
                        sessions={group.sessions}
                        onChanged={onChanged}
                    />
                ))}

                {batch.sessions.length === 0 && (
                    <p className="text-sm text-gray-400 italic">No sessions — course may be missing curriculum data.</p>
                )}
            </div>

            {showEnrollments && (
                <div className="border-t border-gray-100 px-5 pb-4 dark:border-gray-700">
                    <BatchEnrollmentsPanel batchId={batch.id} />
                </div>
            )}
        </div>
    );
}

/* ─── Main Page ───────────────────────────────────────────────────── */

export default function LiveSessions() {
    const [courses, setCourses] = useState<Course[]>([]);
    const [allBatches, setAllBatches] = useState<{ courseId: number; courseName: string; batch: BatchRecord }[]>([]);
    const [loading, setLoading] = useState(true);
    const [filterCourse, setFilterCourse] = useState<string>("all");
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(5);

    const loadAll = useCallback(async () => {
        setLoading(true);
        const courseList = await fetchCourses();
        setCourses(courseList);

        const results: { courseId: number; courseName: string; batch: BatchRecord }[] = [];
        await Promise.all(
            courseList.map(async (c) => {
                const batches = await fetchCourseSessions(String(c.id));
                for (const b of batches) {
                    results.push({ courseId: c.id, courseName: c.title, batch: b });
                }
            })
        );

        // Sort: most recently created batches first
        results.sort((a, b) => {
            const da = a.batch.created_at ? new Date(a.batch.created_at).getTime() : 0;
            const db = b.batch.created_at ? new Date(b.batch.created_at).getTime() : 0;
            return db - da;
        });

        setAllBatches(results);
        setLoading(false);
    }, []);

    useEffect(() => { loadAll(); }, [loadAll]);

    const filtered = filterCourse === "all" ? allBatches : allBatches.filter((b) => String(b.courseId) === filterCourse);
    const totalSessions = filtered.reduce((t, b) => t + b.batch.sessions.length, 0);
    const totalRecordings = filtered.reduce((t, b) => t + b.batch.sessions.reduce((s, sess) => s + (sess.recordings?.length ?? 0), 0), 0);

    // Pagination
    const totalBatches = filtered.length;
    const totalPages = Math.max(1, Math.ceil(totalBatches / pageSize));
    const safePage = Math.min(page, totalPages);
    const paginatedBatches = filtered.slice((safePage - 1) * pageSize, safePage * pageSize);
    const paginationMeta: DataTableMeta = {
        total: totalBatches,
        page: safePage,
        limit: pageSize,
        totalPages,
        hasNextPage: safePage < totalPages,
        hasPreviousPage: safePage > 1,
    };

    // Reset to page 1 when filter changes
    function handleFilterChange(val: string) {
        setFilterCourse(val);
        setPage(1);
    }

    return (
        <>
            <PageMeta title="Live Sessions | StudyCafe Admin" description="Manage batches, sessions, recordings and enrollments across all courses" />
            <PageBreadcrumb pageTitle="Live Sessions" items={[{ label: "Courses", path: "/courses" }]} />

            <div className="space-y-6">
                {/* Stats & filter */}
                <div className="flex flex-wrap items-center justify-between gap-4">
                    <div>
                        <h2 className="text-xl font-bold text-gray-800 dark:text-white">Live Sessions</h2>
                        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                            {filtered.length} batch{filtered.length !== 1 ? "es" : ""} · {totalSessions} sessions · {totalRecordings} recordings
                        </p>
                    </div>
                    <div className="w-64">
                        <CourseSearchSelect
                            courses={courses}
                            value={filterCourse}
                            onChange={handleFilterChange}
                            allowAll
                        />
                    </div>
                </div>

                {/* Create batch */}
                <CreateBatchPanel courses={courses} onCreated={loadAll} />

                {/* Loading */}
                {loading && (
                    <div className="flex h-32 items-center justify-center">
                        <div className="size-8 animate-spin rounded-full border-4 border-brand-500 border-t-transparent" />
                    </div>
                )}

                {/* Batch cards */}
                {!loading && paginatedBatches.map((item) => (
                    <BatchCard key={item.batch.id} batch={item.batch} courseName={item.courseName} onChanged={loadAll} />
                ))}

                {!loading && filtered.length === 0 && (
                    <div className="rounded-xl border-2 border-dashed border-gray-300 p-12 text-center dark:border-gray-600">
                        <p className="text-gray-500 dark:text-gray-400">No batches found. Create your first batch above.</p>
                    </div>
                )}

                {/* Pagination */}
                {!loading && filtered.length > 0 && (
                    <div className="rounded-xl border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800">
                        <DataTablePagination
                            meta={paginationMeta}
                            pageSizeOptions={[5, 10, 20]}
                            onPageChange={setPage}
                            onPageSizeChange={(size) => { setPageSize(size); setPage(1); }}
                        />
                    </div>
                )}
            </div>
        </>
    );
}
