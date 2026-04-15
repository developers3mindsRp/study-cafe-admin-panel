/**
 * Users API Client
 *
 * Built on top of the generic apiFactory.
 * Only custom types and extensions live here — CRUD methods come free.
 */

import { createCrudApi } from "./apiFactory";
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

// Re-export ListQuery from factory for convenience
export type { ListQuery as ListParams } from "./apiFactory";

const BASE_URL = "/users";

export const usersApi = createCrudApi<User>(BASE_URL)();

/** Server-side paginated list for DataTable. Adapts list() response to DataTable meta shape. */
export async function fetchUsersPaginated(
  params: DataTableFetchParams
): Promise<DataTableFetchResult<User>> {
  const res = await usersApi.list({
    page: params.page,
    limit: params.limit,
    search: params.search || undefined,
    sortBy: params.sortBy || undefined,
    sortOrder: params.sortOrder,
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
