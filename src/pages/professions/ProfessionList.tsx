import { formatDate } from "../../utils/formatDate";
import { useState, useRef, useCallback, useMemo } from "react";
import { Link } from "react-router";
import PageMeta from "../../components/common/PageMeta";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import { ConfirmDeleteModal } from "../../components/ui/modal/ConfirmDeleteModal";
import { DataTable, type DataTableRef } from "../../components/tables/data-table/DataTable";
import Badge from "../../components/ui/badge/Badge";
import { PencilIcon, TrashBinIcon } from "../../icons";
import { useModal } from "../../hooks/useModal";
import { RequirePermission } from "../../components/auth/RequirePermission";
import {
  PERM_PROFESSION_CREATE,
  PERM_PROFESSION_EDIT,
  PERM_PROFESSION_DELETE,
} from "../../constants/permissions";
import { fetchProfessions, deleteProfession, type Profession } from "../../api/professions";
import { withClientPagination } from "../../utils/dataTableUtils";
import { getApiErrorMessage } from "../../lib/apiError";

type StatusFilter = "all" | "active" | "inactive";

export default function ProfessionList() {
  const [deleteTarget, setDeleteTarget] = useState<Profession | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");

  const fetchProfessionsPaginated = useMemo(
    () =>
      withClientPagination(
        () =>
          fetchProfessions().then((rows) =>
            statusFilter === "all" ? rows : rows.filter((r) => r.status === statusFilter)
          ),
        ["title"]
      ),
    [statusFilter]
  );
  const [error, setError] = useState<string | null>(null);
  const { isOpen: isDeleteModalOpen, openModal: openDeleteModal, closeModal: closeDeleteModal } = useModal();
  const dataTableRef = useRef<DataTableRef>(null);

  const handleDeleteClick = useCallback((profession: Profession) => {
    setDeleteTarget(profession);
    openDeleteModal();
  }, [openDeleteModal]);

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await deleteProfession(deleteTarget.id);
      dataTableRef.current?.refetch();
      setDeleteTarget(null);
      closeDeleteModal();
    } catch (err: unknown) {
      console.error("Failed to delete profession", err);
      setError(getApiErrorMessage(err, "Failed to delete profession"));
    } finally {
      setDeleting(false);
    }
  };

  const handleDeleteCancel = () => {
    setDeleteTarget(null);
    closeDeleteModal();
  };

  const columns = [
    {
      key: "title",
      header: "Title",
      sortable: true,
      render: (row: Profession) => (
        <span className="font-medium text-gray-800 text-theme-sm dark:text-white/90">
          {row.title}
        </span>
      ),
    },
    {
      key: "status",
      header: "Status",
      sortable: true,
      render: (row: Profession) => (
        <Badge size="sm" color={row.status === "active" ? "success" : "error"}>
          {row.status === "active" ? "Active" : "Inactive"}
        </Badge>
      ),
    },
    {
      key: "created_at",
      header: "Created At",
      sortable: true,
      render: (row: Profession) => (row.created_at ? formatDate(row.created_at) : "—"),
    },
    {
      key: "actions",
      header: "Actions",
      align: "end" as const,
      sortable: false,
      render: (row: Profession) => (
        <div className="flex items-center justify-end gap-2">
          <RequirePermission permissions={[PERM_PROFESSION_EDIT]} fallback={null}>
            <Link
              to={`/professions/${row.id}/edit`}
              className="inline-flex items-center justify-center gap-1.5 rounded-lg px-2.5 py-2 text-sm text-gray-600 transition hover:bg-gray-100 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-white"
              title="Edit"
            >
              <PencilIcon className="size-4 shrink-0 fill-current" />
              Edit
            </Link>
          </RequirePermission>
          <RequirePermission permissions={[PERM_PROFESSION_DELETE]} fallback={null}>
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
    <>
      <PageMeta
        title="Professions | StudyCafe Admin"
        description="Manage the profession options offered to users"
      />
      <PageBreadcrumb
        pageTitle="Professions"
        actions={
          <div className="flex flex-wrap items-center gap-3">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
              className="h-11 rounded-lg border border-gray-300 bg-transparent px-3 py-2.5 text-sm text-gray-700 shadow-theme-xs focus:outline-hidden focus:ring-3 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200"
            >
              <option value="all">All statuses</option>
              <option value="active">Active only</option>
              <option value="inactive">Inactive only</option>
            </select>
            <RequirePermission permissions={[PERM_PROFESSION_CREATE]} fallback={null}>
              <Link
                to="/professions/create"
                className="inline-flex items-center justify-center gap-2 rounded-lg px-4 py-3 text-sm font-medium text-white transition bg-brand-500 shadow-theme-xs hover:bg-brand-600"
              >
                Create New
              </Link>
            </RequirePermission>
          </div>
        }
      />
      <div className="space-y-6">
        {error && (
          <div className="rounded-lg border border-error-200 bg-error-50 px-4 py-3 text-sm text-error-700 dark:border-error-800 dark:bg-error-500/10 dark:text-error-400">
            {error}
          </div>
        )}
        <DataTable<Profession>
          ref={dataTableRef}
          columns={columns}
          fetchData={fetchProfessionsPaginated}
          initialPageSize={10}
          initialSortBy="created_at"
          initialSortOrder="DESC"
          pageSizeOptions={[10, 20, 50, 100]}
          enableSearch
          enableSorting
          enablePagination
          searchPlaceholder="Search professions…"
          emptyMessage="No professions found."
        />
      </div>

      <ConfirmDeleteModal
        isOpen={isDeleteModalOpen}
        onClose={handleDeleteCancel}
        onConfirm={handleDeleteConfirm}
        title="Delete Profession"
        itemName={deleteTarget?.title}
        isLoading={deleting}
      />
    </>
  );
}
