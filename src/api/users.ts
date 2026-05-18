/**
 * Users API Client
 *
 * Built on top of the generic apiFactory.
 * Only custom types and extensions live here — CRUD methods come free.
 */

import { createCrudApi } from "./apiFactory";
import { api } from "./axios";
import type { DataTableFetchParams, DataTableFetchResult } from "../components/tables/data-table";

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

  // Membership
  membership?: string | null;
  plan?: string;
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

/** Fetch all membership records for a user from the admin API. */
export async function fetchUserMemberships(userId: string | number): Promise<UserMembership[]> {
  try {
    const { data } = await api.get<UserMembership[]>(`/admin/users/${userId}/memberships`);
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
}

/** Server-side paginated list for DataTable. Adapts list() response to DataTable meta shape. */
export async function fetchUsersPaginated(
  params: DataTableFetchParams & {
    role?: string;
    status?: string;
    email?: string;
    state?: string;
    membership?: string;
    joinedFrom?: string;
    joinedTo?: string;
  }
): Promise<DataTableFetchResult<User>> {
  const res = await usersApi.list({
    page: params.page,
    limit: params.limit,
    search: params.search || undefined,
    sortBy: params.sortBy || undefined,
    sortOrder: params.sortOrder,
    ...(params.role ? { role: params.role } : {}),
    ...(params.status ? { status: params.status } : {}),
    ...(params.email ? { email: params.email } : {}),
    ...(params.state ? { state: params.state } : {}),
    ...(params.membership ? { membership: params.membership } : {}),
    ...(params.joinedFrom ? { joined_from: params.joinedFrom } : {}),
    ...(params.joinedTo ? { joined_to: params.joinedTo } : {}),
  });
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

const USERS_EXPORT_PAGE_SIZE = 500;

/** Params aligned with list filters + optional search/sort (for export). */
export type FetchUsersExportParams = {
  search?: string;
  sortBy?: string;
  sortOrder?: "ASC" | "DESC";
  role?: string;
  status?: string;
  email?: string;
  state?: string;
  membership?: string;
  joinedFrom?: string;
  joinedTo?: string;
};

export async function fetchAllUsersForExport(params: FetchUsersExportParams): Promise<User[]> {
  const all: User[] = [];
  let page = 1;
  let totalPages = 1;

  for (;;) {
    const res = await usersApi.list({
      page,
      limit: USERS_EXPORT_PAGE_SIZE,
      search: params.search?.trim() !== "" ? params.search : undefined,
      sortBy: params.sortBy || undefined,
      sortOrder: params.sortOrder,
      ...(params.role ? { role: params.role } : {}),
      ...(params.status ? { status: params.status } : {}),
      ...(params.email ? { email: params.email } : {}),
      ...(params.state ? { state: params.state } : {}),
      ...(params.membership ? { membership: params.membership } : {}),
      ...(params.joinedFrom ? { joined_from: params.joinedFrom } : {}),
      ...(params.joinedTo ? { joined_to: params.joinedTo } : {}),
    });
    const chunk = res.data ?? [];
    all.push(...chunk);
    totalPages = res.pages ?? (res.total ? Math.ceil(res.total / USERS_EXPORT_PAGE_SIZE) : 0);
    if (chunk.length < USERS_EXPORT_PAGE_SIZE) break;
    if (totalPages > 0 && page >= totalPages) break;
    page += 1;
  }

  return all;
}
