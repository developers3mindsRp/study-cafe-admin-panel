import { api } from "./axios";
import { adminUsersApiPaths } from "../pages/admin-users/routes";

export interface AdminPanelUser {
  id: number;
  email: string;
  name: string;
  role_id: number;
  role: string;
  is_active: boolean;
}

export interface AdminPanelUserDetail extends AdminPanelUser {
  permissions: string[];
  /** Extra permissions granted on top of role (editable in admin) */
  permission_overrides?: string[];
}

export interface Role {
  id: number;
  name: string;
}

export interface CreateAdminUserPayload {
  email: string;
  password: string;
  name?: string;
  role_id: number;
  permission_overrides?: string[];
}

export interface UpdateAdminUserPayload {
  name?: string;
  role_id?: number;
  is_active?: boolean;
  password?: string;
  permission_overrides?: string[];
}

export const adminUsersApi = {
  async getRoles(): Promise<Role[]> {
    const { data } = await api.get<Role[]>(adminUsersApiPaths.roles);
    return data;
  },

  /** POST /auth/admin/role — create a custom role (name). */
  async createRole(name: string): Promise<Role> {
    const { data } = await api.post<Role>(adminUsersApiPaths.createRole, { name });
    return data;
  },

  async list(): Promise<AdminPanelUser[]> {
    const { data } = await api.get<AdminPanelUser[]>(adminUsersApiPaths.users);
    return data;
  },

  async getOne(id: number): Promise<AdminPanelUserDetail> {
    const { data } = await api.get<AdminPanelUserDetail>(adminUsersApiPaths.user(id));
    return data;
  },

  async create(payload: CreateAdminUserPayload): Promise<AdminPanelUserDetail> {
    const { data } = await api.post<AdminPanelUserDetail>(adminUsersApiPaths.users, payload);
    return data;
  },

  async update(id: number, payload: UpdateAdminUserPayload): Promise<AdminPanelUserDetail> {
    const { data } = await api.patch<AdminPanelUserDetail>(adminUsersApiPaths.user(id), payload);
    return data;
  },

  async delete(id: number): Promise<void> {
    await api.delete(adminUsersApiPaths.user(id));
  },
};
