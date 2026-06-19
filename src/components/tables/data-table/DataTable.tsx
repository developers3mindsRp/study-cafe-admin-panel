/**
 * DataTable — production-grade reusable table with server-side pagination, sorting, and search.
 * All pagination is server-driven; no client-side pagination.
 */

import { forwardRef, useImperativeHandle, useMemo } from "react";
import { Table, TableBody, TableCell, TableHeader, TableRow } from "../../ui/table";
import { useDataTable } from "./useDataTable";
import { DataTablePagination } from "./DataTablePagination";
import { DataTableToolbar } from "./DataTableToolbar";
import type { DataTableProps, DataTableColumn } from "./DataTable.types";

export interface DataTableRef {
  refetch: () => Promise<void>;
  /** Programmatically update the search value (e.g. from an external filter bar). Resets to page 1. */
  setSearch: (search: string) => void;
  /** Current toolbar query (search, sort) for exports / server refetch with same view. */
  getQueryState: () => { search: string; sortBy: string; sortOrder: "ASC" | "DESC" };
}

function DataTableInner<T extends object>({
  columns,
  fetchData,
  initialPageSize = 10,
  pageSizeOptions = [10, 20, 50, 100],
  enableSearch = true,
  enableSorting = true,
  enablePagination = true,
  searchPlaceholder = "Search…",
  className = "",
  emptyMessage = "No data.",
  initialSortBy,
  initialSortOrder,
}: DataTableProps<T>, ref: React.Ref<DataTableRef>) {
  const sortableColumnKeys = useMemo(
    () => columns.filter((c) => c.sortable).map((c) => c.key),
    [columns]
  );
  const defaultSortBy = sortableColumnKeys[0] ?? "";
  const defaultSortOrder = "DESC" as const;

  const {
    data,
    meta,
    loading,
    error,
    search,
    sortBy,
    sortOrder,
    setPage,
    setLimit,
    setSearch,
    setSort,
    refetch,
  } = useDataTable<T>(fetchData, {
    initialPageSize,
    initialSortBy: initialSortBy ?? defaultSortBy,
    initialSortOrder: initialSortOrder ?? defaultSortOrder,
  });

  useImperativeHandle(
    ref,
    () => ({
      refetch,
      setSearch,
      getQueryState: () => ({ search, sortBy, sortOrder }),
    }),
    [refetch, setSearch, search, sortBy, sortOrder]
  );

  const handleSort = (key: string) => {
    if (!enableSorting) return;
    const nextOrder =
      sortBy === key && sortOrder === "DESC" ? "ASC" : "DESC";
    setSort(key, nextOrder);
  };

  return (
    <div
      className={`overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-theme-xs dark:border-gray-800 dark:bg-white/[0.03] ${className}`}
    >
      {enableSearch && (
        <DataTableToolbar
          search={search}
          onSearchChange={setSearch}
          placeholder={searchPlaceholder}
          disabled={false}
        />
      )}
      <div className="max-w-full overflow-x-auto">
        <Table className="w-full">
          <TableHeader className="border-b border-gray-100 dark:border-white/[0.05]">
            <TableRow className="hover:bg-transparent">
              {columns.map((col) => (
                <TableCell
                  key={col.key}
                  isHeader
                  className={`whitespace-nowrap px-5 py-3.5 font-medium text-gray-500 text-theme-xs dark:text-gray-400 ${
                    col.align === "end"
                      ? "text-end"
                      : col.align === "center"
                        ? "text-center"
                        : "text-start"
                  } ${col.className ?? ""}`}
                >
                  {enableSorting && col.sortable ? (
                    <button
                      type="button"
                      onClick={() => handleSort(col.key)}
                      className="rounded-md px-1 py-0.5 transition hover:bg-gray-100 hover:text-gray-800 dark:hover:bg-white/10 dark:hover:text-white/90"
                    >
                      {col.header}
                      {sortBy === col.key && (
                        <span className="ml-1 font-semibold">{sortOrder === "ASC" ? " ↑" : " ↓"}</span>
                      )}
                    </button>
                  ) : (
                    col.header
                  )}
                </TableCell>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody className="divide-y divide-gray-100 dark:divide-white/[0.05]">
            {loading ? (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="px-5 py-14 text-center text-gray-500 dark:text-gray-400"
                >
                  <span className="inline-block animate-pulse">Loading…</span>
                </TableCell>
              </TableRow>
            ) : error ? (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="px-5 py-14 text-center text-error-500"
                >
                  {error.message}
                </TableCell>
              </TableRow>
            ) : data.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="px-5 py-14 text-center text-gray-500 dark:text-gray-400"
                >
                  {emptyMessage}
                </TableCell>
              </TableRow>
            ) : (
              data.map((row, idx) => (
                <TableRow
                  key={(row as { id?: number }).id ?? idx}
                  className="transition-colors hover:bg-gray-50 dark:hover:bg-white/[0.04]"
                >
                  {columns.map((col) => (
                    <DataTableCell
                      key={col.key}
                      column={col}
                      row={row}
                      align={col.align}
                      className={col.className}
                    />
                  ))}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
      {enablePagination && meta && (
        <DataTablePagination
          meta={meta}
          pageSizeOptions={pageSizeOptions}
          onPageChange={setPage}
          onPageSizeChange={setLimit}
          disabled={loading}
        />
      )}
    </div>
  );
}

function DataTableCell<T extends object>({
  column,
  row,
  align,
  className,
}: {
  column: DataTableColumn<T>;
  row: T;
  align?: "start" | "center" | "end";
  className?: string;
}) {
  const content = column.render
    ? column.render(row)
    : ((row as Record<string, unknown>)[column.key] as React.ReactNode) ?? "—";
  const alignClass =
    align === "end"
      ? "text-end"
      : align === "center"
        ? "text-center"
        : "text-start";
  return (
    <TableCell
      className={`px-5 py-4 text-theme-sm text-gray-800 dark:text-white/90 ${alignClass} ${className ?? ""}`}
    >
      {content}
    </TableCell>
  );
}

export const DataTable = forwardRef(DataTableInner) as <T extends object>(
  props: DataTableProps<T> & { ref?: React.Ref<DataTableRef> }
) => React.ReactElement;
