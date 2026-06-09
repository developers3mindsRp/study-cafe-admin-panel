/**
 * API Factory — Generic CRUD client builder.
 * 
 * Generates type-safe list/get/create/update/delete methods for any resource.
 * Extend with custom methods by spreading:
 * 
 * Usage:
 *   const usersApi = createCrudApi<User>('/users', {
 *     customMethod: async () => { ... }
 *   });
 */

import { api } from "./axios";

export interface PaginatedResponse<T> {
    data: T[];
    total: number;
    page: number;
    limit: number;
    pages: number;
}

export interface ListQuery {
    page?: number;
    limit?: number;
    search?: string;
    sortBy?: string;
    sortOrder?: "ASC" | "DESC";
    [key: string]: unknown;
}

export function createCrudApi<T extends { id: string | number }>(basePath: string) {
    return function withExtensions<E = object>(extensions?: E) {
        const methods = {
            async list(params: ListQuery = {}): Promise<PaginatedResponse<T>> {
                const { data } = await api.get<PaginatedResponse<T> | T[]>(basePath, { params });

                // Following the axios interceptor change, paginated responses are flattened to: { data: T[], total, page, ... }
                const list = Array.isArray(data) ? data : (Array.isArray((data as any)?.data) ? (data as any).data : []);

                const total = typeof (data as any)?.total === 'number' ? (data as any).total : list.length;
                const page = typeof (data as any)?.page === 'number' ? (data as any).page : 1;
                const limit = typeof (data as any)?.limit === 'number' ? (data as any).limit : (total || 10);
                const pages = typeof (data as any)?.pages === 'number' ? (data as any).pages : (total ? Math.ceil(total / limit) || 1 : 0);

                return { data: list, total, page, limit, pages };
            },

            async get(id: string | number): Promise<T> {
                const { data } = await api.get<T>(`${basePath}/${id}`);
                return data;
            },

            async create(payload: Partial<T>): Promise<T> {
                const { data } = await api.post<T>(basePath, payload);
                return data;
            },

            async update(id: string | number, payload: Partial<T>): Promise<T> {
                const { data } = await api.put<T>(`${basePath}/${id}`, payload);
                return data;
            },

            async delete(id: string | number): Promise<void> {
                await api.delete(`${basePath}/${id}`);
            },

            async restore(id: string | number): Promise<void> {
                await api.post(`${basePath}/${id}/restore`);
            },

            // Spread any custom extensions
            ...extensions,
        };
        return methods as typeof methods & E;
    };
}
