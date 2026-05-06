/**
 * Users (Students) table using the reusable DataTable with server-side pagination, sort, and search.
 */

import { forwardRef, useCallback } from "react";
import { Link } from "react-router";
import { DataTable, type DataTableRef } from "./data-table";
import Badge from "../ui/badge/Badge";
import { EyeIcon, PencilIcon, TrashBinIcon } from "../../icons";
import { RequirePermission } from "../auth/RequirePermission";
import {
  PERM_ADMIN_USERS_EDIT,
  PERM_ADMIN_USERS_DELETE,
} from "../../constants/permissions";
import { fetchUsersPaginated, type User } from "../../api/users";
import type { DataTableFetchParams, DataTableFetchResult } from "./data-table/DataTable.types";

export interface UsersTableProps {
  onDeleteClick?: (user: User) => void;
  filterRole?: string;
  filterStatus?: string;
}

export const UsersTable = forwardRef<DataTableRef, UsersTableProps>(
  function UsersTable({ onDeleteClick, filterRole = "", filterStatus = "" }, ref) {
    const fetchData = useCallback(
      (params: DataTableFetchParams): Promise<DataTableFetchResult<User>> =>
        fetchUsersPaginated({
          ...params,
          ...(filterRole ? { role: filterRole } : {}),
          ...(filterStatus ? { status: filterStatus } : {}),
        }),
      [filterRole, filterStatus]
    );

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
        key: "phone",
        header: "Phone",
        sortable: false,
        render: (row: User) => row.phone || "—",
      },
      {
        key: "membership",
        header: "Membership",
        sortable: false,
        render: (row: User) => (
          <span className="rounded-md bg-gray-100 px-2 py-0.5 text-xs text-gray-700 dark:bg-gray-800 dark:text-gray-300">
            {row.membership || "Free"}
          </span>
        ),
      },
      {
        key: "status",
        header: "Status",
        sortable: true,
        render: (row: User) => (
          <Badge
            size="sm"
            color={row.status === "active" ? "success" : "warning"}
          >
            {row.status || "Active"}
          </Badge>
        ),
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
          <div className="flex items-center justify-end gap-2">
            <Link
              to={`/users/${row.id}`}
              className="inline-flex items-center justify-center gap-1.5 rounded-lg px-2.5 py-2 text-sm text-gray-600 transition hover:bg-gray-100 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-white"
              title="View"
            >
              <EyeIcon className="size-4 shrink-0 fill-current" />
              View
            </Link>
            <RequirePermission permissions={[PERM_ADMIN_USERS_EDIT]} fallback={null}>
              <Link
                to={`/users/${row.id}/edit`}
                className="inline-flex items-center justify-center gap-1.5 rounded-lg px-2.5 py-2 text-sm text-gray-600 transition hover:bg-gray-100 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-white"
                title="Edit"
              >
                <PencilIcon className="size-4 shrink-0 fill-current" />
                Edit
              </Link>
            </RequirePermission>
            <RequirePermission permissions={[PERM_ADMIN_USERS_DELETE]} fallback={null}>
              <button
                type="button"
                onClick={() => onDeleteClick?.(row)}
                className="inline-flex items-center justify-center gap-1.5 rounded-lg px-2.5 py-2 text-sm text-gray-600 transition hover:bg-error-50 hover:text-error-500 dark:text-gray-400 dark:hover:bg-error-500/10 dark:hover:text-error-400"
                title="Delete"
              >
                <TrashBinIcon className="size-4 shrink-0 fill-current" />
                Delete
              </button>
            </RequirePermission>
          </div>
        ),
      },
    ];

    return (
      <DataTable<User>
        key={`${filterRole}|${filterStatus}`}
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
        emptyMessage="No users found."
      />
    );
  }
);
