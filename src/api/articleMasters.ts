/**
 * Article taxonomy masters — tags, article types, courts.
 */

import { createCrudApi } from "./apiFactory";
import { api } from "./axios";
import { withClientPagination } from "../utils/dataTableUtils";

export interface MasterTermRecord {
  id: number;
  name: string;
  slug: string | null;
  wp_term_id?: number | null;
}

export type MasterKind = "tags" | "article-types" | "courts";

export interface MasterKindConfig {
  kind: MasterKind;
  label: string;
  labelSingular: string;
  apiBase: string;
  listPath: string;
}

export const MASTER_KINDS: MasterKindConfig[] = [
  {
    kind: "tags",
    label: "Tags",
    labelSingular: "Tag",
    apiBase: "/admin/platform/tags",
    listPath: "/article-masters/tags",
  },
  {
    kind: "article-types",
    label: "Article Types",
    labelSingular: "Article Type",
    apiBase: "/admin/platform/article-types",
    listPath: "/article-masters/article-types",
  },
  {
    kind: "courts",
    label: "Courts",
    labelSingular: "Court",
    apiBase: "/admin/platform/courts",
    listPath: "/article-masters/courts",
  },
];

export function getMasterKindConfig(kind: string | undefined): MasterKindConfig | undefined {
  return MASTER_KINDS.find((c) => c.kind === kind);
}

const tagsApi = createCrudApi<MasterTermRecord>("/admin/platform/tags")();
const articleTypesApi = createCrudApi<MasterTermRecord>("/admin/platform/article-types")();
const courtsApi = createCrudApi<MasterTermRecord>("/admin/platform/courts")();

export function getMasterApi(kind: MasterKind) {
  switch (kind) {
    case "tags":
      return tagsApi;
    case "article-types":
      return articleTypesApi;
    case "courts":
      return courtsApi;
    default:
      return tagsApi;
  }
}

async function fetchAllMasterTerms(kind: MasterKind): Promise<MasterTermRecord[]> {
  const config = getMasterKindConfig(kind);
  if (!config) return [];
  const { data } = await api.get<MasterTermRecord[] | { data: MasterTermRecord[] }>(config.apiBase);
  return Array.isArray(data) ? data : (data as { data: MasterTermRecord[] })?.data ?? [];
}

export function createMasterFetchPaginated(kind: MasterKind) {
  return withClientPagination<MasterTermRecord>(
    () => fetchAllMasterTerms(kind),
    ["name", "slug"],
  );
}
