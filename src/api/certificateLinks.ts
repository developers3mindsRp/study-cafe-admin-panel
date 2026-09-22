import { api } from "./axios";
import { createCrudApi, type ListQuery } from "./apiFactory";
import type { CertificateLink, CertificateLinkClaim } from "../types/certificateLink";

export type { CertificateLink, CertificateLinkClaim } from "../types/certificateLink";

const BASE_URL = "/admin/certificate-links";

export const certificateLinksApi = createCrudApi<CertificateLink>(BASE_URL)();

/**
 * Server-side paginated — unlike payment links, which page in the browser. A link list grows with
 * every campaign and the claims behind it are the real volume, so paging belongs on the server.
 */
export async function fetchCertificateLinksPaginated(params: ListQuery) {
  const res = await certificateLinksApi.list(params);
  return {
    data: res.data,
    meta: {
      total: res.total,
      page: res.page,
      limit: res.limit,
      totalPages: res.pages,
      hasNextPage: res.page < res.pages,
      hasPreviousPage: res.page > 1,
    },
  };
}

export function fetchCertificateLink(id: string | number) {
  return certificateLinksApi.get(id);
}

export function createCertificateLink(payload: Partial<CertificateLink>) {
  return certificateLinksApi.create(payload);
}

export function updateCertificateLink(id: string | number, payload: Partial<CertificateLink>) {
  return certificateLinksApi.update(id, payload);
}

export function deleteCertificateLink(id: string | number) {
  return certificateLinksApi.delete(id);
}

interface ClaimsEnvelope {
  data: CertificateLinkClaim[];
  total?: number;
  page?: number;
  limit?: number;
  totalPages?: number;
}

/**
 * Leads captured by one link. The API allows limit up to 500 so the CSV export can page in
 * larger batches than the usual 100-row cap.
 */
export async function fetchCertificateLinkClaims(
  linkId: string | number,
  params: { page?: number; limit?: number; search?: string } = {},
) {
  const { data } = await api.get<ClaimsEnvelope>(`${BASE_URL}/${linkId}/claims`, { params });
  const rows = Array.isArray(data?.data) ? data.data : [];
  const total = typeof data?.total === "number" ? data.total : rows.length;
  const limit = typeof data?.limit === "number" ? data.limit : rows.length || 25;
  const page = typeof data?.page === "number" ? data.page : 1;
  const totalPages = typeof data?.totalPages === "number" ? data.totalPages : Math.ceil(total / limit) || 0;
  return {
    data: rows,
    meta: {
      total,
      page,
      limit,
      totalPages,
      hasNextPage: page < totalPages,
      hasPreviousPage: page > 1,
    },
  };
}
