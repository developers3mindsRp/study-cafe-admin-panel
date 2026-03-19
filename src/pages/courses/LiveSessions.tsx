import { useState, useEffect, useCallback, useRef } from "react";
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
    toggleRecordingVisibility,
    type Course,
    type BatchRecord,
    type SessionRecord,
    type RecordingRecord,
    type BatchEnrollmentRecord,
} from "../../api/courses";

/* ─── helpers ─────────────────────────────────────────────────────── */

function fmtDate(d: string | null) {
    if (!d) return "—";
    return new Date(d).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
}
function fmtDateTime(d: string | null) {
    if (!d) return "—";
    return new Date(d).toLocaleString("en-IN", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" });
}

/* ─── Searchable Course Select ────────────────────────────────────── */

function CourseSearchSelect({
    courses,
    value,
    onChange,
    placeholder = "Select course...",
    allowAll = false,
}: {
    courses: Course[];
    value: string;
    onChange: (val: string) => void;
    placeholder?: string;
    allowAll?: boolean;
}) {
    const [query, setQuery] = useState("");
    const [open, setOpen] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);

    const selectedCourse = courses.find((c) => String(c.id) === value);
    const displayLabel = allowAll && value === "all"
        ? "All Courses"
        : selectedCourse?.title ?? "";

    const filtered = courses.filter((c) =>
        c.title.toLowerCase().includes(query.toLowerCase())
    );

    // Close on outside click
    useEffect(() => {
        function handleClick(e: MouseEvent) {
            if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
                setOpen(false);
                setQuery("");
            }
        }
        document.addEventListener("mousedown", handleClick);
        return () => document.removeEventListener("mousedown", handleClick);
    }, []);

    function select(val: string) {
        onChange(val);
        setOpen(false);
        setQuery("");
    }

    return (
        <div ref={containerRef} className="relative w-full">
            {/* Trigger */}
            <button
                type="button"
                onClick={() => setOpen((o) => !o)}
                className="w-full flex items-center justify-between rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-left dark:border-gray-600 dark:bg-gray-700 dark:text-white"
            >
                <span className={displayLabel ? "text-gray-800 dark:text-white" : "text-gray-400"}>
                    {displayLabel || placeholder}
                </span>
                <svg className={`w-4 h-4 text-gray-400 transition-transform ${open ? "rotate-180" : ""}`} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                </svg>
            </button>

            {/* Dropdown */}
            {open && (
                <div className="absolute z-50 mt-1 w-full rounded-lg border border-gray-200 bg-white shadow-lg dark:border-gray-600 dark:bg-gray-800">
                    {/* Search input */}
                    <div className="p-2 border-b border-gray-100 dark:border-gray-700">
                        <input
                            autoFocus
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            placeholder="Search course..."
                            className="w-full rounded-md border border-gray-200 px-2 py-1.5 text-xs outline-none focus:border-brand-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                        />
                    </div>
                    {/* Options list */}
                    <ul className="max-h-52 overflow-y-auto py-1">
                        {allowAll && (
                            <li
                                onClick={() => select("all")}
                                className={`cursor-pointer px-3 py-2 text-sm hover:bg-gray-50 dark:hover:bg-gray-700 ${value === "all" ? "bg-brand-50 text-brand-600 dark:bg-brand-900/20 dark:text-brand-400 font-medium" : "text-gray-700 dark:text-gray-300"}`}
                            >
                                All Courses
                            </li>
                        )}
                        {filtered.length === 0 && (
                            <li className="px-3 py-2 text-xs text-gray-400 italic">No courses match</li>
                        )}
                        {filtered.map((c) => (
                            <li
                                key={c.id}
                                onClick={() => select(String(c.id))}
                                className={`cursor-pointer px-3 py-2 text-sm hover:bg-gray-50 dark:hover:bg-gray-700 ${String(c.id) === value ? "bg-brand-50 text-brand-600 dark:bg-brand-900/20 dark:text-brand-400 font-medium" : "text-gray-700 dark:text-gray-300"}`}
                            >
                                {c.title}
                            </li>
                        ))}
                    </ul>
                </div>
            )}
        </div>
    );
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

/* ─── Add Recording Form ──────────────────────────────────────────── */

function AddRecordingForm({ sessionId, onCreated }: { sessionId: number; onCreated: () => void }) {
    const [url, setUrl] = useState("");
    const [source, setSource] = useState("vimeo");
    const [saving, setSaving] = useState(false);

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        if (!url.trim()) return;
        setSaving(true);
        try {
            await addRecording(sessionId, { url: url.trim(), source: source || null, is_visible: false });
            setUrl(""); onCreated();
        } catch { alert("Failed to add recording"); } finally { setSaving(false); }
    }

    return (
        <form onSubmit={handleSubmit} className="mt-2 flex items-end gap-2">
            <input value={url} onChange={(e) => setUrl(e.target.value)} placeholder="Vimeo ID or URL"
                className="flex-1 rounded border border-gray-300 px-2 py-1 text-xs dark:border-gray-600 dark:bg-gray-700 dark:text-white" required />
            <select value={source} onChange={(e) => setSource(e.target.value)}
                className="rounded border border-gray-300 px-2 py-1 text-xs dark:border-gray-600 dark:bg-gray-700 dark:text-white">
                <option value="vimeo">Vimeo</option>
                <option value="youtube">YouTube</option>
                <option value="other">Other</option>
            </select>
            <button type="submit" disabled={saving}
                className="rounded bg-green-500 px-2 py-1 text-xs font-medium text-white hover:bg-green-600 disabled:opacity-50">
                {saving ? "..." : "+ Rec"}
            </button>
        </form>
    );
}

/* ─── Recording Row ───────────────────────────────────────────────── */

function RecordingItem({ rec, onChanged }: { rec: RecordingRecord; onChanged: () => void }) {
    const [toggling, setToggling] = useState(false);
    const [deleting, setDeleting] = useState(false);

    async function handleToggle() {
        setToggling(true);
        try { await toggleRecordingVisibility(rec.id, !rec.is_visible); onChanged(); } finally { setToggling(false); }
    }
    async function handleDelete() {
        if (!confirm("Delete this recording?")) return;
        setDeleting(true);
        try { await deleteRecording(rec.id); onChanged(); } finally { setDeleting(false); }
    }

    return (
        <div className="flex items-center gap-2 rounded border border-gray-200 bg-white px-3 py-1.5 text-xs dark:border-gray-600 dark:bg-gray-700">
            <span className="font-mono text-gray-600 dark:text-gray-300 truncate max-w-[200px]">{rec.url}</span>
            {rec.source && <Badge color="info">{rec.source}</Badge>}
            <button onClick={handleToggle} disabled={toggling}
                className={`ml-auto rounded px-2 py-0.5 text-xs font-medium ${rec.is_visible ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" : "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400"}`}>
                {toggling ? "..." : rec.is_visible ? "✅ Visible" : "🔒 Hidden"}
            </button>
            <button onClick={handleDelete} disabled={deleting}
                className="rounded bg-red-100 px-2 py-0.5 text-xs text-red-600 hover:bg-red-200 dark:bg-red-900/30 dark:text-red-400">
                {deleting ? "..." : "×"}
            </button>
        </div>
    );
}

/* ─── Session Row ─────────────────────────────────────────────────── */

function SessionItem({ session, onChanged }: { session: SessionRecord; onChanged: () => void }) {
    const [showAdd, setShowAdd] = useState(false);
    const [deleting, setDeleting] = useState(false);

    async function handleDelete() {
        if (!confirm(`Delete session "${session.title}" and all its recordings?`)) return;
        setDeleting(true);
        try { await deleteSession(session.id); onChanged(); } finally { setDeleting(false); }
    }

    return (
        <div className="rounded-lg border border-gray-200 bg-gray-50 p-3 dark:border-gray-600 dark:bg-gray-800/50">
            <div className="flex items-center gap-2">
                <span className="inline-flex size-6 items-center justify-center rounded-full bg-brand-100 text-xs font-bold text-brand-600 dark:bg-brand-900/30 dark:text-brand-400">
                    {session.day_number}
                </span>
                <span className="font-medium text-sm text-gray-800 dark:text-white">
                    {session.title || `Day ${session.day_number}`}
                </span>
                {session.scheduled_at && <span className="text-xs text-gray-500 dark:text-gray-400">📅 {fmtDateTime(session.scheduled_at)}</span>}
                {session.meet_link && <a href={session.meet_link} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-500 underline">🔗 Meet</a>}
                <div className="ml-auto flex gap-1">
                    <button onClick={() => setShowAdd(!showAdd)}
                        className="rounded bg-blue-50 px-2 py-0.5 text-xs text-blue-600 hover:bg-blue-100 dark:bg-blue-900/30 dark:text-blue-400">+ Recording</button>
                    <button onClick={handleDelete} disabled={deleting}
                        className="rounded bg-red-50 px-2 py-0.5 text-xs text-red-600 hover:bg-red-100 dark:bg-red-900/30 dark:text-red-400">
                        {deleting ? "..." : "Delete"}
                    </button>
                </div>
            </div>
            {session.recordings && session.recordings.length > 0 && (
                <div className="mt-2 space-y-1">{session.recordings.map((r) => <RecordingItem key={r.id} rec={r} onChanged={onChanged} />)}</div>
            )}
            {showAdd && <AddRecordingForm sessionId={session.id} onCreated={() => { setShowAdd(false); onChanged(); }} />}
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

    const now = new Date();

    // categorize sessions
    const upcoming = batch.sessions.filter((s) => s.scheduled_at && new Date(s.scheduled_at) >= now);
    const past = batch.sessions.filter((s) => !s.scheduled_at || new Date(s.scheduled_at) < now);

    async function handleDelete() {
        if (!confirm(`Delete batch "${batch.name}" and ALL sessions/recordings? This cannot be undone.`)) return;
        setDeleting(true);
        try { await deleteBatch(batch.id); onChanged(); } finally { setDeleting(false); }
    }

    return (
        <div className="rounded-xl border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-800">
            <div className="flex items-center justify-between border-b border-gray-100 px-5 py-3 dark:border-gray-700">
                <div className="flex items-center gap-3 flex-wrap">
                    <h3 className="font-semibold text-gray-800 dark:text-white">{batch.name}</h3>
                    <Badge color="primary">{courseName}</Badge>
                    <span className="text-xs text-gray-500">{batch.sessions.length} session{batch.sessions.length !== 1 ? "s" : ""}</span>
                    {batch.start_date && <span className="text-xs text-gray-400">{fmtDate(batch.start_date)} → {fmtDate(batch.end_date)}</span>}
                    {batch.created_at && <span className="text-xs text-gray-400 italic">Created: {fmtDate(batch.created_at)}</span>}
                </div>
                <div className="flex gap-2">
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
                {/* Upcoming sessions */}
                {upcoming.length > 0 && (
                    <div>
                        <p className="text-xs font-semibold text-green-600 dark:text-green-400 mb-1">📅 Upcoming ({upcoming.length})</p>
                        <div className="space-y-2">{upcoming.map((s) => <SessionItem key={s.id} session={s} onChanged={onChanged} />)}</div>
                    </div>
                )}

                {/* Past / unscheduled sessions */}
                {past.length > 0 && (
                    <div>
                        {/* <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1">📁 Past / Unscheduled ({past.length})</p> */}
                        <div className="space-y-2">{past.map((s) => <SessionItem key={s.id} session={s} onChanged={onChanged} />)}</div>
                    </div>
                )}

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
                            onChange={setFilterCourse}
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
                {!loading && filtered.map((item) => (
                    <BatchCard key={item.batch.id} batch={item.batch} courseName={item.courseName} onChanged={loadAll} />
                ))}

                {!loading && filtered.length === 0 && (
                    <div className="rounded-xl border-2 border-dashed border-gray-300 p-12 text-center dark:border-gray-600">
                        <p className="text-gray-500 dark:text-gray-400">No batches found. Create your first batch above.</p>
                    </div>
                )}
            </div>
        </>
    );
}
