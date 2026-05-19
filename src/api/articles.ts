/**
 * Articles API (admin platform)
 * CRUD + taxonomy options for articles.
 */

import { createCrudApi } from "./apiFactory";
import { api } from "./axios";
import type { DataTableFetchParams, DataTableFetchResult } from "../components/tables/data-table";

/** Resolved "Also Read" article from [related id="..."] shortcodes in legacy content */
export interface RelatedArticle {
  id: number;
  title: string;
  slug: string;
}

export interface ArticleRecord {
  id: number;
  title: string;
  slug: string | null;
  excerpt: string | null;
  content?: string | null;
  thumbnail_url: string | null;
  author_id: number | null;
  author_name: string | null;
  sub_heading?: string | null;
  status: string;
  /** When status is `scheduled`, BullMQ will publish at this time. */
  scheduled_publish_at?: string | null;
  /** Public site: `premium` uses member-gated full body on cafestudy-fe. */
  blog_access_tier?: "free" | "premium";
  published_at: string | null;
  meta_title: string | null;
  meta_description: string | null;
  meta_keywords?: string | null;
  canonical_url?: string | null;
  robots?: string | null;
  og_title?: string | null;
  og_description?: string | null;
  og_image_url?: string | null;
  thumbnail_alt?: string | null;
  thumbnail_link_url?: string | null;
  thumbnail_caption?: string | null;
  created_at?: string;
  updated_at?: string;
  category_ids?: number[];
  tag_ids?: number[];
  /** Tags with id + name (use for display; tag_ids for form submit) */
  tags?: { id: number; name: string }[];
  article_type_ids?: number[];
  court_ids?: number[];
  /** Resolved from [related id="..."] in content (legacy shortcodes) */
  related_articles?: RelatedArticle[];
  /** Downloadable PDF / judgment URL stored as rel_download_url on the backend. */
  rel_download_url?: string | null;
  /** JSON payload for Case Citation metadata */
  citation?: Record<string, any> | null;
}

export interface ArticleListParams {
  status?: string;
  category_id?: string;
  blog_access_tier?: string;
  date_from?: string;
  date_to?: string;
  limit?: number;
  offset?: number;
  page?: number;
  search?: string;
  sortBy?: string;
  sortOrder?: "ASC" | "DESC";
}

export interface ArticlesPaginatedResponse {
  data: ArticleRecord[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
  };
}

export type { ListQuery as ListParams } from "./apiFactory";
export type { PaginatedResponse } from "./apiFactory";

const BASE_URL = "/admin/platform/articles";

export const articlesApi = createCrudApi<ArticleRecord>(BASE_URL)();

/** Server-side paginated list for DataTable */
export async function fetchArticlesPaginated(
  params: DataTableFetchParams & {
    status?: string;
    category_id?: string;
    blog_access_tier?: string;
    date_from?: string;
    date_to?: string;
  }
): Promise<DataTableFetchResult<ArticleRecord>> {
  const { data } = await api.get<any>(BASE_URL, {
    params: {
      page: params.page,
      limit: params.limit,
      search: params.search || undefined,
      sortBy: params.sortBy || undefined,
      sortOrder: params.sortOrder,
      ...(params.status ? { status: params.status } : {}),
      ...(params.category_id ? { category_id: params.category_id } : {}),
      ...(params.blog_access_tier ? { blog_access_tier: params.blog_access_tier } : {}),
      ...(params.date_from ? { date_from: params.date_from } : {}),
      ...(params.date_to ? { date_to: params.date_to } : {}),
    },
  });

  const list = Array.isArray(data) ? data : (data?.data ?? []);

  return {
    data: list,
    meta: {
      total: data?.total ?? list.length,
      page: data?.page ?? 1,
      limit: data?.limit ?? 10,
      totalPages: data?.totalPages ?? 1,
      hasNextPage: data?.hasNextPage ?? false,
      hasPreviousPage: data?.hasPreviousPage ?? false,
    },
  };
}

/** Legacy: fetch list (no pagination meta). Prefer fetchArticlesPaginated for DataTable. */
export async function fetchArticles(params: ArticleListParams = {}) {
  const res = await fetchArticlesPaginated({
    page: params.page ?? 1,
    limit: params.limit ?? 200,
    search: params.search ?? "",
    sortBy: params.sortBy ?? "created_at",
    sortOrder: params.sortOrder ?? "DESC",
  });
  return res.data;
}

export interface ArticlesExportParams {
  status?: string;
  category_id?: string;
  blog_access_tier?: string;
  date_from?: string;
  date_to?: string;
  search?: string;
  sortBy?: string;
  sortOrder?: "ASC" | "DESC";
}

/** Fetch all matching articles for export (walks all pages). */
export async function fetchAllArticlesForExport(
  params: ArticlesExportParams = {}
): Promise<ArticleRecord[]> {
  const PAGE_SIZE = 100;
  const all: ArticleRecord[] = [];
  let page = 1;
  let total: number | undefined;

  for (;;) {
    const result = await fetchArticlesPaginated({
      page,
      limit: PAGE_SIZE,
      search: params.search ?? "",
      sortBy: params.sortBy ?? "created_at",
      sortOrder: params.sortOrder ?? "DESC",
      ...(params.status ? { status: params.status } : {}),
      ...(params.category_id ? { category_id: params.category_id } : {}),
      ...(params.blog_access_tier ? { blog_access_tier: params.blog_access_tier } : {}),
      ...(params.date_from ? { date_from: params.date_from } : {}),
      ...(params.date_to ? { date_to: params.date_to } : {}),
    });

    const chunk = result.data ?? [];
    if (chunk.length === 0) break;
    if (total === undefined) total = result.meta.total;
    all.push(...chunk);
    if (chunk.length < PAGE_SIZE) break;
    if (total != null && all.length >= total) break;
    page += 1;
  }

  return all;
}

// Taxonomy option shape
export interface TaxonomyOption {
  id: number;
  name: string;
  slug: string | null;
}

const TAX_BASE = "/admin/platform";

export async function fetchArticleCategories(): Promise<TaxonomyOption[]> {
  const { data } = await api.get<TaxonomyOption[] | { data: TaxonomyOption[] }>(`${TAX_BASE}/article-categories`);
  return Array.isArray(data) ? data : (data as { data: TaxonomyOption[] })?.data ?? [];
}

export async function fetchTags(): Promise<TaxonomyOption[]> {
  const { data } = await api.get<TaxonomyOption[] | { data: TaxonomyOption[] }>(`${TAX_BASE}/tags`);
  return Array.isArray(data) ? data : (data as { data: TaxonomyOption[] })?.data ?? [];
}

export async function fetchArticleTypes(): Promise<TaxonomyOption[]> {
  const { data } = await api.get<TaxonomyOption[] | { data: TaxonomyOption[] }>(`${TAX_BASE}/article-types`);
  return Array.isArray(data) ? data : (data as { data: TaxonomyOption[] })?.data ?? [];
}

export async function fetchCourts(): Promise<TaxonomyOption[]> {
  const { data } = await api.get<TaxonomyOption[] | { data: TaxonomyOption[] }>(`${TAX_BASE}/courts`);
  return Array.isArray(data) ? data : (data as { data: TaxonomyOption[] })?.data ?? [];
}
