import { useState, useRef, useCallback } from "react";
import { Link } from "react-router";
import PageMeta from "../../components/common/PageMeta";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import { ConfirmDeleteModal } from "../../components/ui/modal/ConfirmDeleteModal";
import { DataTable, type DataTableRef } from "../../components/tables/data-table/DataTable";
import Badge from "../../components/ui/badge/Badge";
import { EyeIcon, PencilIcon, TrashBinIcon } from "../../icons";
import { useModal } from "../../hooks/useModal";
import { RequirePermission } from "../../components/auth/RequirePermission";
import { PERM_MEMBERSHIPS_CREATE, PERM_MEMBERSHIPS_EDIT, PERM_MEMBERSHIPS_DELETE } from "../../constants/permissions";
import { plansApi, type Plan } from "../../api/plans";
import { withClientPagination } from "../../utils/dataTableUtils";
import { planIsLifetime } from "./membershipUtils";

function PopularToggle({ plan, onChanged }: { plan: Plan; onChanged: () => void }) {
  const [toggling, setToggling] = useState(false);

  async function handleToggle() {
    setToggling(true);
    try {
      await plansApi.togglePopular(plan.id, !plan.is_popular);
      onChanged();
    } catch (err) {
      console.error("Failed to toggle popular", err);
    } finally {
      setToggling(false);
    }
  }

  return (
    <button
      onClick={handleToggle}
      disabled={toggling}
      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2 ${
        plan.is_popular ? "bg-brand-500" : "bg-gray-200 dark:bg-gray-700"
      } ${toggling ? "opacity-50 cursor-wait" : "cursor-pointer"}`}
      title={plan.is_popular ? "This plan is marked as Popular" : "Mark as Popular"}
    >
      <span
        className={`inline-block h-4 w-4 rounded-full bg-white shadow-sm transition-transform ${
          plan.is_popular ? "translate-x-6" : "translate-x-1"
        }`}
      />
    </button>
  );
}

const formatDuration = (days: number) => {
  if (days >= 365) return `${(days / 365).toFixed(1).replace(/\.0$/, '')} year${days >= 730 ? 's' : ''}`;
  if (days >= 30) return `${(days / 30).toFixed(1).replace(/\.0$/, '')} month${days >= 60 ? 's' : ''}`;
  return `${days} day${days !== 1 ? 's' : ''}`;
};

// Wrap list API in client-side pagination adapter
const fetchMembershipsPaginated = withClientPagination(
  async () => {
    const res = await plansApi.list();
    return res.data;
  },
  ["name", "description"]
);

export default function MembershipList() {
  const [deleteTarget, setDeleteTarget] = useState<Plan | null>(null);
  const [deleting, setDeleting] = useState(false);
  const { isOpen: isDeleteModalOpen, openModal: openDeleteModal, closeModal: closeDeleteModal } = useModal();
  const dataTableRef = useRef<DataTableRef>(null);

  const handleDeleteClick = useCallback((membership: Plan) => {
    setDeleteTarget(membership);
    openDeleteModal();
  }, [openDeleteModal]);

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await plansApi.delete(deleteTarget.id);
      dataTableRef.current?.refetch();
      setDeleteTarget(null);
      closeDeleteModal();
    } catch (err) {
      console.error("Failed to delete membership", err);
      alert("Failed to delete membership");
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
      key: "name",
      header: "Name",
      sortable: true,
      render: (row: Plan) => (
        <div>
          <span className="block font-medium text-gray-800 text-theme-sm dark:text-white/90">
            {row.name}
          </span>
          <span className="block text-gray-500 text-theme-xs dark:text-gray-400 line-clamp-1">
            {row.description}
          </span>
        </div>
      ),
    },
    {
      key: "price",
      header: "Price",
      sortable: true,
      render: (row: Plan) => (
        <span className="text-gray-800 dark:text-white/90">
          {row.currency} {row.price}
        </span>
      ),
    },
    {
      key: "duration_days",
      header: "Duration",
      sortable: true,
      render: (row: Plan) => (
        <span className="text-gray-500 dark:text-gray-400">
          {planIsLifetime(row) ? "Lifetime" : formatDuration(Number(row.duration_days) || 0)}
        </span>
      ),
    },
    {
      key: "is_active",
      header: "Status",
      sortable: true,
      render: (row: Plan) => (
        <Badge size="sm" color={row.is_active ? "success" : "error"}>
          {row.is_active ? "Active" : "Inactive"}
        </Badge>
      ),
    },
    {
      key: "is_popular",
      header: "Popular",
      sortable: false,
      render: (row: Plan) => (
        <RequirePermission permissions={[PERM_MEMBERSHIPS_EDIT]} fallback={
          row.is_popular ? <Badge size="sm" color="warning">Popular</Badge> : <span className="text-gray-400">—</span>
        }>
          <PopularToggle plan={row} onChanged={() => dataTableRef.current?.refetch()} />
        </RequirePermission>
      ),
    },
    {
      key: "actions",
      header: "Actions",
      align: "end" as const,
      sortable: false,
      render: (row: Plan) => (
        <div className="flex items-center justify-end gap-2">
          <Link
            to={`/memberships/${row.id}`}
            className="inline-flex items-center justify-center gap-1.5 rounded-lg px-2.5 py-2 text-sm text-gray-600 transition hover:bg-gray-100 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-white"
            title="View"
          >
            <EyeIcon className="size-4 shrink-0 fill-current" />
            View
          </Link>
          <RequirePermission permissions={[PERM_MEMBERSHIPS_EDIT]} fallback={null}>
            <Link
              to={`/memberships/${row.id}/edit`}
              className="inline-flex items-center justify-center gap-1.5 rounded-lg px-2.5 py-2 text-sm text-gray-600 transition hover:bg-gray-100 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-white"
              title="Edit"
            >
              <PencilIcon className="size-4 shrink-0 fill-current" />
              Edit
            </Link>
          </RequirePermission>
          <RequirePermission permissions={[PERM_MEMBERSHIPS_DELETE]} fallback={null}>
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
        title="Memberships | StudyCafe Admin"
        description="Manage memberships for studycafe.in"
      />
      <PageBreadcrumb
        pageTitle="Memberships"
        actions={
          <RequirePermission permissions={[PERM_MEMBERSHIPS_CREATE]} fallback={null}>
            <Link
              to="/memberships/create"
              className="inline-flex items-center justify-center gap-2 rounded-lg px-4 py-3 text-sm font-medium text-white transition bg-brand-500 shadow-theme-xs hover:bg-brand-600"
            >
              Create New
            </Link>
          </RequirePermission>
        }
      />
      <div className="space-y-6">
        <DataTable<Plan>
          ref={dataTableRef}
          columns={columns}
          fetchData={fetchMembershipsPaginated}
          initialPageSize={10}
          pageSizeOptions={[10, 20, 50, 100]}
          enableSearch
          enableSorting
          enablePagination
          searchPlaceholder="Search memberships…"
          emptyMessage="No memberships found."
        />
      </div>

      <ConfirmDeleteModal
        isOpen={isDeleteModalOpen}
        onClose={handleDeleteCancel}
        onConfirm={handleDeleteConfirm}
        title="Delete Membership"
        itemName={deleteTarget?.name}
        isLoading={deleting}
      />
    </>
  );
}
