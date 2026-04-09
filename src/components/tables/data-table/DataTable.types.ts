/**
 * DataTable — production-grade reusable types.
 * Server-side pagination, sorting, and search.
 */

export interface DataTableMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

export interface DataTableFetchParams {
  page: number;
  limit: number;
  search: string;
  sortBy: string;
  sortOrder: "ASC" | "DESC";
}

export interface DataTableFetchResult<T> {
  data: T[];
  meta: DataTableMeta;
}

export type DataTableFetchFn<T> = (
  params: DataTableFetchParams
) => Promise<DataTableFetchResult<T>>;

export interface DataTableColumn<T = Record<string, unknown>> {
  key: string;
  header: string;
  sortable?: boolean;
  /** Custom cell render. Receives row data. */
  render?: (row: T) => React.ReactNode;
  /** Header alignment */
  align?: "start" | "center" | "end";
  /** Column width class (e.g. "w-1/4") */
  className?: string;
}

export interface DataTableProps<T = Record<string, unknown>> {
  /** Column definitions */
  columns: DataTableColumn<T>[];
  /** Server-side fetch. Called with page, limit, search, sortBy, sortOrder. */
  fetchData: DataTableFetchFn<T>;
  /** Initial page size */
  initialPageSize?: number;
  /** Initial sort field */
  initialSortBy?: string;
  /** Initial sort direction */
  initialSortOrder?: "ASC" | "DESC";
  /** Page size options for selector */
  pageSizeOptions?: number[];
  /** Enable search input */
  enableSearch?: boolean;
  /** Enable column sorting */
  enableSorting?: boolean;
  /** Enable pagination controls */
  enablePagination?: boolean;
  /** Search input placeholder */
  searchPlaceholder?: string;
  /** Optional table className */
  className?: string;
  /** Optional empty state message */
  emptyMessage?: string;
}

export interface UseDataTableState<T> {
  data: T[];
  meta: DataTableMeta | null;
  loading: boolean;
  error: Error | null;
  page: number;
  limit: number;
  search: string;
  sortBy: string;
  sortOrder: "ASC" | "DESC";
}

export interface UseDataTableReturn<T> extends UseDataTableState<T> {
  setPage: (page: number) => void;
  setLimit: (limit: number) => void;
  setSearch: (search: string) => void;
  setSort: (sortBy: string, sortOrder: "ASC" | "DESC") => void;
  refetch: () => Promise<void>;
}
