/**
 * Users (Students) table using the reusable DataTable with server-side pagination, sort, and search.
 */

import { forwardRef, useCallback, useMemo } from "react";
import { Link } from "react-router";
import { DataTable, type DataTableRef } from "./data-table";
import Badge from "../ui/badge/Badge";
import { EyeIcon, PencilIcon, TrashBinIcon } from "../../icons";
import { RequirePermission } from "../auth/RequirePermission";
import {
  PERM_ADMIN_USERS_EDIT,
  PERM_ADMIN_USERS_DELETE,
} from "../../constants/permissions";
import { fetchUsersPaginated, type User, type UsersListFilters } from "../../api/users";
import type { TrashScope } from "../trash/TrashScopeTabs";
import type { DataTableFetchParams, DataTableFetchResult } from "./data-table/DataTable.types";

export interface UsersTableProps {
  onDeleteClick?: (user: User) => void;
  onRestoreClick?: (user: User) => void;
  filters: UsersListFilters;
  trashScope?: TrashScope;
}

export const UsersTable = forwardRef<DataTableRef, UsersTableProps>(
  function UsersTable(
    { onDeleteClick, onRestoreClick, filters, trashScope = "active" },
    ref
  ) {
    const filterKey = useMemo(
      () => `${JSON.stringify(filters)}|${trashScope}`,
      [filters, trashScope],
    );

    const fetchData = useCallback(
      (params: DataTableFetchParams): Promise<DataTableFetchResult<User>> =>
        fetchUsersPaginated({ ...params, filters, trashScope }),
      [filters, trashScope],
    );

    const isTrash = trashScope === "trash";

    const columns = [
      {
        key: "name",
        header: "Name",
        sortable: true,
        render: (row: User) => row.name || "—",
      },
      {
        key: "email",
        header: "Email",
        sortable: true,
        render: (row: User) => row.email,
      },
      {
        key: "designation",
        header: "Designation",
        sortable: false,
        render: (row: User) => (
          <div>
            <div>{row.designation || "—"}</div>
            {row.profession && (
              <div className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">{row.profession}</div>
            )}
          </div>
        ),
      },
      {
        key: "state",
        header: "State",
        sortable: false,
        render: (row: User) => row.state || "—",
      },
      {
        key: "membership",
        header: "Membership",
        sortable: false,
        render: (row: User) => (
          <span className="rounded-md bg-gray-100 px-2 py-0.5 text-xs text-gray-700 dark:bg-gray-800 dark:text-gray-300">
            {row.membership_name || "Free"}
          </span>
        ),
      },
      {
        key: "status",
        header: "Status",
        sortable: true,
        render: (row: User) => {
          const inactive =
            row.is_active === false ||
            String(row.status || "").toLowerCase() === "inactive";
          return (
            <Badge size="sm" color={inactive ? "warning" : "success"}>
              {inactive ? "Inactive" : "Active"}
            </Badge>
          );
        },
      },
      {
        key: "created_at",
        header: "Joined",
        sortable: true,
        render: (row: User) =>
          row.created_at ? new Date(row.created_at).toLocaleDateString() : "—",
      },
      {
        key: "actions",
        header: "Actions",
        align: "end" as const,
        sortable: false,
        render: (row: User) => (
          <div className="flex items-center justify-end gap-1">
            {!isTrash ? (
              <>
                <Link
                  to={`/users/${row.id}`}
                  className="inline-flex items-center justify-center rounded-lg p-2 text-gray-500 transition hover:bg-gray-100 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-white"
                  title="View"
                >
                  <EyeIcon className="size-4 shrink-0 fill-current" />
                </Link>
                <RequirePermission permissions={[PERM_ADMIN_USERS_EDIT]} fallback={null}>
                  <Link
                    to={`/users/${row.id}/edit`}
                    className="inline-flex items-center justify-center rounded-lg p-2 text-gray-500 transition hover:bg-gray-100 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-white"
                    title="Edit"
                  >
                    <PencilIcon className="size-4 shrink-0 fill-current" />
                  </Link>
                </RequirePermission>
                <RequirePermission permissions={[PERM_ADMIN_USERS_DELETE]} fallback={null}>
                  <button
                    type="button"
                    onClick={() => onDeleteClick?.(row)}
                    className="inline-flex items-center justify-center rounded-lg p-2 text-gray-500 transition hover:bg-error-50 hover:text-error-500 dark:text-gray-400 dark:hover:bg-error-500/10 dark:hover:text-error-400"
                    title="Move to trash"
                  >
                    <TrashBinIcon className="size-4 shrink-0 fill-current" />
                  </button>
                </RequirePermission>
              </>
            ) : (
              <RequirePermission permissions={[PERM_ADMIN_USERS_DELETE]} fallback={null}>
                <button
                  type="button"
                  onClick={() => onRestoreClick?.(row)}
                  className="inline-flex items-center justify-center rounded-lg px-3 py-1.5 text-sm font-medium text-brand-600 transition hover:bg-brand-50 dark:text-brand-400 dark:hover:bg-brand-500/10"
                  title="Restore"
                >
                  Restore
                </button>
              </RequirePermission>
            )}
          </div>
        ),
      },
    ];

    return (
      <DataTable<User>
        key={filterKey}
        ref={ref}
        columns={columns}
        fetchData={fetchData}
        initialPageSize={10}
        initialSortBy="created_at"
        initialSortOrder="DESC"
        pageSizeOptions={[10, 20, 50, 100]}
        enableSearch
        enableSorting
        enablePagination
        searchPlaceholder="Search users…"
        emptyMessage={isTrash ? "Trash is empty." : "No users found."}
      />
    );
  }
);
