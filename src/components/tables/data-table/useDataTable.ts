/**
 * useDataTable — server-side state for DataTable.
 * Fetches when page, limit, search, sortBy, or sortOrder change.
 */

import { useState, useEffect, useCallback, useRef } from "react";
import type {
  DataTableMeta,
  DataTableFetchParams,
  DataTableFetchFn,
  UseDataTableReturn,
} from "./DataTable.types";

const DEFAULT_META: DataTableMeta = {
  total: 0,
  page: 1,
  limit: 10,
  totalPages: 0,
  hasNextPage: false,
  hasPreviousPage: false,
};

export function useDataTable<T = Record<string, unknown>>(
  fetchData: DataTableFetchFn<T>,
  options: {
    initialPageSize?: number;
    initialSortBy?: string;
    initialSortOrder?: "ASC" | "DESC";
  } = {}
): UseDataTableReturn<T> {
  const {
    initialPageSize = 10,
    initialSortBy = "",
    initialSortOrder = "DESC",
  } = options;

  const [data, setData] = useState<T[]>([]);
  const [meta, setMeta] = useState<DataTableMeta | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(initialPageSize);
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState(initialSortBy);
  const [sortOrder, setSortOrder] = useState<"ASC" | "DESC">(initialSortOrder);

  const fetchDataRef = useRef(fetchData);
  useEffect(() => {
    if (fetchDataRef.current !== fetchData) {
      fetchDataRef.current = fetchData;
      setPage(1);
    }
  }, [fetchData]);

  // Guards against out-of-order responses: only the latest request may apply its
  // result. Without this, a slower earlier fetch (e.g. the unfiltered list) can
  // land after a newer search fetch and leave stale rows in the table.
  const requestIdRef = useRef(0);

  const load = useCallback(async () => {
    const requestId = ++requestIdRef.current;
    setLoading(true);
    setError(null);
    try {
      const params: DataTableFetchParams = {
        page,
        limit,
        search,
        sortBy,
        sortOrder,
      };
      const result = await fetchData(params);
      if (requestId !== requestIdRef.current) return;
      setData(result.data ?? []);
      setMeta(result.meta ?? null);
    } catch (err) {
      if (requestId !== requestIdRef.current) return;
      setError(err instanceof Error ? err : new Error(String(err)));
      setData([]);
      setMeta(null);
    } finally {
      if (requestId === requestIdRef.current) setLoading(false);
    }
  }, [fetchData, page, limit, search, sortBy, sortOrder]);

  useEffect(() => {
    load();
  }, [load]);

  const setSort = useCallback((by: string, order: "ASC" | "DESC") => {
    setSortBy(by);
    setSortOrder(order);
    setPage(1);
  }, []);

  const handleSetPage = useCallback((p: number) => {
    setPage(() => Math.max(1, p));
  }, []);

  const handleSetLimit = useCallback((l: number) => {
    setLimit(l);
    setPage(1);
  }, []);

  const handleSetSearch = useCallback((s: string) => {
    setSearch(s);
    setPage(1);
  }, []);

  return {
    data,
    meta: meta ?? DEFAULT_META,
    loading,
    error,
    page,
    limit,
    search,
    sortBy,
    sortOrder,
    setPage: handleSetPage,
    setLimit: handleSetLimit,
    setSearch: handleSetSearch,
    setSort,
    refetch: load,
  };
}
