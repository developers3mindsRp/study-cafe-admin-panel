/**
 * Blog Categories API (admin platform)
 * CRUD for article categories used to filter blog posts.
 */

import { createCrudApi } from "./apiFactory";
import { api } from "./axios";
import { withClientPagination } from "../utils/dataTableUtils";

export interface CategoryRecord {
    id: number;
    name: string;
    slug: string | null;
    parent_id: number | null;
    wp_term_id?: number | null;
}

const BASE_URL = "/admin/platform/article-categories";

export const categoriesApi = createCrudApi<CategoryRecord>(BASE_URL);

/** Fetch all categories (unpaginated) for client-side DataTable */
export async function fetchAllCategories(): Promise<CategoryRecord[]> {
    const { data } = await api.get<CategoryRecord[] | { data: CategoryRecord[] }>(BASE_URL);
    return Array.isArray(data) ? data : (data as { data: CategoryRecord[] })?.data ?? [];
}

/** Client-side paginated provider for DataTable */
export const fetchCategoriesPaginated = withClientPagination<CategoryRecord>(
    fetchAllCategories,
    ["name", "slug"]
);
