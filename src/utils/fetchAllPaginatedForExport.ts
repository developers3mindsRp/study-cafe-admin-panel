const DEFAULT_PAGE_SIZE = 500;

/**
 * Fetches all pages from a page/limit API (used by orders export, users export, etc.).
 */
export async function fetchAllPaginatedForExport<T>(options: {
  fetchPage: (page: number, limit: number) => Promise<{ data: T[]; total: number }>;
  pageSize?: number;
}): Promise<T[]> {
  const pageSize = options.pageSize ?? DEFAULT_PAGE_SIZE;
  const all: T[] = [];
  let page = 1;
  let total: number | undefined;

  for (;;) {
    const { data, total: reportedTotal } = await options.fetchPage(page, pageSize);
    const chunk = data ?? [];
    if (chunk.length === 0) break;
    if (total === undefined) total = reportedTotal;
    all.push(...chunk);
    if (chunk.length < pageSize) break;
    if (total != null && all.length >= total) break;
    page += 1;
  }

  return all;
}
