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
  /** When true, learners who complete the course may download a completion certificate. */
  certificate_enabled?: boolean;
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
  /** Computed boolean: true when validity === 'lifetime'. */
  is_lifetime?: boolean;
  /** JSON string of dynamic description sections for the course detail page. */
  detail_sections?: string | null;
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

export async function fetchCourses(params?: { trashed?: boolean }): Promise<Course[]> {
  const res = await api.get<Course[]>("/admin/courses", {
    params: params?.trashed ? { trashed: "1" } : undefined,
  });
  return Array.isArray(res.data) ? res.data : [];
}

export async function deleteCourse(id: number): Promise<void> {
  await api.delete(`/admin/courses/${id}`);
}

export async function restoreCourse(id: number): Promise<void> {
  await api.post(`/admin/courses/${id}/restore`);
}

/** Hard-delete a trashed course and all its owned data. Cannot be undone. */
export async function deleteCoursePermanently(id: number): Promise<void> {
  await api.delete(`/admin/courses/${id}/permanent`);
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

/** How a learner's enrollment came about, resolved by order-service. */
export type EnrollmentSource =
  /** A live paid course order explains this enrollment. */
  | "course_order"
  /** Access came via a membership plan — there is no course order to match. */
  | "membership"
  /** The order that granted it has since been hard-deleted; the enrollment is orphaned. */
  | "deleted_order"
  /** An order exists but is pending/failed/refunded, so it does not explain access. */
  | "unpaid_order"
  /** No trace found in orders or the outbox (typically pre-migration). */
  | "unknown";

export interface BatchEnrollmentRecord {
  id: number;
  batch_id: number;
  user_id: number;
  enrolled_at: string | null;
  /** Owning course, added by course-service so the caller need not look it up. */
  course_id?: number | null;
  // The fields below are attached by admin-service from order-service's
  // /internal/courses/:courseId/enrollment-sources. They are absent when that
  // lookup fails, so treat every one as optional.
  enrollment_source?: EnrollmentSource;
  is_membership_linked?: boolean;
  source_order_id?: string | null;
  source_order_status?: string | null;
  source_order_was_refunded?: boolean;
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

export async function addBatchEnrollment(
  batchId: number,
  userId: number,
  opts?: { price?: string; paymentId?: string; courseId?: number },
): Promise<BatchEnrollmentRecord> {
  const res = await api.post<BatchEnrollmentRecord>(`/admin/batches/${batchId}/enrollments`, {
    user_id: userId,
    ...(opts?.price ? { price: opts.price } : {}),
    ...(opts?.paymentId ? { paymentId: opts.paymentId } : {}),
    ...(opts?.courseId ? { courseId: opts.courseId } : {}),
  });
  return res.data;
}

export async function removeBatchEnrollment(enrollmentId: number): Promise<void> {
  await api.delete(`/admin/batch-enrollments/${enrollmentId}`);
}

/**
 * Atomically set a user's single batch for a course. Removes any other batch of the same course
 * the user was in, then ensures the target enrollment — so switching batches never leaves the user
 * enrolled in two batches at once. Use this (not addBatchEnrollment) when editing an existing user.
 */
export async function setUserCourseBatch(
  courseId: number,
  batchId: number,
  userId: number,
  opts?: { price?: string; paymentId?: string },
): Promise<{ batch_id: number; user_id: number; created: boolean; firstEnrollment: boolean }> {
  const res = await api.post(`/admin/courses/${courseId}/set-batch`, {
    user_id: userId,
    batch_id: batchId,
    ...(opts?.price ? { price: opts.price } : {}),
    ...(opts?.paymentId ? { paymentId: opts.paymentId } : {}),
  });
  return res.data;
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
  /** e.g. completed, pending, admin-granted */
  purchase_status?: string | null;
  /** Mirror of frontend accessStatus: 'active' | 'expired' */
  access_status?: "active" | "expired" | null;
  /** ISO datetime when access expires; null = lifetime. */
  access_expires_at?: string | null;
  /** Legacy WP workflow status: 'publish' = active, 'draft' = expired, null = native order. */
  wp_post_status?: string | null;
  from_purchase?: boolean;
  is_admin_granted?: boolean;
}

export interface UserEnrollmentsResponse {
  active_count: number;
  expired_count: number;
  total_count: number;
  active_courses: UserEnrollmentRecord[];
  expired_courses: UserEnrollmentRecord[];
}

export async function fetchUserEnrollments(userId: number): Promise<UserEnrollmentsResponse> {
  const empty: UserEnrollmentsResponse = {
    active_count: 0,
    expired_count: 0,
    total_count: 0,
    active_courses: [],
    expired_courses: [],
  };
  try {
    const res = await api.get<UserEnrollmentsResponse>(`/admin/users/${userId}/enrollments`);
    const d = res.data as any;
    // Gracefully handle legacy flat-array responses from older deployments.
    if (Array.isArray(d)) {
      return { ...empty, total_count: d.length, active_courses: d, expired_courses: [] };
    }
    return {
      active_count: d.active_count ?? 0,
      expired_count: d.expired_count ?? 0,
      total_count: d.total_count ?? 0,
      active_courses: Array.isArray(d.active_courses) ? d.active_courses : [],
      expired_courses: Array.isArray(d.expired_courses) ? d.expired_courses : [],
    };
  } catch {
    return empty;
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

/** One row of a bulk allotment request: an email plus the payment it was collected for. */
export interface BulkEnrollEntry {
  email: string;
  /** Amount paid. Blank/omitted records a ₹0 free allotment. */
  price?: string;
  /** Razorpay payment id. Must be unique and requires a price above 0. */
  paymentId?: string;
}

export interface BulkEnrollResult {
  email: string;
  /** `invalid` = rejected before processing (bad email, bad amount, duplicate payment id). */
  status: "enrolled" | "already_enrolled" | "user_not_found" | "error" | "invalid";
  /** Why the row was rejected or skipped — shown per row so the admin can fix the file. */
  message?: string;
  /**
   * Present (and false) only when the user was enrolled + granted access but the
   * backing course order could not be created. They have access; the order/
   * "Purchased Course" record and revenue row are missing and may need a backfill.
   */
  orderCreated?: boolean;
  /** Reason the order failed — e.g. a payment id already linked to another order. */
  orderError?: string;
  amount?: number | null;
  paymentId?: string;
}

export async function bulkEnrollByEmails(
  batchId: number,
  entries: BulkEnrollEntry[],
  opts?: { price?: string; paymentId?: string; courseId?: number }
): Promise<BulkEnrollResult[]> {
  const res = await api.post<BulkEnrollResult[]>(
    `/admin/batches/${batchId}/enrollments/bulk`,
    {
      entries,
      // Kept for older admin-service builds that only read `emails`; newer ones prefer
      // `entries` and ignore this. Harmless duplication, avoids a lockstep deploy.
      emails: entries.map((e) => e.email),
      ...opts,
    }
  );
  return Array.isArray(res.data) ? res.data : [];
}
