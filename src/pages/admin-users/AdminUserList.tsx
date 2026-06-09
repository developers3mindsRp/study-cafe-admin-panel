import { useState, useRef, useCallback } from "react";
import { Link } from "react-router";
import PageMeta from "../../components/common/PageMeta";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import { ConfirmDeleteModal } from "../../components/ui/modal/ConfirmDeleteModal";
import { DataTable, type DataTableRef } from "../../components/tables/data-table/DataTable";
import Badge from "../../components/ui/badge/Badge";
import { DownloadIcon, EyeIcon, PencilIcon, TrashBinIcon } from "../../icons";
import { useModal } from "../../hooks/useModal";
import { RequirePermission } from "../../components/auth/RequirePermission";
import { adminUsersApi, type AdminPanelUser } from "../../api/adminUsers";
import { PERM_ADMIN_USERS_LIST, PERM_ADMIN_USERS_VIEW, PERM_ADMIN_USERS_EDIT, PERM_ADMIN_USERS_DELETE } from "../../constants/permissions";
import { withClientPagination } from "../../utils/dataTableUtils";
import { exportRowsToExcel } from "../../utils/exportToExcel";
import { ExportProgressBar } from "../../components/export/ExportProgressBar";
import {
  formatExportProgressLabel,
  formatExportProgressTitle,
  type ExportProgress,
} from "../../utils/exportProgress";
import { ADMIN_PANEL_USER_EXPORT_COLUMNS } from "../../utils/adminUserExportColumns";

// Wrap list API in client-side pagination adapter
const fetchAdminUsersPaginated = withClientPagination(
  () => adminUsersApi.list(),
  ["name", "email", "role"]
);

const ADMIN_USER_SEARCH_KEYS: (keyof AdminPanelUser)[] = ["name", "email", "role"];

function filterAdminUsersForExport(rows: AdminPanelUser[], search: string): AdminPanelUser[] {
  const q = search.trim().toLowerCase();
  if (!q) return rows;
  return rows.filter((item) =>
    ADMIN_USER_SEARCH_KEYS.some((key) => {
      const val = item[key];
      return val != null && String(val).toLowerCase().includes(q);
    })
  );
}

function sortAdminUsersForExport(
  rows: AdminPanelUser[],
  sortBy: string,
  sortOrder: "ASC" | "DESC"
): AdminPanelUser[] {
  if (!sortBy) return rows;
  return [...rows].sort((a, b) => {
    const valA = a[sortBy as keyof AdminPanelUser];
    const valB = b[sortBy as keyof AdminPanelUser];
    if (typeof valA === "string" && typeof valB === "string") {
      return sortOrder === "DESC" ? valB.localeCompare(valA) : valA.localeCompare(valB);
    }
    if (valA == null && valB == null) return 0;
    if (valA == null) return sortOrder === "DESC" ? -1 : 1;
    if (valB == null) return sortOrder === "DESC" ? 1 : -1;
    if (valA < valB) return sortOrder === "DESC" ? 1 : -1;
    if (valA > valB) return sortOrder === "DESC" ? -1 : 1;
    return 0;
  });
}

export default function AdminUserList() {
  const [deleteTarget, setDeleteTarget] = useState<AdminPanelUser | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [exportProgress, setExportProgress] = useState<ExportProgress | null>(null);
  const exporting = exportProgress !== null;
  const { isOpen: isDeleteModalOpen, openModal: openDeleteModal, closeModal: closeDeleteModal } = useModal();
  const dataTableRef = useRef<DataTableRef>(null);

  const handleDeleteClick = useCallback((user: AdminPanelUser) => {
    setDeleteTarget(user);
    openDeleteModal();
  }, [openDeleteModal]);

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await adminUsersApi.delete(deleteTarget.id);
      dataTableRef.current?.refetch();
      setDeleteTarget(null);
      closeDeleteModal();
    } catch (err: unknown) {
      setError((err as { response?: { data?: { error?: string } } })?.response?.data?.error || "Failed to delete");
    } finally {
      setDeleting(false);
    }
  };

  const handleDeleteCancel = () => {
    setDeleteTarget(null);
    closeDeleteModal();
  };

  const handleExportExcel = useCallback(async () => {
    const q = dataTableRef.current?.getQueryState();
    if (!q) return;
    setExportProgress({ loaded: 0, total: null, phase: "fetching" });
    try {
      const all = await adminUsersApi.list();
      let rows = filterAdminUsersForExport(all, q.search);
      rows = sortAdminUsersForExport(rows, q.sortBy, q.sortOrder);
      setExportProgress({ loaded: rows.length, total: rows.length, phase: "writing" });
      const datePart = new Date().toISOString().slice(0, 10);
      const filteredPart = q.search.trim() ? "-filtered" : "";
      exportRowsToExcel({
        filename: `admin-users-export-${datePart}${filteredPart}`,
        sheetName: "Admin Users",
        columns: ADMIN_PANEL_USER_EXPORT_COLUMNS,
        rows,
      });
    } catch (err: unknown) {
      const msg =
        err && typeof err === "object" && "response" in err
          ? (err as { response?: { data?: { message?: string } } }).response?.data?.message
          : err instanceof Error
            ? err.message
            : "Export failed";
      alert(msg || "Export failed");
    } finally {
      setExportProgress(null);
    }
  }, []);

  const columns = [
    {
      key: "name",
      header: "Name",
      sortable: true,
      render: (row: AdminPanelUser) => <span className="font-medium text-gray-800 dark:text-white/90">{row.name || "—"}</span>,
    },
    {
      key: "email",
      header: "Email",
      sortable: true,
      render: (row: AdminPanelUser) => <span className="text-gray-600 dark:text-gray-300">{row.email}</span>,
    },
    {
      key: "role",
      header: "Role",
      sortable: true,
      render: (row: AdminPanelUser) => (
        <span className="rounded-md bg-gray-100 px-2 py-0.5 text-theme-xs text-gray-700 dark:bg-gray-800 dark:text-gray-300">
          {row.role}
        </span>
      ),
    },
    {
      key: "is_active",
      header: "Status",
      sortable: true,
      render: (row: AdminPanelUser) => (
        <Badge size="sm" color={row.is_active ? "success" : "error"}>
          {row.is_active ? "Active" : "Inactive"}
        </Badge>
      ),
    },
    {
      key: "actions",
      header: "Actions",
      align: "end" as const,
      sortable: false,
      render: (row: AdminPanelUser) => (
        <div className="flex items-center justify-end gap-2">
          <RequirePermission permissions={[PERM_ADMIN_USERS_VIEW, PERM_ADMIN_USERS_EDIT]} fallback={null}>
            <Link
              to={`/admin-users/${row.id}`}
              className="inline-flex items-center justify-center gap-1.5 rounded-lg px-2.5 py-2 text-sm text-gray-600 transition hover:bg-gray-100 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-white"
              title="View"
            >
              <EyeIcon className="size-4 shrink-0 fill-current" />
              View
            </Link>
            <Link
              to={`/admin-users/${row.id}/edit`}
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
              onClick={() => handleDeleteClick(row)}
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
    <RequirePermission permissions={[PERM_ADMIN_USERS_LIST]}>
      <PageMeta
        title="Admin Users | StudyCafe Admin"
        description="Manage admin panel users and permissions"
      />
      <PageBreadcrumb
        pageTitle="Admin Users"
        actions={
          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={handleExportExcel}
              disabled={exporting}
              title={formatExportProgressTitle(exportProgress)}
              className="inline-flex items-center justify-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-3 text-sm font-medium text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-600 dark:bg-gray-900 dark:text-gray-200 dark:hover:bg-gray-800"
            >
              <DownloadIcon className="size-4 shrink-0 fill-current" />
              {formatExportProgressLabel(exportProgress, "Export Excel")}
            </button>
            <RequirePermission permissions={["admin_users:create"]}>
              <Link
                to="/admin-users/create"
                className="inline-flex items-center justify-center gap-2 rounded-lg px-4 py-3 text-sm font-medium text-white transition bg-brand-500 shadow-theme-xs hover:bg-brand-600"
              >
                Create Admin User
              </Link>
            </RequirePermission>
          </div>
        }
      />
      <div className="space-y-6">
        <ExportProgressBar progress={exportProgress} label="Exporting admin users" />
        {error && (
          <div className="rounded-lg border border-error-200 bg-error-50 px-4 py-3 text-sm text-error-700 dark:border-error-800 dark:bg-error-500/10 dark:text-error-400">
            {error}
          </div>
        )}
        <DataTable<AdminPanelUser>
          ref={dataTableRef}
          columns={columns}
          fetchData={fetchAdminUsersPaginated}
          initialPageSize={10}
          pageSizeOptions={[10, 20, 50, 100]}
          enableSearch
          enableSorting
          enablePagination
          searchPlaceholder="Search admin users…"
          emptyMessage="No admin users found."
        />
      </div>

      <ConfirmDeleteModal
        isOpen={isDeleteModalOpen}
        onClose={handleDeleteCancel}
        onConfirm={handleDeleteConfirm}
        title="Delete Admin User"
        itemName={deleteTarget?.email}
        isLoading={deleting}
      />
    </RequirePermission>
  );
}

