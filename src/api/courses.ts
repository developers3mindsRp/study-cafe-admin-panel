import { api } from "./axios";

export interface Course {
  id: number;
  title: string;
  short_title: string | null;
  slug: string | null;
  brief_description: string | null;
  description: string | null;
  curriculum: string | null;
  learn_outcomes: string | null;
  requirements: string | null;
  terms_conditions: string | null;
  price: number | string;
  sale_price: number | string | null;
  thumbnail_url: string | null;
  youtube_url: string | null;
  language: string | null;
  course_type: string | null;
  taxable: boolean;
  keywords: string | null;
  meta_title: string | null;
  meta_description: string | null;
  meta_keywords: string | null;
  canonical_url: string | null;
  robots: string | null;
  og_title: string | null;
  og_description: string | null;
  og_image_url: string | null;
  faqs: string | null;
  feedback: string | null;
  includes_info: string | null;
  /** JSON [{ image, title }] — banner "This course includes" */
  course_includes: string | null;
  certifications: string | null;
  gateway: string | null;
  is_published: boolean;
  /** When true, course is omitted from public catalog and marketing pages (learners with access still reach /learn/...). */
  hide_from_public?: boolean;
  status: string;
  start_date: string | null;
  end_date: string | null;
  /** From admin list API — for sorting / display. */
  enrolled_count?: number;
  /** Average rating shown on public course banner (editable in admin). */
  ratings?: number | string | null;
  /** Number of users for banner rating text (editable in admin). */
  rating_users?: number;
  updated_at?: string;
  authors?: Array<{
    user_id: number;
    sort_order: number;
    name: string | null;
    role: string | null;
    bio: string | null;
    image_url: string | null;
  }>;
  author_user_id?: number | null;
  author_name?: string | null;
  author_role?: string | null;
  author_bio?: string | null;
  author_image?: string | null;
  created_at?: string;
  /** Admin internal: selected course category ids (course_cats). */
  course_cat_ids?: number[];
  categories?: Array<{ id: number; name: string; slug: string | null }>;
  /** Affiliate commission as a percent of paid order amount (0–100). */
  affiliate_commission?: number | string;
  /** '1year' (default) or 'lifetime' — determines how long enrolled access lasts. */
  validity?: 'lifetime' | '1year';
}

export interface CourseCat {
  id: number;
  name: string;
  slug: string | null;
  is_featured: boolean;
}

export interface CourseCatPayload {
  name: string;
  slug?: string;
  is_featured?: boolean;
}

export async function fetchCourses(): Promise<Course[]> {
  const res = await api.get<Course[]>("/admin/courses");
  return Array.isArray(res.data) ? res.data : [];
}

export async function fetchCourseCats(): Promise<CourseCat[]> {
  const res = await api.get<CourseCat[]>("/admin/course-cats");
  return Array.isArray(res.data) ? res.data : [];
}

export async function createCourseCat(payload: CourseCatPayload): Promise<CourseCat> {
  const { data } = await api.post("/admin/course-cats", payload);
  return data.data ?? data;
}

export async function updateCourseCat(id: number, payload: Partial<CourseCatPayload>): Promise<CourseCat> {
  const { data } = await api.put(`/admin/course-cats/${id}`, payload);
  return data.data ?? data;
}

export async function deleteCourseCat(id: number): Promise<void> {
  await api.delete(`/admin/course-cats/${id}`);
}

export async function fetchCourse(id: string): Promise<Course | null> {
  try {
    const res = await api.get<Course>(`/admin/courses/${id}`);
    return res.data ?? null;
  } catch {
    return null;
  }
}

export async function createCourse(payload: Partial<Course>): Promise<Course> {
  const res = await api.post<Course>("/admin/courses", payload);
  return res.data;
}

export async function updateCourse(id: string, payload: Partial<Course>): Promise<Course> {
  const res = await api.put<Course>(`/admin/courses/${id}`, payload);
  return res.data;
}

export async function generateCoursePreviewLink(courseId: number): Promise<{ previewUrl: string; expiresInSeconds: number }> {
  const res = await api.post(`/admin/courses/${courseId}/preview-token`);
  return res.data;
}

// ─── Course content: batches → sessions → recordings ────────────────────────

export interface RecordingRecord {
  id: number;
  url: string;
  source: string | null;
  is_visible: boolean;
}

export interface SessionRecord {
  id: number;
  batch_id: number;
  day_number: number;
  section_index: number;
  title: string | null;
  section_title: string | null;
  duration: number | null;
  scheduled_at: string | null;
  meet_link: string | null;
  recordings: RecordingRecord[];
}

export interface BatchRecord {
  id: number;
  name: string;
  start_date: string | null;
  end_date: string | null;
  meet_link: string | null;
  created_at: string | null;
  sessions: SessionRecord[];
}

/** Batch row returned by GET /admin/batches (includes owning course). */
export interface BatchRecordWithCourse extends BatchRecord {
  course_id: number;
  course_title: string;
}

export interface BatchesListMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

export interface BatchEnrollmentRecord {
  id: number;
  batch_id: number;
  user_id: number;
  enrolled_at: string | null;
}

export async function fetchCourseSessions(courseId: string): Promise<BatchRecord[]> {
  try {
    const res = await api.get<BatchRecord[]>(`/admin/courses/${courseId}/sessions`);
    return Array.isArray(res.data) ? res.data : [];
  } catch {
    return [];
  }
}

/** Paginated batches for Live Sessions admin (optional course filter). */
export async function fetchBatchesList(params: {
  courseId?: number;
  page?: number;
  limit?: number;
}): Promise<{ rows: BatchRecordWithCourse[]; meta: BatchesListMeta }> {
  const query: Record<string, number> = {
    page: params.page ?? 1,
    limit: params.limit ?? 10,
  };
  if (params.courseId != null && Number.isFinite(params.courseId)) {
    query.course_id = params.courseId;
  }
  const res = await api.get("/admin/batches", { params: query });
  // After axios interceptor: { data, total, page, limit, ... } (meta flattened to root).
  // Without interceptor: { success, data, meta } — support nested meta too.
  const body = res.data as {
    data: BatchRecordWithCourse[];
    total?: number;
    page?: number;
    limit?: number;
    totalPages?: number;
    hasNextPage?: boolean;
    hasPreviousPage?: boolean;
    meta?: {
      total: number;
      page: number;
      limit: number;
      totalPages: number;
      hasNextPage: boolean;
      hasPreviousPage: boolean;
    };
  };
  const m = body.meta ?? body;
  return {
    rows: Array.isArray(body.data) ? body.data : [],
    meta: {
      total: Number(m.total) || 0,
      page: Number(m.page) || 1,
      limit: Number(m.limit) || 10,
      totalPages: Number(m.totalPages) || 0,
      hasNextPage: Boolean(m.hasNextPage),
      hasPreviousPage: Boolean(m.hasPreviousPage),
    },
  };
}

export async function updateRecording(recordingId: number, payload: { url?: string; source?: string | null; is_visible?: boolean }): Promise<RecordingRecord> {
  const res = await api.put<RecordingRecord>(`/admin/recordings/${recordingId}`, payload);
  return res.data;
}

export async function addRecording(sessionId: number, payload: { url: string; source?: string | null; is_visible?: boolean }): Promise<RecordingRecord> {
  const res = await api.post<RecordingRecord>(`/admin/sessions/${sessionId}/recordings`, payload);
  return res.data;
}

export async function toggleRecordingVisibility(recordingId: number, isVisible: boolean): Promise<RecordingRecord> {
  const res = await api.put<RecordingRecord>(`/admin/recordings/${recordingId}/visibility`, { is_visible: isVisible });
  return res.data;
}

export async function deleteRecording(recordingId: number): Promise<void> {
  await api.delete(`/admin/recordings/${recordingId}`);
}

export async function deleteSession(sessionId: number): Promise<void> {
  await api.delete(`/admin/sessions/${sessionId}`);
}

export async function deleteBatch(batchId: number): Promise<void> {
  await api.delete(`/admin/batches/${batchId}`);
}

export async function createBatch(courseId: string, payload: { name?: string | null; start_date?: string | null; end_date?: string | null; meet_link?: string | null }): Promise<BatchRecord> {
  const res = await api.post<BatchRecord>(`/admin/courses/${courseId}/batches`, payload);
  return res.data;
}

export async function updateBatch(batchId: number, payload: Partial<{ name: string; start_date: string | null; end_date: string | null; meet_link: string | null }>): Promise<BatchRecord> {
  const res = await api.put<BatchRecord>(`/admin/batches/${batchId}`, payload);
  return res.data;
}

export async function syncBatchSessions(batchId: number): Promise<BatchRecord> {
  const res = await api.post<BatchRecord>(`/admin/batches/${batchId}/sync`);
  return res.data;
}

export async function createSession(batchId: number, payload: { title: string; day_number?: number; scheduled_at?: string | null; meet_link?: string | null }): Promise<SessionRecord> {
  const res = await api.post<SessionRecord>(`/admin/batches/${batchId}/sessions`, payload);
  return res.data;
}

export async function updateSession(sessionId: number, payload: Partial<{ title: string; day_number: number; scheduled_at: string | null; meet_link: string | null }>): Promise<SessionRecord> {
  const res = await api.put<SessionRecord>(`/admin/sessions/${sessionId}`, payload);
  return res.data;
}

// ─── Batch Enrollments ──────────────────────────────────────────────

export async function fetchBatchEnrollments(batchId: number): Promise<BatchEnrollmentRecord[]> {
  try {
    const res = await api.get<BatchEnrollmentRecord[]>(`/admin/batches/${batchId}/enrollments`);
    return Array.isArray(res.data) ? res.data : [];
  } catch {
    return [];
  }
}

export async function addBatchEnrollment(batchId: number, userId: number): Promise<BatchEnrollmentRecord> {
  const res = await api.post<BatchEnrollmentRecord>(`/admin/batches/${batchId}/enrollments`, { user_id: userId });
  return res.data;
}

export async function removeBatchEnrollment(enrollmentId: number): Promise<void> {
  await api.delete(`/admin/batch-enrollments/${enrollmentId}`);
}

export interface UserEnrollmentRecord {
  enrollment_id: number | null;
  batch_id: number | null;
  batch_name: string | null;
  course_id: number | null;
  course_title: string | null;
  enrolled_at: string | null;
  /** Order row id from order-service (paid purchases only). */
  order_id?: string | null;
  /** e.g. completed — aligned with GET /orders/my-purchases rows */
  purchase_status?: string | null;
  from_purchase?: boolean;
}

export async function fetchUserEnrollments(userId: number): Promise<UserEnrollmentRecord[]> {
  try {
    const res = await api.get<UserEnrollmentRecord[]>(`/admin/users/${userId}/enrollments`);
    return Array.isArray(res.data) ? res.data : [];
  } catch {
    return [];
  }
}

/** Fetch lightweight batch list for a specific course (id + name only). */
export async function fetchCourseBatches(courseId: number): Promise<{ id: number; name: string }[]> {
  try {
    const result = await fetchBatchesList({ courseId, limit: 100 });
    return result.rows.map((b) => ({ id: b.id, name: b.name }));
  } catch {
    return [];
  }
}

export interface BulkEnrollResult {
  email: string;
  status: "enrolled" | "already_enrolled" | "user_not_found" | "error";
  message?: string;
}

export async function bulkEnrollByEmails(
  batchId: number,
  emails: string[]
): Promise<BulkEnrollResult[]> {
  const res = await api.post<BulkEnrollResult[]>(
    `/admin/batches/${batchId}/enrollments/bulk`,
    { emails }
  );
  return Array.isArray(res.data) ? res.data : [];
}
