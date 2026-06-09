/**
 * Users API Client
 *
 * Built on top of the generic apiFactory.
 * Only custom types and extensions live here — CRUD methods come free.
 */

import { createCrudApi, type ListQuery } from "./apiFactory";
import type { TrashScope } from "../components/trash/TrashScopeTabs";
import { api } from "./axios";
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

  // Membership
  membership?: string | null;
  plan?: string;
  membership_name?: string | null;
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

/** Toolbar filters on the users list (shared by table + Excel export). */
export type UsersListFilters = {
  email: string;
  status: string;
  membership: string;
  role: string;
  state: string;
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

/** Loads every user page matching list filters + search/sort. */
export async function fetchAllUsersForExport(
  params: Omit<BuildUsersListParamsInput, "page" | "limit"> & {
    onProgress?: ExportProgressCallback;
  },
): Promise<User[]> {
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
