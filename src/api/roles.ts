import { api } from "./axios";

export interface RoleRecord {
  id: number;
  name: string;
  description: string;
  permissions: string[];
  is_system: boolean;
  is_admin_panel: boolean;
  user_count?: number;
}

export interface CreateRolePayload {
  name: string;
  description?: string;
  permissions: string[];
  is_admin_panel?: boolean;
}

export interface UpdateRolePayload {
  name?: string;
  description?: string;
  permissions?: string[];
  is_admin_panel?: boolean;
}

export const rolesApi = {
  async list(adminPanelOnly = false): Promise<RoleRecord[]> {
    const { data } = await api.get<RoleRecord[]>("/auth/admin/roles", {
      params: adminPanelOnly ? { admin_panel: "1" } : undefined,
    });
    return Array.isArray(data) ? data : [];
  },

  async getOne(id: number): Promise<RoleRecord> {
    const { data } = await api.get<RoleRecord>(`/auth/admin/roles/${id}`);
    return data;
  },

  async create(payload: CreateRolePayload): Promise<RoleRecord> {
    const { data } = await api.post<RoleRecord>("/auth/admin/roles", payload);
    return data;
  },

  async update(id: number, payload: UpdateRolePayload): Promise<RoleRecord> {
    const { data } = await api.patch<RoleRecord>(`/auth/admin/roles/${id}`, payload);
    return data;
  },

  async delete(id: number): Promise<void> {
    await api.delete(`/auth/admin/roles/${id}`);
  },
};
