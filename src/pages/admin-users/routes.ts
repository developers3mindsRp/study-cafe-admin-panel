/**
 * Admin Users area — React Router paths and auth-service API paths.
 */

export const adminUserPaths = {
  list: "/admin-users",
  create: "/admin-users/create",
  view: (id: string | number) => `/admin-users/${id}`,
  edit: (id: string | number) => `/admin-users/${id}/edit`,
} as const;

/** Relative to the API base URL; used with `adminUsersApi` (axios instance). */
export const adminUsersApiPaths = {
  roles: "/auth/admin/roles",
  createRole: "/auth/admin/role",
  users: "/auth/admin/users",
  user: (id: number) => `/auth/admin/users/${id}`,
} as const;
