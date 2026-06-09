import { useState, useEffect, useCallback } from "react";
import { Link, useParams } from "react-router";
import PageMeta from "../../components/common/PageMeta";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import Badge from "../../components/ui/badge/Badge";
import {
  fetchCourse,
  fetchCourseSessions,
  updateRecording as updateRecordingApi,
  type Course,
  type BatchRecord,
  type RecordingRecord,
} from "../../api/courses";
import { getImageUrl } from "../../utils/image.utils";

const safeJsonParse = (str: string | null | undefined, fallback: any = []) => {
  if (!str) return fallback;
  try { return JSON.parse(str); } catch { return fallback; }
};

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] sm:p-6">
      <h3 className="mb-4 text-lg font-semibold text-gray-800 dark:text-white/90">{title}</h3>
      {children}
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">{label}</dt>
      <dd className="mt-0.5 text-gray-800 dark:text-white/90">{children}</dd>
    </div>
  );
}

function JsonList({ label, items }: { label: string; items: any[] }) {
  if (!items?.length) return null;
  return (
    <div>
      <p className="mb-2 text-sm font-medium text-gray-500 dark:text-gray-400">{label}</p>
      <ul className="space-y-1 list-disc pl-5">
        {items.map((item, i) => (
          <li key={i} className="text-sm text-gray-700 dark:text-gray-300" dangerouslySetInnerHTML={{ __html: typeof item === "string" ? item : item.title || item.question || item.name || JSON.stringify(item) }} />
        ))}
      </ul>
    </div>
  );
}

function RecordingRow({
  recording,
  onUpdated,
}: {
  recording: RecordingRecord;
  onUpdated: () => void;
}) {
  const [editing, setEditing] = useState(false);
  const [url, setUrl] = useState(recording.url);
  const [source, setSource] = useState(recording.source ?? "");
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      await updateRecordingApi(recording.id, { url: url || undefined, source: source || null });
      onUpdated();
      setEditing(false);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex flex-wrap items-center gap-2 py-1.5 text-sm">
      {editing ? (
        <>
          <input
            type="url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="Recording URL"
            className="min-w-[200px] rounded border border-gray-300 bg-white px-2 py-1 dark:border-gray-600 dark:bg-gray-800"
          />
          <input
            type="text"
            value={source}
            onChange={(e) => setSource(e.target.value)}
            placeholder="Source (e.g. YouTube)"
            className="w-24 rounded border border-gray-300 bg-white px-2 py-1 dark:border-gray-600 dark:bg-gray-800"
          />
          <button
            type="button"
            onClick={handleSave}
            disabled={saving || !url}
            className="rounded bg-brand-500 px-2 py-1 text-white hover:bg-brand-600 disabled:opacity-50"
          >
            {saving ? "Saving..." : "Save"}
          </button>
          <button type="button" onClick={() => setEditing(false)} className="rounded border px-2 py-1 hover:bg-gray-100 dark:hover:bg-gray-700">
            Cancel
          </button>
        </>
      ) : (
        <>
          <a
            href={recording.url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-brand-600 hover:underline dark:text-brand-400"
          >
            {recording.url.length > 60 ? recording.url.slice(0, 60) + "…" : recording.url}
          </a>
          {recording.source && (
            <span className="text-gray-500 dark:text-gray-400">({recording.source})</span>
          )}
          <span className={`rounded px-1.5 py-0.5 text-xs font-medium ${recording.is_visible ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" : "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400"}`}>
            {recording.is_visible ? "✅ Visible" : "🔒 Hidden"}
          </span>
          <button
            type="button"
            onClick={() => setEditing(true)}
            className="rounded border px-2 py-0.5 text-xs hover:bg-gray-100 dark:hover:bg-gray-700"
          >
            Edit link
          </button>
        </>
      )}
    </div>
  );
}



function BatchAccordionItem({ batch, onRecordingUpdated }: { batch: BatchRecord, onRecordingUpdated: () => void }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full bg-gray-50 dark:bg-gray-800 px-4 py-3 flex items-center text-left hover:bg-gray-100 dark:hover:bg-gray-700/50 transition-colors"
      >
        <span className="font-medium text-sm text-gray-800 dark:text-white">{batch.name}</span>
        <span className="text-xs text-gray-500 ml-2">{batch.sessions.length} session{batch.sessions.length !== 1 ? 's' : ''}</span>

        {batch.start_date && (
          <span className="text-xs text-gray-400 ml-auto">
            {new Date(batch.start_date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
            {batch.end_date && ` → ${new Date(batch.end_date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}`}
          </span>
        )}
        <svg
          className={`ml-3 h-4 w-4 text-gray-400 transition-transform ${isOpen ? "rotate-180" : ""}`}
          fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <div className="divide-y divide-gray-100 dark:divide-gray-700 border-t border-gray-200 dark:border-gray-700">
          {batch.sessions.length === 0 && (
            <p className="px-4 py-3 text-sm text-gray-400 italic bg-white dark:bg-transparent">No sessions in this batch.</p>
          )}
          {batch.sessions.map((session) => (
            <div key={session.id} className="px-4 py-3 bg-white dark:bg-transparent">
              <div className="flex items-center gap-2 text-sm">
                <span className="inline-flex size-5 items-center justify-center rounded-full bg-brand-100 text-xs font-bold text-brand-600 dark:bg-brand-900/30 dark:text-brand-400">
                  {session.day_number}
                </span>
                <span className="font-medium text-gray-700 dark:text-gray-200">
                  {session.title || `Day ${session.day_number}`}
                </span>
                {session.scheduled_at && (
                  <span className="text-xs text-gray-400 ml-2">
                    📅 {new Date(session.scheduled_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}
                  </span>
                )}
                {session.meet_link && (
                  <a href={session.meet_link} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-500 hover:underline ml-auto">🔗 Meet</a>
                )}
              </div>
              {session.recordings && session.recordings.length > 0 && (
                <div className="mt-2 pl-7 space-y-1.5">
                  {session.recordings.map((rec) => (
                    <RecordingRow key={rec.id} recording={rec} onUpdated={onRecordingUpdated} />
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/** Direct listing of batches → sessions → recordings without day_number matching */
function BatchesAndRecordings({
  batches,
  loadingSessions,
  onRecordingUpdated,
}: {
  batches: BatchRecord[];
  loadingSessions: boolean;
  onRecordingUpdated: () => void;
}) {
  if (loadingSessions) {
    return (
      <Section title="Batches & Recordings">
        <p className="text-sm text-gray-500 dark:text-gray-400">Loading…</p>
      </Section>
    );
  }

  const totalRecordings = batches.reduce((t, b) => t + b.sessions.reduce((s, sess) => s + (sess.recordings?.length ?? 0), 0), 0);

  if (batches.length === 0) {
    return (
      <Section title="Batches & Recordings">
        <p className="text-sm text-gray-500 dark:text-gray-400">
          No batches yet. <a href="/courses/live-sessions" className="text-brand-500 hover:underline">Go to Live Sessions</a> to create batches and sessions.
        </p>
      </Section>
    );
  }

  return (
    <Section title={`Batches & Recordings (${batches.length} batch${batches.length !== 1 ? 'es' : ''}, ${totalRecordings} recording${totalRecordings !== 1 ? 's' : ''})`}>
      <div className="space-y-4">
        {batches.map((batch) => (
          <BatchAccordionItem key={batch.id} batch={batch} onRecordingUpdated={onRecordingUpdated} />
        ))}
      </div>
    </Section>
  );
}

export default function CourseView() {
  const { id } = useParams<{ id: string }>();
  const [course, setCourse] = useState<Course | null>(null);
  const [loading, setLoading] = useState(true);
  const [batches, setBatches] = useState<BatchRecord[]>([]);
  const [loadingSessions, setLoadingSessions] = useState(false);

  useEffect(() => {
    if (!id) return;
    fetchCourse(id)
      .then(setCourse)
      .finally(() => setLoading(false));
  }, [id]);

  const loadSessions = useCallback(() => {
    if (!id) return;
    setLoadingSessions(true);
    fetchCourseSessions(id)
      .then(setBatches)
      .finally(() => setLoadingSessions(false));
  }, [id]);

  useEffect(() => {
    if (!id || !course) return;
    loadSessions();
  }, [id, course?.id, loadSessions]);

  if (loading || !course) {
    return (
      <div className="flex items-center justify-center py-12">
        {loading ? "Loading..." : "Course not found."}
      </div>
    );
  }

  const curriculum = safeJsonParse(course.curriculum, []);
  const learnOutcomes = safeJsonParse(course.learn_outcomes, []);
  const faqs = safeJsonParse(course.faqs, []);
  const feedback = safeJsonParse(course.feedback, []);
  const termsConditions = safeJsonParse(course.terms_conditions, []);
  const bonusesInfo = safeJsonParse(course.includes_info, []);
  const courseIncludesBanner = safeJsonParse(course.course_includes, []);

  return (
    <>
      <PageMeta title={`${course.title} | StudyCafe Admin`} description="Course details" />
      <PageBreadcrumb
        pageTitle={course.title}
        items={[{ label: "Courses", path: "/courses" }]}
        actions={
          <div className="flex items-center gap-2">
            <Link
              to={`/courses/${id}/edit`}
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-brand-500 px-4 py-2 text-sm font-medium text-white hover:bg-brand-600"
            >
              Edit
            </Link>
          </div>
        }
      />

      <div className="space-y-6">
        {/* Header Info */}
        <Section title="Course Details">
          <div className="flex flex-wrap items-center gap-3 mb-4">
            <Badge size="sm" color={course.is_published ? "success" : "error"}>
              {course.is_published ? "Published" : "Draft"}
            </Badge>
            <Badge size="sm" color="info">{course.status}</Badge>
            {course.course_type && <Badge size="sm" color="warning">{course.course_type}</Badge>}
          </div>
          <dl className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <Field label="Title">{course.title}</Field>
            {course.short_title && <Field label="Short Title">{course.short_title}</Field>}
            {course.slug && <Field label="Slug">/{course.slug}</Field>}
            <Field label="Price">₹{Number(course.price).toFixed(2)}</Field>
            {course.sale_price && <Field label="Sale Price">₹{Number(course.sale_price).toFixed(2)}</Field>}
            {course.language && <Field label="Language">{course.language}</Field>}
            <Field label="Students (banner)">{course.enrolled_count ?? 0}</Field>
            <Field label="Avg rating (banner)">
              {course.ratings != null && course.ratings !== "" ? Number(course.ratings).toFixed(1) : "—"}
            </Field>
            <Field label="Rating users (banner)">{course.rating_users ?? 0}</Field>
            {course.gateway && <Field label="Gateway">{course.gateway}</Field>}
            <Field label="Taxable">{course.taxable ? "Yes" : "No"}</Field>
            <Field label="Hide from Public">{course.hide_from_public ? "Yes" : "No"}</Field>
            <Field label="Completion certificate">{course.certificate_enabled !== false ? "Provided" : "Not provided"}</Field>
            {course.created_at && <Field label="Created">{new Date(course.created_at).toLocaleDateString()}</Field>}
            <div className="sm:col-span-2 lg:col-span-3">
              <Field label="Categories">
                {course.categories && course.categories.length > 0 ? (
                  <ul className="mt-1 flex flex-wrap gap-2">
                    {course.categories.map((c) => (
                      <li key={c.id}>
                        <Link
                          to={`/courses/categories/${c.id}/edit`}
                          className="inline-flex items-center rounded-md bg-gray-100 px-2.5 py-1 text-sm font-medium text-gray-800 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600"
                        >
                          {c.name}
                        </Link>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <span className="text-sm text-gray-500 dark:text-gray-400">None</span>
                )}
              </Field>
            </div>
          </dl>
          {course.brief_description && (
            <div className="mt-4">
              <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Brief Description</dt>
              <dd className="mt-1 text-gray-700 dark:text-gray-300">{course.brief_description}</dd>
            </div>
          )}
        </Section>

        {/* Thumbnail */}
        {course.thumbnail_url && (
          <Section title="Thumbnail">
            <img src={course.thumbnail_url} alt={course.title} className="max-w-md rounded-lg" referrerPolicy="no-referrer" loading="lazy" />
          </Section>
        )}

        {/* Description */}
        {course.description && (
          <Section title="Full Description">
            <div className="prose prose-sm dark:prose-invert max-w-none" dangerouslySetInnerHTML={{ __html: course.description }} />
          </Section>
        )}

        {/* Key Features */}
        {learnOutcomes.length > 0 && (
          <Section title="Key Features (Learn Outcomes)">
            <ul className="space-y-2">
              {learnOutcomes.map((item: string, i: number) => (
                <li key={i} className="flex items-start gap-2 text-sm text-gray-700 dark:text-gray-300">
                  <span className="mt-0.5 text-brand-500">✓</span>
                  <span dangerouslySetInnerHTML={{ __html: item }} />
                </li>
              ))}
            </ul>
          </Section>
        )}

        {/* Curriculum */}
        {curriculum.length > 0 && (
          <Section title={`Curriculum (${curriculum.length} items)`}>
            <div className="space-y-4">
              {curriculum.map((item: any, i: number) => (
                <div key={i} className="rounded-lg border border-gray-200 dark:border-gray-800 p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h4 className="font-medium text-gray-800 dark:text-white/90">{item.title}</h4>
                      {item.description && (
                        <p className="mt-1 text-sm text-gray-600 dark:text-gray-400 whitespace-pre-line">
                          {item.description}
                        </p>
                      )}
                    </div>
                    {item.minutes && (
                      <span className="shrink-0 text-sm font-medium text-brand-600 dark:text-brand-400">
                        {item.minutes} {item.minutes === "1" ? "min" : "mins"}
                      </span>
                    )}
                  </div>
                  {(item.video || (item.files && item.files.length > 0)) && (
                    <div className="mt-3 flex flex-wrap gap-2">
                      {item.video && (
                        <span className="inline-flex items-center rounded-md bg-blue-50 px-2 py-1 text-xs font-medium text-blue-700 ring-1 ring-inset ring-blue-700/10 dark:bg-blue-900/30 dark:text-blue-400 dark:ring-blue-400/20">
                          ▶ Video ID: {item.video}
                        </span>
                      )}
                      {item.files && item.files.map((_: any, fileIdx: number) => (
                        <span key={fileIdx} className="inline-flex items-center rounded-md bg-gray-50 px-2 py-1 text-xs font-medium text-gray-600 ring-1 ring-inset ring-gray-500/10 dark:bg-gray-800 dark:text-gray-400 dark:ring-gray-400/20">
                          📎 Attached File
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </Section>
        )}

        {/* Batches & Recordings */}
        <BatchesAndRecordings
          batches={batches}
          loadingSessions={loadingSessions}
          onRecordingUpdated={loadSessions}
        />

        {courseIncludesBanner.length > 0 && (
          <Section title="This course includes (banner)">
            <ul className="space-y-3">
              {courseIncludesBanner.map((item: any, i: number) => (
                <li key={i} className="flex items-center gap-3 text-sm text-gray-700 dark:text-gray-300">
                  {item.image && (
                    <img src={getImageUrl(item.image)} alt="" className="w-8 h-8 object-contain flex-shrink-0" />
                  )}
                  <span dangerouslySetInnerHTML={{ __html: item.title || "" }} />
                </li>
              ))}
            </ul>
          </Section>
        )}

        {bonusesInfo.length > 0 && (
          <Section title="Exclusive bonuses">
            <ul className="space-y-3">
              {bonusesInfo.map((item: any, i: number) => (
                <li key={i} className="flex flex-wrap items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
                  {item.image && (
                    <img src={getImageUrl(item.image)} alt="" className="w-9 h-9 object-contain flex-shrink-0" />
                  )}
                  <span dangerouslySetInnerHTML={{ __html: item.title || "" }} />
                  {item.worth && (
                    <span className="text-green-600 font-semibold text-xs">Worth {item.worth}</span>
                  )}
                </li>
              ))}
            </ul>
          </Section>
        )}

        {/* FAQs */}
        {faqs.length > 0 && (
          <Section title={`FAQs (${faqs.length})`}>
            <div className="space-y-4">
              {faqs.map((faq: any, i: number) => (
                <div key={i}>
                  <p className="font-medium text-gray-800 dark:text-white/90">{faq.question}</p>
                  <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">{faq.answer}</p>
                </div>
              ))}
            </div>
          </Section>
        )}

        {/* Feedback */}
        {feedback.length > 0 && (
          <Section title={`Reviews (${feedback.length})`}>
            <div className="grid gap-4 sm:grid-cols-2">
              {feedback.map((fb: any, i: number) => (
                <div key={i} className="rounded-lg border border-gray-200 dark:border-gray-800 p-4">
                  <p className="text-sm text-gray-600 dark:text-gray-400 italic">"{fb.review}"</p>
                  <div className="mt-2 flex items-center gap-2">
                    <p className="text-sm font-medium text-gray-800 dark:text-white/90">{fb.name}</p>
                    {fb.designation && <span className="text-xs text-gray-500">• {fb.designation}</span>}
                  </div>
                </div>
              ))}
            </div>
          </Section>
        )}

        {/* Terms & Conditions */}
        {termsConditions.length > 0 && (
          <Section title="Terms & Conditions">
            <JsonList label="" items={termsConditions} />
          </Section>
        )}

        {/* Requirements & Certifications */}
        {(course.requirements || course.certifications || course.keywords) && (
          <Section title="Additional Info">
            <dl className="space-y-3">
              {course.requirements && <Field label="Requirements">{course.requirements}</Field>}
              {course.certifications && <Field label="Certifications">{course.certifications}</Field>}
              {course.keywords && <Field label="Keywords"><span className="text-sm">{course.keywords}</span></Field>}
            </dl>
          </Section>
        )}
      </div>
    </>
  );
}
