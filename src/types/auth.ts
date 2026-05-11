/**
 * Admin auth types: user, roles, permissions for RBAC.
 */

export type AdminRole = "super_admin" | "admin" | "editor" | "viewer" | "editor_articles" | "custom";

export interface AdminUser {
  id: string;
  email: string;
  name: string;
  role: AdminRole;
  /** Permissions for module/sub-module access (e.g. "articles:list", "articles:create") */
  permissions: string[];
  /** Optional: backend may return roles array instead of single role */
  roles?: AdminRole[];
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  /** Long-lived token from auth-service; required for silent session renewal after access JWT expires */
  refreshToken?: string;
  user: AdminUser;
  expiresIn?: number;
}

export interface AuthState {
  user: AdminUser | null;
  token: string | null;
  isAuthenticated: boolean;
  isInitialized: boolean;
  isLoading: boolean;
}

export const AUTH_STORAGE_KEY = "studycafe_admin_auth";

export interface PersistedAuth {
  token: string;
  user: AdminUser;
  expiresAt?: number;
  refreshToken?: string;
}
