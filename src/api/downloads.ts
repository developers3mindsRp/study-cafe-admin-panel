/**
 * Downloads Service API — Admin panel
 *
 * All list functions are server-side paginated: the DataTable passes
 * { page, limit, search, sortBy, sortOrder } and we forward them straight
 * to /api/internal/downloads/* so the DB does the work per page.
 */

import { api } from "./axios";
import type { DataTableFetchParams, DataTableFetchResult } from "../components/tables/data-table/DataTable.types";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface DownloadCategory {
  id: number;
  name: string;
  slug: string | null;
  wp_term_id?: number | null;
  file_count?: number;
}

export interface DownloadFile {
  id: number;
  title: string;
  slug: string | null;
  file_url: string;
  author_id?: number | null;
  views: number;
  status: "publish" | "draft" | "private";
  meta_title?: string | null;
  meta_description?: string | null;
  meta_keywords?: string | null;
  created_at: string;
  FileCats?: DownloadCategory[];
}

export interface CreateFilePayload {
  title: string;
  slug?: string;
  file_url: string;
  author_id?: number | null;
  category_ids?: number[];
  status?: "publish" | "draft" | "private";
  meta_title?: string;
  meta_description?: string;
  meta_keywords?: string;
}

export interface CreateCategoryPayload {
  name: string;
  slug?: string;
  wp_term_id?: number | null;
}

// ─── Response shape helpers ───────────────────────────────────────────────────

/**
 * The axios interceptor already unwraps { success, data, ...meta } to
 * { data: [...], total, page, limit, totalPages, ... }.
 * We just need to re-shape it for DataTableFetchResult.
 */
function toFetchResult<T>(raw: unknown): DataTableFetchResult<T> {
  const r = raw as Record<string, unknown>;
  const rows = Array.isArray(r?.data) ? (r.data as T[]) : [];
  return {
    data: rows,
    meta: {
      total: Number(r?.total) || rows.length,
      page: Number(r?.page) || 1,
      limit: Number(r?.limit) || rows.length,
      totalPages: Number(r?.totalPages) || 1,
      hasNextPage: Boolean(r?.hasNextPage),
      hasPreviousPage: Boolean(r?.hasPreviousPage),
    },
  };
}

// ─── Categories API ───────────────────────────────────────────────────────────

const CATEGORIES_BASE = "/internal/downloads/categories";

export const downloadCategoriesApi = {
  async create(payload: CreateCategoryPayload): Promise<DownloadCategory> {
    const { data } = await api.post<DownloadCategory>(CATEGORIES_BASE, payload);
    return data;
  },

  async update(id: number, payload: Partial<CreateCategoryPayload>): Promise<DownloadCategory> {
    const { data } = await api.put<DownloadCategory>(`${CATEGORIES_BASE}/${id}`, payload);
    return data;
  },

  async delete(id: number): Promise<void> {
    await api.delete(`${CATEGORIES_BASE}/${id}`);
  },

  /** Fetch all categories (unpaginated) for dropdowns / form selects */
  async listAll(): Promise<DownloadCategory[]> {
    const { data } = await api.get<unknown>(CATEGORIES_BASE, {
      params: { limit: 100, page: 1 },
    });
    const result = toFetchResult<DownloadCategory>(data);
    return result.data;
  },
};

/**
 * Server-side paginated fetch for the admin DataTable.
 * Called per page — no full load.
 */
export async function fetchCategoriesPaginated(
  params: DataTableFetchParams
): Promise<DataTableFetchResult<DownloadCategory>> {
  const { data } = await api.get<unknown>(CATEGORIES_BASE, {
    params: {
      page: params.page,
      limit: params.limit,
      search: params.search || undefined,
      sortBy: params.sortBy || undefined,
      sortOrder: params.sortOrder || undefined,
    },
  });
  return toFetchResult<DownloadCategory>(data);
}

// ─── Files API ────────────────────────────────────────────────────────────────

const FILES_BASE = "/internal/downloads/files";

export const downloadFilesApi = {
  async create(payload: CreateFilePayload): Promise<DownloadFile> {
    const { data } = await api.post<DownloadFile>(FILES_BASE, payload);
    return data;
  },

  async update(id: number, payload: Partial<CreateFilePayload>): Promise<DownloadFile> {
    const { data } = await api.put<DownloadFile>(`${FILES_BASE}/${id}`, payload);
    return data;
  },

  async delete(id: number): Promise<void> {
    await api.delete(`${FILES_BASE}/${id}`);
  },
};

/**
 * Server-side paginated fetch for the admin DataTable.
 * Called per page — no full load.
 */
export async function fetchFilesPaginated(
  params: DataTableFetchParams & { status?: string; category_id?: string }
): Promise<DataTableFetchResult<DownloadFile>> {
  const { data } = await api.get<unknown>(FILES_BASE, {
    params: {
      page: params.page,
      limit: params.limit,
      search: params.search || undefined,
      sortBy: params.sortBy || undefined,
      sortOrder: params.sortOrder || undefined,
      ...(params.status ? { status: params.status } : {}),
      ...(params.category_id ? { category_id: params.category_id } : {}),
    },
  });
  return toFetchResult<DownloadFile>(data);
}
