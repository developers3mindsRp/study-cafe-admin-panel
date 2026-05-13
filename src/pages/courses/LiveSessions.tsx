import { useState, useEffect, useCallback, Fragment, useRef } from "react";
import PageMeta from "../../components/common/PageMeta";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import Badge from "../../components/ui/badge/Badge";
import {
    fetchCourses,
    fetchBatchesList,
    fetchBatchEnrollments,
    createBatch,
    deleteBatch,
    deleteSession,
    addRecording,
    deleteRecording,
    syncBatchSessions,
    type Course,
    type BatchRecord,
    type BatchRecordWithCourse,
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

function fmtDisplayDate(val: string) {
    if (!val) return "";
    const [y, m, d] = val.split("-");
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    return `${d} ${months[Number(m) - 1]} ${y}`;
}

/* ─── Calendar Date Picker ────────────────────────────────────────── */

function CalendarPicker({
    value,
    onChange,
    placeholder = "Pick a date",
    label,
}: {
    value: string;
    onChange: (v: string) => void;
    placeholder?: string;
    label?: string;
}) {
    const [open, setOpen] = useState(false);
    const [viewYear, setViewYear] = useState<number>(() => {
        if (value) return Number(value.split("-")[0]);
        return new Date().getFullYear();
    });
    const [viewMonth, setViewMonth] = useState<number>(() => {
        if (value) return Number(value.split("-")[1]) - 1;
        return new Date().getMonth();
    });
    const containerRef = useRef<HTMLDivElement>(null);

    // Close on outside click
    useEffect(() => {
        if (!open) return;
        function onDown(e: MouseEvent) {
            if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
                setOpen(false);
            }
        }
        document.addEventListener("mousedown", onDown);
        return () => document.removeEventListener("mousedown", onDown);
    }, [open]);

    const MONTHS = ["January", "February", "March", "April", "May", "June",
        "July", "August", "September", "October", "November", "December"];
    const DAYS = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

    function prevMonth() {
        if (viewMonth === 0) { setViewMonth(11); setViewYear(y => y - 1); }
        else setViewMonth(m => m - 1);
    }
    function nextMonth() {
        if (viewMonth === 11) { setViewMonth(0); setViewYear(y => y + 1); }
        else setViewMonth(m => m + 1);
    }

    // Build grid: leading blanks + days of month
    const firstDow = new Date(viewYear, viewMonth, 1).getDay();
    const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
    const cells: (number | null)[] = [
        ...Array(firstDow).fill(null),
        ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
    ];
    // Pad to full rows
    while (cells.length % 7 !== 0) cells.push(null);

    const selectedDay = value ? Number(value.split("-")[2]) : null;
    const selectedMonth = value ? Number(value.split("-")[1]) - 1 : null;
    const selectedYear = value ? Number(value.split("-")[0]) : null;

    const today = new Date();
    const todayDay = today.getDate();
    const todayMonth = today.getMonth();
    const todayYear = today.getFullYear();

    function selectDay(day: number) {
        const mm = String(viewMonth + 1).padStart(2, "0");
        const dd = String(day).padStart(2, "0");
        onChange(`${viewYear}-${mm}-${dd}`);
        setOpen(false);
    }

    function clearDate(e: React.MouseEvent) {
        e.stopPropagation();
        onChange("");
    }

    return (
        <div ref={containerRef} className="relative">
            {label && (
                <label className="mb-1 block text-xs font-medium text-gray-500 dark:text-gray-400">
                    {label}
                </label>
            )}
            {/* Trigger */}
            <button
                type="button"
                onClick={() => setOpen(o => !o)}
                className="flex w-full items-center gap-2 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-left transition hover:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:focus:ring-brand-500"
            >
                <svg className="size-4 shrink-0 text-gray-400 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <rect x="3" y="4" width="18" height="18" rx="2" ry="2" strokeWidth="2" />
                    <line x1="16" y1="2" x2="16" y2="6" strokeWidth="2" />
                    <line x1="8" y1="2" x2="8" y2="6" strokeWidth="2" />
                    <line x1="3" y1="10" x2="21" y2="10" strokeWidth="2" />
                </svg>
                <span className={`flex-1 truncate ${value ? "text-gray-800 dark:text-white" : "text-gray-400 dark:text-gray-500"}`}>
                    {value ? fmtDisplayDate(value) : placeholder}
                </span>
                {value && (
                    <span
                        role="button"
                        tabIndex={0}
                        onClick={clearDate}
                        onKeyDown={(e) => e.key === "Enter" && clearDate(e as unknown as React.MouseEvent)}
                        className="shrink-0 rounded-full p-0.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-600"
                        aria-label="Clear date"
                    >
                        <svg className="size-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </span>
                )}
            </button>

            {/* Dropdown calendar */}
            {open && (
                <div className="absolute left-0 top-full z-50 mt-1.5 w-72 rounded-xl border border-gray-200 bg-white p-4 shadow-lg dark:border-gray-700 dark:bg-gray-800">
                    {/* Month / Year nav */}
                    <div className="mb-3 flex items-center justify-between">
                        <button type="button" onClick={prevMonth}
                            className="flex size-7 items-center justify-center rounded-lg text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-700">
                            <svg className="size-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
                            </svg>
                        </button>
                        <span className="text-sm font-semibold text-gray-800 dark:text-white">
                            {MONTHS[viewMonth]} {viewYear}
                        </span>
                        <button type="button" onClick={nextMonth}
                            className="flex size-7 items-center justify-center rounded-lg text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-700">
                            <svg className="size-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                            </svg>
                        </button>
                    </div>

                    {/* Day-of-week headers */}
                    <div className="mb-1 grid grid-cols-7 text-center">
                        {DAYS.map((d) => (
                            <span key={d} className="text-[10px] font-semibold uppercase tracking-wide text-gray-400 dark:text-gray-500">
                                {d}
                            </span>
                        ))}
                    </div>

                    {/* Day cells */}
                    <div className="grid grid-cols-7 gap-y-0.5">
                        {cells.map((day, idx) => {
                            if (!day) return <span key={idx} />;
                            const isSelected =
                                day === selectedDay &&
                                viewMonth === selectedMonth &&
                                viewYear === selectedYear;
                            const isToday =
                                day === todayDay &&
                                viewMonth === todayMonth &&
                                viewYear === todayYear;
                            return (
                                <button
                                    key={idx}
                                    type="button"
                                    onClick={() => selectDay(day)}
                                    className={`
                                        mx-auto flex size-8 items-center justify-center rounded-full text-sm transition
                                        ${isSelected
                                            ? "bg-brand-500 font-semibold text-white"
                                            : isToday
                                                ? "border border-brand-400 font-semibold text-brand-600 hover:bg-brand-50 dark:text-brand-400 dark:hover:bg-brand-500/10"
                                                : "text-gray-700 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-700"
                                        }
                                    `}
                                >
                                    {day}
                                </button>
                            );
                        })}
                    </div>

                    {/* Today shortcut */}
                    <div className="mt-3 border-t border-gray-100 pt-2 dark:border-gray-700">
                        <button
                            type="button"
                            onClick={() => {
                                const mm = String(todayMonth + 1).padStart(2, "0");
                                const dd = String(todayDay).padStart(2, "0");
                                onChange(`${todayYear}-${mm}-${dd}`);
                                setOpen(false);
                            }}
                            className="w-full rounded-lg py-1.5 text-xs font-medium text-brand-600 hover:bg-brand-50 dark:text-brand-400 dark:hover:bg-brand-500/10"
                        >
                            Today
                        </button>
                    </div>
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
                    <label className="mb-1 block text-xs font-medium text-gray-500 dark:text-gray-400">Course for new batch *</label>
                    <CourseSearchSelect
                        courses={courses}
                        value={courseId}
                        onChange={setCourseId}
                        placeholder="Choose course…"
                    />
                </div>
                <div>
                    <CalendarPicker
                        label="Start Date"
                        value={startDate}
                        onChange={setStartDate}
                        placeholder="Pick start date"
                    />
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

function countSessions(b: BatchRecord) {
    return b.sessions?.length ?? 0;
}

function countRecordings(b: BatchRecord) {
    return (b.sessions ?? []).reduce((acc, s) => acc + (s.recordings?.length ?? 0), 0);
}

export default function LiveSessions() {
    const [courses, setCourses] = useState<Course[]>([]);
    const [tableRows, setTableRows] = useState<BatchRecordWithCourse[]>([]);
    const [loading, setLoading] = useState(true);
    const [filterCourse, setFilterCourse] = useState<string>("all");
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);
    const [expandedBatchId, setExpandedBatchId] = useState<number | null>(null);
    const [paginationMeta, setPaginationMeta] = useState<DataTableMeta>({
        total: 0,
        page: 1,
        limit: 10,
        totalPages: 0,
        hasNextPage: false,
        hasPreviousPage: false,
    });

    const loadCourses = useCallback(async () => {
        const courseList = await fetchCourses();
        setCourses(courseList);
    }, []);

    const loadBatchesTable = useCallback(async () => {
        setLoading(true);
        try {
            const courseIdNum =
                filterCourse === "all" ? undefined : Number(filterCourse);
            const { rows, meta } = await fetchBatchesList({
                courseId:
                    courseIdNum != null && Number.isFinite(courseIdNum) && courseIdNum > 0
                        ? courseIdNum
                        : undefined,
                page,
                limit: pageSize,
            });
            const sortedRows = [...rows].sort((a, b) => {
                const dateA = a.created_at ? new Date(a.created_at).getTime() : 0;
                const dateB = b.created_at ? new Date(b.created_at).getTime() : 0;
                return dateB - dateA;
            });
            setTableRows(sortedRows);
            setPaginationMeta({
                total: meta.total,
                page: meta.page,
                limit: meta.limit,
                totalPages: meta.totalPages,
                hasNextPage: meta.hasNextPage,
                hasPreviousPage: meta.hasPreviousPage,
            });
        } catch {
            setTableRows([]);
            setPaginationMeta((m) => ({ ...m, total: 0, totalPages: 0, hasNextPage: false, hasPreviousPage: false }));
        } finally {
            setLoading(false);
        }
    }, [filterCourse, page, pageSize]);

    useEffect(() => {
        void loadCourses();
    }, [loadCourses]);

    useEffect(() => {
        void loadBatchesTable();
    }, [loadBatchesTable]);

    useEffect(() => {
        setExpandedBatchId(null);
    }, [page, pageSize, filterCourse]);

    const refreshAll = useCallback(async () => {
        await loadCourses();
        await loadBatchesTable();
    }, [loadCourses, loadBatchesTable]);

    const pageSessions = tableRows.reduce((t, b) => t + countSessions(b), 0);
    const pageRecordings = tableRows.reduce((t, b) => t + countRecordings(b), 0);

    function handleFilterChange(val: string) {
        setFilterCourse(val);
        setPage(1);
    }

    function toggleExpand(batchId: number) {
        setExpandedBatchId((id) => (id === batchId ? null : batchId));
    }

    return (
        <>
            <PageMeta title="Live Sessions | StudyCafe Admin" description="Manage batches, sessions, recordings and enrollments across all courses" />
            <PageBreadcrumb pageTitle="Live Sessions" items={[{ label: "Courses", path: "/courses" }]} />

            <div className="space-y-6">
                <div className="flex flex-wrap items-start justify-between gap-4">
                    <div>
                        <h2 className="text-xl font-bold text-gray-800 dark:text-white">Live Sessions</h2>
                        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                            {paginationMeta.total} batch{paginationMeta.total !== 1 ? "es" : ""} total
                            {filterCourse !== "all" ? " (filtered by course)" : ""}. This page: {pageSessions} sessions · {pageRecordings} recordings.
                        </p>
                    </div>
                    <div className="w-full min-w-[220px] max-w-sm shrink-0">
                        <label className="mb-1 block text-xs font-medium text-gray-500 dark:text-gray-400">
                            Show batches for course
                        </label>
                        <CourseSearchSelect
                            courses={courses}
                            value={filterCourse}
                            onChange={handleFilterChange}
                            allowAll
                            placeholder="All courses…"
                        />
                    </div>
                </div>

                <CreateBatchPanel courses={courses} onCreated={refreshAll} />

                {loading && (
                    <div className="flex h-32 items-center justify-center">
                        <div className="size-8 animate-spin rounded-full border-4 border-brand-500 border-t-transparent" />
                    </div>
                )}

                {!loading && (
                    <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-800">
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                                <thead className="bg-gray-50 dark:bg-gray-900/40">
                                    <tr>
                                        <th scope="col" className="w-12 px-3 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400" />
                                        <th scope="col" className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">Course</th>
                                        <th scope="col" className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">Batch</th>
                                        <th scope="col" className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">Start</th>
                                        <th scope="col" className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">End</th>
                                        <th scope="col" className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">Created</th>
                                        <th scope="col" className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">Sections</th>
                                        <th scope="col" className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">Videos</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                                    {tableRows.length === 0 ? (
                                        <tr>
                                            <td colSpan={8} className="px-6 py-12 text-center text-sm text-gray-500 dark:text-gray-400">
                                                No batches found. Pick a course above or create a batch.
                                            </td>
                                        </tr>
                                    ) : (
                                        tableRows.map((row) => (
                                            <Fragment key={row.id}>
                                                <tr className="hover:bg-gray-50/80 dark:hover:bg-gray-900/30">
                                                    <td className="px-3 py-3 align-middle">
                                                        <button
                                                            type="button"
                                                            onClick={() => toggleExpand(row.id)}
                                                            className="inline-flex size-8 items-center justify-center rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-100 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
                                                            aria-expanded={expandedBatchId === row.id}
                                                            title={expandedBatchId === row.id ? "Collapse" : "Manage sessions & recordings"}
                                                        >
                                                            <span className="text-xs font-bold">{expandedBatchId === row.id ? "−" : "+"}</span>
                                                        </button>
                                                    </td>
                                                    <td className="max-w-[200px] px-4 py-3 align-middle">
                                                        <span className="line-clamp-2 text-sm font-medium text-gray-800 dark:text-white">{row.course_title || "—"}</span>
                                                    </td>
                                                    <td className="max-w-[220px] px-4 py-3 align-middle">
                                                        <span className="line-clamp-2 text-sm text-gray-700 dark:text-gray-200">{row.name}</span>
                                                    </td>
                                                    <td className="whitespace-nowrap px-4 py-3 align-middle text-sm text-gray-600 dark:text-gray-300">{fmtDate(row.start_date)}</td>
                                                    <td className="whitespace-nowrap px-4 py-3 align-middle text-sm text-gray-600 dark:text-gray-300">{fmtDate(row.end_date)}</td>
                                                    <td className="whitespace-nowrap px-4 py-3 align-middle text-sm text-gray-500 dark:text-gray-400">{fmtDate(row.created_at)}</td>
                                                    <td className="px-4 py-3 text-right align-middle text-sm tabular-nums text-gray-700 dark:text-gray-200">{countSessions(row)}</td>
                                                    <td className="px-4 py-3 text-right align-middle text-sm tabular-nums text-gray-700 dark:text-gray-200">{countRecordings(row)}</td>
                                                </tr>
                                                {expandedBatchId === row.id && (
                                                    <tr className="bg-gray-50/50 dark:bg-gray-900/20">
                                                        <td colSpan={8} className="p-4 sm:p-5">
                                                            <BatchCard
                                                                batch={row}
                                                                courseName={row.course_title}
                                                                onChanged={refreshAll}
                                                            />
                                                        </td>
                                                    </tr>
                                                )}
                                            </Fragment>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>

                        {paginationMeta.total > 0 && (
                            <DataTablePagination
                                meta={paginationMeta}
                                pageSizeOptions={[5, 10, 20, 50]}
                                onPageChange={setPage}
                                onPageSizeChange={(size) => {
                                    setPageSize(size);
                                    setPage(1);
                                }}
                            />
                        )}
                    </div>
                )}
            </div>
        </>
    );
}
