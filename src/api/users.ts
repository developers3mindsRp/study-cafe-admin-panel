/**
 * Users API Client
 *
 * Built on top of the generic apiFactory.
 * Only custom types and extensions live here — CRUD methods come free.
 */

import { createCrudApi, type ListQuery } from "./apiFactory";
import type { TrashScope } from "../components/trash/TrashScopeTabs";
import { api } from "./axios";
import { requireAuthForExport } from "../lib/exportAuth";
import type { DataTableFetchParams, DataTableFetchResult } from "../components/tables/data-table";
import { fetchAllPaginatedForExport } from "../utils/fetchAllPaginatedForExport";
import type { ExportProgressCallback } from "../utils/exportProgress";

export interface User {
  id: string;
  name: string;
  email: string;
  phone?: string;
  role?: string;
  role_id?: number;
  status?: string;
  is_active?: boolean;
  created_at?: string;

  // Profile
  first_name?: string;
  last_name?: string;
  display_name?: string;
  profile_pic_url?: string;

  // Location
  city?: string;
  state?: string;
  country?: string;

  // Professional
  profession?: string;
  designation?: string;
  company?: string;
  /** About / introduction (users.bio) */
  bio?: string | null;

  // Social
  facebook?: string;
  twitter?: string;
  linkedin?: string;
  instagram?: string;
  youtube?: string;

  // Tax
  gst?: string | null;

  // Membership (from user_memberships — canonical source)
  membership?: string | null;
  plan?: string;
  membership_name?: string | null;
  membership_plan_name?: string | null;
  membership_status?: string | null;
  membership_expires_at?: string | null;
  membership_payment_id?: string | null;
  membership_plan_purchased?: string | null;
  membership_plan_expiry?: string | null;
  membership_plan_price?: string | null;
}

export interface UserMembership {
  id: number;
  user_id: number;
  membership_type: string;
  order_id: string | null;
  starts_at: string;
  expires_at: string;
}

// Re-export ListQuery from factory for convenience
export type { ListQuery as ListParams } from "./apiFactory";

const BASE_URL = "/users";

export const usersApi = createCrudApi<User>(BASE_URL)();

export async function restoreUser(id: string | number): Promise<void> {
  await usersApi.restore(String(id));
}

/** Fetch all membership records for a user from the admin API. */
export async function fetchUserMemberships(userId: string | number): Promise<UserMembership[]> {
  try {
    const { data } = await api.get<UserMembership[]>(`/admin/users/${userId}/memberships`);
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
}

/** Toolbar filters on the users list (shared by table + CSV export). */
export type UsersListFilters = {
  email: string;
  status: string;
  membership: string;
  role: string;
  state: string;
  designation: string;
  profession: string;
  /** Numeric course id (sent as string). Only used by export — no toolbar field. */
  courseId: string;
  joinedFrom: string;
  joinedTo: string;
};

export type BuildUsersListParamsInput = {
  filters: UsersListFilters;
  page?: number;
  limit?: number;
  search?: string;
  sortBy?: string;
  sortOrder?: "ASC" | "DESC";
  trashScope?: TrashScope;
};

/** One query shape for list + export — keeps filtered export in sync with the grid. */
export function buildUsersListParams(input: BuildUsersListParamsInput): ListQuery {
  const { filters, page, limit, search, sortBy, sortOrder, trashScope } = input;
  const params: ListQuery = {};

  if (page != null) params.page = page;
  if (limit != null) params.limit = limit;
  if (search?.trim()) params.search = search.trim();
  if (sortBy) params.sortBy = sortBy;
  if (sortOrder) params.sortOrder = sortOrder;

  const email = filters.email.trim();
  if (email) params.email = email;
  if (filters.status) params.status = filters.status;
  if (filters.membership) params.membership = filters.membership;
  if (filters.role) params.role = filters.role;
  const state = filters.state.trim();
  if (state) params.state = state;
  const designation = filters.designation?.trim();
  if (designation) params.designation = designation;
  const profession = filters.profession?.trim();
  if (profession) params.profession = profession;
  const courseId = filters.courseId?.trim();
  if (courseId) params.course_id = courseId;
  if (filters.joinedFrom) params.joined_from = filters.joinedFrom;
  if (filters.joinedTo) params.joined_to = filters.joinedTo;
  if (trashScope === "trash") params.trashed = "1";

  return params;
}

export function usersListFiltersAreActive(filters: UsersListFilters): boolean {
  return Boolean(
    filters.email.trim() ||
      filters.status ||
      filters.membership ||
      filters.role ||
      filters.state.trim() ||
      filters.designation?.trim() ||
      filters.profession?.trim() ||
      filters.courseId?.trim() ||
      filters.joinedFrom ||
      filters.joinedTo,
  );
}

export function usersListFiltersFromValues(values: Record<string, string | undefined>): UsersListFilters {
  return {
    email: values.email ?? "",
    status: values.status ?? "",
    membership: values.membership ?? "",
    role: values.role ?? "",
    state: values.state ?? "",
    designation: values.designation ?? "",
    profession: values.profession ?? "",
    courseId: values.courseId ?? "",
    joinedFrom: values.joinedFrom ?? "",
    joinedTo: values.joinedTo ?? "",
  };
}

/** Empty filter object — useful for export flows that ignore the toolbar state. */
export function emptyUsersListFilters(): UsersListFilters {
  return {
    email: "",
    status: "",
    membership: "",
    role: "",
    state: "",
    designation: "",
    profession: "",
    courseId: "",
    joinedFrom: "",
    joinedTo: "",
  };
}

/** Server-side paginated list for DataTable. */
export async function fetchUsersPaginated(
  params: DataTableFetchParams & { filters: UsersListFilters; trashScope?: TrashScope },
): Promise<DataTableFetchResult<User>> {
  const res = await usersApi.list(
    buildUsersListParams({
      filters: params.filters,
      trashScope: params.trashScope,
      page: params.page,
      limit: params.limit,
      search: params.search,
      sortBy: params.sortBy,
      sortOrder: params.sortOrder,
    }),
  );
  const totalPages = res.pages ?? (res.total ? Math.ceil(res.total / res.limit) : 0);
  return {
    data: res.data ?? [],
    meta: {
      total: res.total ?? 0,
      page: res.page ?? 1,
      limit: res.limit ?? 10,
      totalPages,
      hasNextPage: (res.page ?? 1) < totalPages,
      hasPreviousPage: (res.page ?? 1) > 1,
    },
  };
}

export type UserImportRow = {
  rowNumber?: number;
  email: string;
  password?: string;
  name?: string;
  first_name?: string;
  last_name?: string;
  phone?: string;
  role?: string;
  status?: string;
  membership?: string;
  plan_price?: string;
  payment_id?: string;
  plan_purchased?: string;
  plan_expiry?: string;
  designation?: string;
  profession?: string;
  company?: string;
  city?: string;
  state?: string;
  country?: string;
  linkedin?: string;
  facebook?: string;
  twitter?: string;
  instagram?: string;
  youtube?: string;
  bio?: string;
  gst?: string;
};

export type UserImportFieldError = {
  field: string;
  message: string;
};

export type UserImportResult = {
  rowNumber?: number;
  email: string;
  status: "created" | "updated" | "skipped" | "error";
  userCreated?: boolean;
  membershipGranted?: boolean;
  coursesEnrolled?: number;
  coursesSkipped?: number;
  message?: string;
  fieldErrors?: UserImportFieldError[];
};

export type UserImportSummary = {
  results: UserImportResult[];
  imported: number;
  failed: number;
  skipped: number;
};

export async function importUsersFromCsv(payload: {
  rows: UserImportRow[];
}): Promise<UserImportSummary> {
  const res = await api.post<UserImportSummary>("/admin/users/import", payload);
  const data = res.data;
  if (data && Array.isArray(data.results)) return data;
  if (Array.isArray(data)) {
    return {
      results: data as unknown as UserImportResult[],
      imported: (data as UserImportResult[]).filter((r) => r.status === "created" || r.status === "updated").length,
      failed: (data as UserImportResult[]).filter((r) => r.status === "error").length,
      skipped: (data as UserImportResult[]).filter((r) => r.status === "skipped").length,
    };
  }
  return { results: [], imported: 0, failed: 0, skipped: 0 };
}

/**
 * Fetches admin panel users from /auth/admin/users.
 * Returns [] on 403 or any error so callers can merge gracefully.
 */
export async function fetchAdminPanelUsers(): Promise<User[]> {
  try {
    const { data } = await api.get<User[]>("/auth/admin/users");
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
}

/**
 * Cached admin-panel users for author pickers. They are few and stable within
 * a session, so we fetch them once from /auth/admin/users and reuse.
 */
let adminAuthorUsersCache: User[] | null = null;

async function getAdminAuthorUsers(): Promise<User[]> {
  if (adminAuthorUsersCache) return adminAuthorUsersCache;
  adminAuthorUsersCache = await fetchAdminPanelUsers();
  return adminAuthorUsersCache;
}

function sortUsersByName(list: User[]): User[] {
  return [...list].sort((a, b) => {
    const nameA = (a.name || a.display_name || a.email || "").toLowerCase();
    const nameB = (b.name || b.display_name || b.email || "").toLowerCase();
    return nameA.localeCompare(nameB);
  });
}

/** First page of a live user search (all users), used only when a query is typed. */
async function searchRegularUsers(q: string): Promise<User[]> {
  try {
    const res = await usersApi.list({
      page: 1,
      limit: 10,
      sortBy: "name",
      sortOrder: "ASC",
      lean: true,
      ...(q ? { search: q } : {}),
    });
    return res.data ?? [];
  } catch {
    return [];
  }
}

/**
 * Author search for filters/pickers.
 *
 * Empty query (default dropdown) → admin-panel users only, so the list stays
 * clean and relevant (these are the people who author content). Typing a query
 * → live-searches ALL users and merges in matching admins, so any author is
 * still reachable by writing, like the previous free-text filter.
 */
export async function searchAuthorUsers(search: string): Promise<User[]> {
  const q = search.trim();
  const admins = await getAdminAuthorUsers();

  if (!q) {
    // Fall back to a plain user search only when the admin list is unavailable
    // (e.g. the current admin lacks the admin_users:list permission).
    return sortUsersByName(admins.length > 0 ? admins : await searchRegularUsers(""));
  }

  const regular = await searchRegularUsers(q);

  const ql = q.toLowerCase();
  const matchingAdmins = admins.filter(
    (u) =>
      (u.name || "").toLowerCase().includes(ql) ||
      (u.display_name || "").toLowerCase().includes(ql) ||
      (u.email || "").toLowerCase().includes(ql) ||
      (u.role || "").toLowerCase().includes(ql) ||
      (u.designation || "").toLowerCase().includes(ql),
  );

  const seen = new Set(regular.map((u) => String(u.id)));
  const merged = [...regular];
  for (const au of matchingAdmins) {
    if (!seen.has(String(au.id))) merged.push(au);
  }
  return sortUsersByName(merged);
}

/** Server-side export job with progress polling — fast + percentage for large datasets. */
export type UserExportJobStatus = {
  jobId: string;
  status: "running" | "completed" | "failed";
  phase: "fetching" | "writing";
  loaded: number;
  total: number;
  error?: string | null;
  /** One-time token for browser-native download (avoids loading lakhs of rows into memory). */
  downloadToken?: string;
};

const EXPORT_POLL_MS = 500;

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/** Trigger file download from a Blob (authenticated export). */
function triggerBlobDownload(blob: Blob, filename: string): void {
  const objectUrl = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = objectUrl;
  anchor.style.display = "none";
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(objectUrl);
}

export async function runUsersExportWithProgress(
  params: Omit<BuildUsersListParamsInput, "page" | "limit"> & {
    filename?: string;
    onProgress?: ExportProgressCallback;
  },
): Promise<void> {
  await requireAuthForExport();

  const { onProgress, filename, ...rest } = params;
  const query = buildUsersListParams(rest);

  onProgress?.({ loaded: 0, total: null, phase: "fetching" });

  const { data: start } = await api.post<{ jobId: string; total: number }>(
    "/users/export",
    null,
    { params: query },
  );
  const jobId = start.jobId;
  const total = start.total ?? 0;

  onProgress?.({ loaded: 0, total, phase: "fetching" });

  let completedStatus: UserExportJobStatus | null = null;
  for (;;) {
    const { data: status } = await api.get<UserExportJobStatus>(
      `/users/export/${jobId}/status`,
    );

    onProgress?.({
      loaded: status.loaded,
      total: status.total,
      phase: status.phase === "writing" ? "writing" : "fetching",
    });

    if (status.status === "completed") {
      completedStatus = status;
      break;
    }
    if (status.status === "failed") {
      throw new Error(status.error || "Export failed");
    }
    await sleep(EXPORT_POLL_MS);
  }

  onProgress?.({ loaded: total, total, phase: "writing" });

  const downloadToken = completedStatus?.downloadToken;
  if (!downloadToken) {
    throw new Error("Export download token missing — please try again");
  }

  const downloadName = filename
    ? (filename.toLowerCase().endsWith(".csv") ? filename : `${filename}.csv`)
    : undefined;
  const datePart = new Date().toISOString().slice(0, 10);
  const finalName = downloadName ?? `users-export-${datePart}.csv`;

  const response = await api.get<Blob>(
    `/users/export/${encodeURIComponent(jobId)}/download`,
    {
      params: { token: downloadToken, filename: finalName },
      responseType: "blob",
    },
  );
  triggerBlobDownload(response.data, finalName);
}

/** @deprecated Use runUsersExportWithProgress — loads all rows in browser memory. */
export async function downloadUsersExportCsv(
  params: Omit<BuildUsersListParamsInput, "page" | "limit">,
  filename?: string,
): Promise<void> {
  await requireAuthForExport();
  const query = buildUsersListParams(params);
  const response = await api.get<Blob>("/users/export.csv", {
    params: query,
    responseType: "blob",
  });
  const blob = response.data;
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  const datePart = new Date().toISOString().slice(0, 10);
  anchor.download = filename?.toLowerCase().endsWith(".csv")
    ? filename
    : `${filename ?? `users-export-${datePart}`}.csv`;
  anchor.click();
  URL.revokeObjectURL(url);
}

/** Loads every user page matching list filters + search/sort (with progress callback). */
export async function fetchAllUsersForExport(
  params: Omit<BuildUsersListParamsInput, "page" | "limit"> & {
    onProgress?: ExportProgressCallback;
  },
): Promise<User[]> {
  await requireAuthForExport();
  const { onProgress, ...rest } = params;
  const query = buildUsersListParams(rest);
  return fetchAllPaginatedForExport({
    onProgress,
    fetchPage: async (page, limit) => {
      const res = await usersApi.list({ ...query, page, limit });
      return { data: res.data ?? [], total: res.total ?? 0 };
    },
  });
}
