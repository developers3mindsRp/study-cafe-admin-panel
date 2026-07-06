import { api } from "./axios";
import type { DataTableFetchParams, DataTableFetchResult } from "../components/tables/data-table";
import type { ListQuery } from "./apiFactory";
import { requireAuthForExport } from "../lib/exportAuth";
import { fetchCourse, fetchCourses } from "./courses";
import { usersApi } from "./users";
import type { SelectOption } from "../components/filters";

export interface AffiliateRecord {
  id: number;
  user_id: number;
  buyer_name: string;
  affiliate_id: number;
  affiliate_name: string;
  affiliate_email?: string;
  course_id: number;
  course_title: string;
  order_id?: string | null;
  order_amount?: number | string | null;
  commission_amount: number | string;
  status?: string;
  created_at: string;
}

export interface AffiliateBankDetails {
  account_holder_name?: string | null;
  account_number?: string | null;
  ifsc?: string | null;
  bank_name?: string | null;
  branch?: string | null;
  updated_at?: string | null;
}

export interface WithdrawalRequest {
  id: number;
  affiliate_id: number;
  affiliate_name: string;
  affiliate_email: string;
  amount: number | string;
  status: "pending" | "approved" | "rejected";
  remarks?: string;
  created_at: string;
  updated_at?: string;
  bank_details?: AffiliateBankDetails | null;
}

export interface AffiliateBalance {
  affiliate_id: number;
  total_earned: number | string;
  total_withdrawn: number | string;
  current_balance: number | string;
}

export type AffiliateHistoryFilters = {
  date_from: string;
  date_to: string;
  affiliate_id: string;
  course_id: string;
  commission_min: string;
  commission_max: string;
};

export function emptyAffiliateHistoryFilters(): AffiliateHistoryFilters {
  return {
    date_from: "",
    date_to: "",
    affiliate_id: "",
    course_id: "",
    commission_min: "",
    commission_max: "",
  };
}

export function affiliateHistoryFiltersFromValues(
  values: Record<string, string | undefined>,
): AffiliateHistoryFilters {
  return {
    date_from: values.date_from ?? "",
    date_to: values.date_to ?? "",
    affiliate_id: values.affiliate_id ?? "",
    course_id: values.course_id ?? "",
    commission_min: values.commission_min ?? "",
    commission_max: values.commission_max ?? "",
  };
}

export function affiliateHistoryFiltersAreActive(filters: AffiliateHistoryFilters): boolean {
  return Boolean(
    filters.date_from ||
      filters.date_to ||
      filters.affiliate_id ||
      filters.course_id ||
      filters.commission_min ||
      filters.commission_max,
  );
}

export function buildAffiliateHistoryParams(
  params: DataTableFetchParams & { filters?: AffiliateHistoryFilters },
): ListQuery {
  const { page, limit, search, sortBy, sortOrder, filters } = params;
  const query: ListQuery = { page, limit };
  if (search?.trim()) query.search = search.trim();
  if (sortBy) query.sortBy = sortBy;
  if (sortOrder) query.sortOrder = sortOrder;
  if (!filters) return query;

  if (filters.date_from) query.date_from = filters.date_from;
  if (filters.date_to) query.date_to = filters.date_to;
  if (filters.affiliate_id) query.affiliate_id = filters.affiliate_id;
  if (filters.course_id) query.course_id = filters.course_id;
  if (filters.commission_min) query.commission_min = filters.commission_min;
  if (filters.commission_max) query.commission_max = filters.commission_max;
  return query;
}

export type WithdrawalListFilters = {
  date_from: string;
  date_to: string;
  affiliate_id: string;
  status: string;
  amount_min: string;
  amount_max: string;
};

export function emptyWithdrawalListFilters(): WithdrawalListFilters {
  return {
    date_from: "",
    date_to: "",
    affiliate_id: "",
    status: "",
    amount_min: "",
    amount_max: "",
  };
}

export function withdrawalListFiltersFromValues(
  values: Record<string, string | undefined>,
): WithdrawalListFilters {
  return {
    date_from: values.date_from ?? "",
    date_to: values.date_to ?? "",
    affiliate_id: values.affiliate_id ?? "",
    status: values.status ?? "",
    amount_min: values.amount_min ?? "",
    amount_max: values.amount_max ?? "",
  };
}

export function withdrawalListFiltersAreActive(filters: WithdrawalListFilters): boolean {
  return Boolean(
    filters.date_from ||
      filters.date_to ||
      filters.affiliate_id ||
      filters.status ||
      filters.amount_min ||
      filters.amount_max,
  );
}

export function buildWithdrawalListParams(
  params: DataTableFetchParams & { filters?: WithdrawalListFilters },
): ListQuery {
  const { page, limit, search, sortBy, sortOrder, filters } = params;
  const query: ListQuery = { page, limit };
  if (search?.trim()) query.search = search.trim();
  if (sortBy) query.sortBy = sortBy;
  if (sortOrder) query.sortOrder = sortOrder;
  if (!filters) return query;

  if (filters.date_from) query.date_from = filters.date_from;
  if (filters.date_to) query.date_to = filters.date_to;
  if (filters.affiliate_id) query.affiliate_id = filters.affiliate_id;
  if (filters.status) query.status = filters.status;
  if (filters.amount_min) query.amount_min = filters.amount_min;
  if (filters.amount_max) query.amount_max = filters.amount_max;
  return query;
}

export async function fetchAffiliateHistoryPaginated(
  params: DataTableFetchParams & { filters?: AffiliateHistoryFilters },
): Promise<DataTableFetchResult<AffiliateRecord>> {
  const query = buildAffiliateHistoryParams(params);
  const { data } = await api.get<AffiliateRecord[] | { data: AffiliateRecord[]; total?: number; page?: number; limit?: number; pages?: number }>(
    "/admin/affiliate/history",
    { params: query },
  );

  const list = Array.isArray(data) ? data : Array.isArray(data?.data) ? data.data : [];
  const total = typeof (data as { total?: number })?.total === "number" ? (data as { total: number }).total : list.length;
  const page = typeof (data as { page?: number })?.page === "number" ? (data as { page: number }).page : params.page;
  const limit = typeof (data as { limit?: number })?.limit === "number" ? (data as { limit: number }).limit : params.limit;
  const pages =
    typeof (data as { pages?: number })?.pages === "number"
      ? (data as { pages: number }).pages
      : Math.max(1, Math.ceil(total / limit) || 1);
  return {
    data: list,
    meta: {
      total,
      page,
      limit,
      totalPages: pages,
      hasNextPage: page < pages,
      hasPreviousPage: page > 1,
    },
  };
}

/** @deprecated Use fetchAffiliateHistoryPaginated */
export async function fetchAffiliateHistory(): Promise<AffiliateRecord[]> {
  const res = await fetchAffiliateHistoryPaginated({
    page: 1,
    limit: 10000,
    search: "",
    sortBy: "created_at",
    sortOrder: "DESC",
    filters: emptyAffiliateHistoryFilters(),
  });
  return res.data;
}

export async function downloadAffiliateHistoryExportCsv(
  params: Omit<DataTableFetchParams, "page" | "limit"> & { filters?: AffiliateHistoryFilters },
  filename?: string,
): Promise<void> {
  await requireAuthForExport();
  const query = buildAffiliateHistoryParams({
    ...params,
    page: 1,
    limit: 1,
    search: params.search ?? "",
    sortBy: params.sortBy ?? "created_at",
    sortOrder: params.sortOrder ?? "DESC",
  });
  const response = await api.get<Blob>("/admin/affiliate/history/export.csv", {
    params: query,
    responseType: "blob",
  });
  const blob = response.data;
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  const datePart = new Date().toISOString().slice(0, 10);
  anchor.download = filename?.toLowerCase().endsWith(".csv")
    ? filename
    : `${filename ?? `affiliate-history-export-${datePart}`}.csv`;
  anchor.click();
  URL.revokeObjectURL(url);
}

function formatAffiliateUserOption(u: { id: string | number; name?: string; email?: string }): SelectOption {
  const name = u.name || u.email || `User #${u.id}`;
  const emailPart = u.email && u.name ? ` (${u.email})` : "";
  return {
    value: String(u.id),
    label: `${name}${emailPart} (#${u.id})`,
  };
}

export async function searchAffiliateUserFilterOptions(search: string): Promise<SelectOption[]> {
  const q = search.trim();
  if (q.length < 2) return [];
  const res = await usersApi.list({ search: q, limit: 20, sortBy: "name", sortOrder: "ASC" });
  return (res.data ?? []).map(formatAffiliateUserOption);
}

export async function resolveAffiliateUserFilterOption(value: string): Promise<SelectOption | null> {
  if (!value) return null;
  try {
    const user = await usersApi.get(value);
    return formatAffiliateUserOption(user);
  } catch {
    return null;
  }
}

let affiliateCourseFilterCache: Awaited<ReturnType<typeof fetchCourses>> | null = null;

async function getAffiliateCourseFilterCache() {
  if (!affiliateCourseFilterCache) {
    affiliateCourseFilterCache = await fetchCourses();
  }
  return affiliateCourseFilterCache;
}

export async function searchAffiliateCourseFilterOptions(search: string): Promise<SelectOption[]> {
  const courses = await getAffiliateCourseFilterCache();
  const q = search.trim().toLowerCase();
  const filtered = q
    ? courses.filter((c) => {
        const title = (c.title || c.short_title || "").toLowerCase();
        return title.includes(q) || String(c.id).includes(q);
      })
    : courses;
  return filtered.slice(0, 50).map((c) => ({
    value: String(c.id),
    label: c.title || c.short_title || `Course #${c.id}`,
  }));
}

export async function resolveAffiliateCourseFilterOption(value: string): Promise<SelectOption | null> {
  if (!value) return null;
  const cached = affiliateCourseFilterCache?.find((c) => String(c.id) === value);
  if (cached) {
    return {
      value: String(cached.id),
      label: cached.title || cached.short_title || `Course #${cached.id}`,
    };
  }
  const course = await fetchCourse(value);
  if (!course) return null;
  return {
    value: String(course.id),
    label: course.title || course.short_title || `Course #${course.id}`,
  };
}

export async function fetchWithdrawalRequestsPaginated(
  params: DataTableFetchParams & { filters?: WithdrawalListFilters },
): Promise<DataTableFetchResult<WithdrawalRequest>> {
  const query = buildWithdrawalListParams(params);
  const { data } = await api.get<
    WithdrawalRequest[] | { data: WithdrawalRequest[]; total?: number; page?: number; limit?: number; pages?: number }
  >("/admin/affiliate/withdrawals", { params: query });

  const list = Array.isArray(data) ? data : Array.isArray(data?.data) ? data.data : [];
  const total = typeof (data as { total?: number })?.total === "number" ? (data as { total: number }).total : list.length;
  const page = typeof (data as { page?: number })?.page === "number" ? (data as { page: number }).page : params.page;
  const limit = typeof (data as { limit?: number })?.limit === "number" ? (data as { limit: number }).limit : params.limit;
  const pages =
    typeof (data as { pages?: number })?.pages === "number"
      ? (data as { pages: number }).pages
      : Math.max(1, Math.ceil(total / limit) || 1);
  return {
    data: list,
    meta: {
      total,
      page,
      limit,
      totalPages: pages,
      hasNextPage: page < pages,
      hasPreviousPage: page > 1,
    },
  };
}

/** @deprecated Use fetchWithdrawalRequestsPaginated */
export async function fetchWithdrawalRequests(): Promise<WithdrawalRequest[]> {
  const res = await fetchWithdrawalRequestsPaginated({
    page: 1,
    limit: 10000,
    search: "",
    sortBy: "created_at",
    sortOrder: "DESC",
    filters: emptyWithdrawalListFilters(),
  });
  return res.data;
}

export async function downloadWithdrawalExportCsv(
  params: Omit<DataTableFetchParams, "page" | "limit"> & { filters?: WithdrawalListFilters },
  filename?: string,
): Promise<void> {
  await requireAuthForExport();
  const query = buildWithdrawalListParams({
    ...params,
    page: 1,
    limit: 1,
    search: params.search ?? "",
    sortBy: params.sortBy ?? "created_at",
    sortOrder: params.sortOrder ?? "DESC",
  });
  const response = await api.get<Blob>("/admin/affiliate/withdrawals/export.csv", {
    params: query,
    responseType: "blob",
  });
  const blob = response.data;
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  const datePart = new Date().toISOString().slice(0, 10);
  anchor.download = filename?.toLowerCase().endsWith(".csv")
    ? filename
    : `${filename ?? `affiliate-withdrawals-export-${datePart}`}.csv`;
  anchor.click();
  URL.revokeObjectURL(url);
}

export async function createWithdrawalRequest(data: { affiliate_id: number; amount: number }): Promise<WithdrawalRequest> {
  const res = await api.post<WithdrawalRequest>("/admin/affiliate/withdrawals", data);
  return res.data;
}

export async function updateWithdrawalStatus(id: number, status: "approved" | "rejected", remarks?: string): Promise<WithdrawalRequest> {
  const res = await api.patch<WithdrawalRequest>(`/admin/affiliate/withdrawals/${id}`, { status, remarks });
  return res.data;
}

export async function fetchUserEarnings(userId: number): Promise<AffiliateBalance> {
  const res = await api.get<AffiliateBalance>(`/admin/affiliate/balance/${userId}`);
  return res.data;
}
