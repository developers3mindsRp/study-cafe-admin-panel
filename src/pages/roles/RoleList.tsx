import { useCallback, useRef, useState } from "react";
import { Link } from "react-router";
import PageMeta from "../../components/common/PageMeta";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import { ConfirmDeleteModal } from "../../components/ui/modal/ConfirmDeleteModal";
import { DataTable, type DataTableRef } from "../../components/tables/data-table/DataTable";
import { RequirePermission } from "../../components/auth/RequirePermission";
import { rolesApi, type RoleRecord } from "../../api/roles";
import { PERM_ROLES_CREATE, PERM_ROLES_DELETE, PERM_ROLES_EDIT, PERM_ROLES_LIST } from "../../constants/permissions";
import { withClientPagination } from "../../utils/dataTableUtils";
import Badge from "../../components/ui/badge/Badge";
import { PencilIcon, TrashBinIcon } from "../../icons";

const fetchRolesPaginated = withClientPagination(() => rolesApi.list(true), ["name", "description"]);

export default function RoleList() {
  const tableRef = useRef<DataTableRef>(null);
  const [deleteTarget, setDeleteTarget] = useState<RoleRecord | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleDeleteConfirm = useCallback(async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    setError(null);
    try {
      await rolesApi.delete(deleteTarget.id);
      setDeleteTarget(null);
      tableRef.current?.refetch();
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string; error?: string } } })?.response?.data
          ?.message ||
        (err as { response?: { data?: { error?: string } } })?.response?.data?.error ||
        "Failed to delete role";
      setError(msg);
    } finally {
      setDeleting(false);
    }
  }, [deleteTarget]);

  const columns = [
    {
      key: "name",
      header: "Role",
      sortable: true,
      render: (row: RoleRecord) => (
        <span className="font-medium text-gray-800 dark:text-white/90">{row.name}</span>
      ),
    },
    {
      key: "description",
      header: "Description",
      sortable: true,
      render: (row: RoleRecord) => (
        <span className="text-gray-600 dark:text-gray-300">{row.description || "—"}</span>
      ),
    },
    {
      key: "user_count",
      header: "Users",
      sortable: true,
      render: (row: RoleRecord) => row.user_count ?? 0,
    },
    {
      key: "flags",
      header: "Type",
      sortable: false,
      render: (row: RoleRecord) => (
        <div className="flex flex-wrap gap-1">
          {row.is_system && (
            <Badge size="sm" color="light">
              System
            </Badge>
          )}
          {row.is_admin_panel && (
            <Badge size="sm" color="success">
              Admin panel
            </Badge>
          )}
        </div>
      ),
    },
    {
      key: "actions",
      header: "Actions",
      align: "end" as const,
      sortable: false,
      render: (row: RoleRecord) => (
        <div className="flex items-center justify-end gap-2">
          <RequirePermission permissions={[PERM_ROLES_EDIT]} fallback={null}>
            <Link
              to={`/roles/${row.id}/edit`}
              className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-2 text-sm text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800"
            >
              <PencilIcon className="size-4 fill-current" />
              Edit
            </Link>
          </RequirePermission>
          <RequirePermission permissions={[PERM_ROLES_DELETE]} fallback={null}>
            {!row.is_system && (
              <button
                type="button"
                onClick={() => setDeleteTarget(row)}
                className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-2 text-sm text-gray-600 hover:bg-error-50 hover:text-error-500 dark:hover:bg-error-500/10"
              >
                <TrashBinIcon className="size-4 fill-current" />
                Delete
              </button>
            )}
          </RequirePermission>
        </div>
      ),
    },
  ];

  return (
    <RequirePermission permissions={[PERM_ROLES_LIST]}>
      <PageMeta title="Roles | StudyCafe Admin" description="Manage roles and default permissions" />
      <PageBreadcrumb
        pageTitle="Roles & Permissions"
        actions={
          <RequirePermission permissions={[PERM_ROLES_CREATE]} fallback={null}>
            <Link
              to="/roles/create"
              className="inline-flex items-center justify-center gap-2 rounded-lg px-4 py-3 text-sm font-medium text-white bg-brand-500 shadow-theme-xs hover:bg-brand-600"
            >
              Create Role
            </Link>
          </RequirePermission>
        }
      />
      {error && (
        <div className="mb-4 rounded-lg border border-error-200 bg-error-50 px-4 py-3 text-sm text-error-700 dark:border-error-800 dark:bg-error-500/10 dark:text-error-400">
          {error}
        </div>
      )}
      <DataTable<RoleRecord>
        ref={tableRef}
        columns={columns}
        fetchData={fetchRolesPaginated}
        initialPageSize={20}
        enableSearch
        enableSorting
        searchPlaceholder="Search roles…"
        emptyMessage="No roles found."
      />
      <ConfirmDeleteModal
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDeleteConfirm}
        title="Delete Role"
        itemName={deleteTarget?.name}
        isLoading={deleting}
      />
    </RequirePermission>
  );
}
