import { useCallback, useMemo, useRef, useState } from "react";
import { Link } from "react-router";
import PageMeta from "../../components/common/PageMeta";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import { ConfirmDeleteModal } from "../../components/ui/modal/ConfirmDeleteModal";
import { RequirePermission } from "../../components/auth/RequirePermission";
import {
  PERM_ADMIN_USERS_LIST,
  PERM_ADMIN_USERS_CREATE,
  PERM_USERS_COURSE_ALLOTMENT,
} from "../../constants/permissions";
import {
  emptyUsersListFilters,
  fetchAllUsersForExport,
  usersApi,
  usersListFiltersAreActive,
  usersListFiltersFromValues,
  type UsersListFilters,
  type User,
} from "../../api/users";
import { exportRowsToExcel } from "../../utils/exportToExcel";
import {
  USER_EXPORT_COLUMNS,
  usersMembershipSummaryAoa,
  usersStateSummaryAoa,
  type UserExportRow,
} from "../../utils/userExportColumns";
import { DownloadIcon } from "../../icons";
import Button from "../../components/ui/button/Button";
import { UsersTable } from "../../components/tables";
import type { DataTableRef } from "../../components/tables/data-table";
import { FilterBar, useFilterState } from "../../components/filters";
import type { FilterFieldDef } from "../../components/filters";
import { CourseAllotmentModal } from "./components/CourseAllotmentModal";
import { MembershipAllotmentModal } from "./components/MembershipAllotmentModal";
import {
  UserExportModal,
  type UserExportSelection,
} from "./components/UserExportModal";
import { UserImportModal } from "./components/UserImportModal";
import { USER_MEMBERSHIP_FILTER_OPTIONS } from "./constants/userMembershipOptions";

const userFilterFields: FilterFieldDef[] = [
  {
    type: "text",
    id: "email",
    label: "Email",
    placeholder: "Filter by email…",
  },
  {
    type: "text",
    id: "state",
    label: "State",
    placeholder: "Filter by state…",
  },
  {
    type: "select",
    id: "status",
    label: "Status",
    placeholder: "All statuses",
    options: [
      { value: "active", label: "Active" },
      { value: "inactive", label: "Inactive" },
    ],
  },
  {
    type: "select",
    id: "membership",
    label: "Membership",
    placeholder: "All plans",
    options: [...USER_MEMBERSHIP_FILTER_OPTIONS],
  },
  {
    type: "select",
    id: "role",
    label: "Role",
    placeholder: "All roles",
    options: [
      { value: "student", label: "Student" },
      { value: "instructor", label: "Instructor" },
      { value: "admin", label: "Admin" },
    ],
  },
  {
    type: "date-range",
    id: "joined",
    label: "Joined",
    fromId: "joinedFrom",
    toId: "joinedTo",
  },
];

export default function UserList() {
  return (
    <RequirePermission permissions={[PERM_ADMIN_USERS_LIST]}>
      <UserListContent />
    </RequirePermission>
  );
}

function UserListContent() {
  const tableRef = useRef<DataTableRef>(null);
  const [deleteTarget, setDeleteTarget] = useState<User | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isAllotmentModalOpen, setIsAllotmentModalOpen] = useState(false);
  const [isMembershipModalOpen, setIsMembershipModalOpen] = useState(false);
  const [exportModalOpen, setExportModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const { values, set, reset, hasActive } = useFilterState();
  const [exporting, setExporting] = useState(false);

  const listFilters = useMemo(() => usersListFiltersFromValues(values), [values]);
  const filtersActive = useMemo(() => usersListFiltersAreActive(listFilters), [listFilters]);

  const handleExportExcel = useCallback(async () => {
    const q = tableRef.current?.getQueryState();
    if (!q) return;
    setExporting(true);
    try {
      const rows = await fetchAllUsersForExport({
        filters: listFilters,
        search: q.search,
        sortBy: q.sortBy,
        sortOrder: q.sortOrder,
      });
      const datePart = new Date().toISOString().slice(0, 10);
      const filteredPart = filtersActive || q.search.trim() ? "-filtered" : "";
      exportRowsToExcel({
        filename: `users-export-${datePart}${filteredPart}`,
        sheetName: "Users",
        columns: USER_EXPORT_COLUMNS,
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
      setExporting(false);
    }
  }, [listFilters, filtersActive]);

  const handleExportConfirm = useCallback(
    async (selection: UserExportSelection) => {
      setExporting(true);
      try {
        const filters: UsersListFilters = emptyUsersListFilters();
        if (selection.category === "membership") filters.membership = selection.value;
        else if (selection.category === "course") filters.courseId = selection.value;
        else if (selection.category === "state") filters.state = selection.value;

        const rows = await fetchAllUsersForExport({ filters });
        const exportRows = rows as UserExportRow[];

        const slug = selection.label
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, "-")
          .replace(/^-+|-+$/g, "")
          .slice(0, 40);
        const datePart = new Date().toISOString().slice(0, 10);
        const filename = `users-export-${selection.category}-${slug || "all"}-${datePart}`;

        exportRowsToExcel({
          filename,
          sheetName: "Users",
          columns: USER_EXPORT_COLUMNS,
          rows: exportRows,
          extraSheets: [
            { name: "By state", aoa: usersStateSummaryAoa(exportRows) },
            { name: "By membership", aoa: usersMembershipSummaryAoa(exportRows) },
          ],
        });
        setExportModalOpen(false);
      } catch (err: unknown) {
        const msg =
          err && typeof err === "object" && "response" in err
            ? (err as { response?: { data?: { message?: string } } }).response?.data?.message
            : err instanceof Error
              ? err.message
              : "Export failed";
        alert(msg || "Export failed");
      } finally {
        setExporting(false);
      }
    },
    []
  );

  const handleDeleteClick = (user: User) => {
    setDeleteTarget(user);
    setIsDeleteModalOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    try {
      await usersApi.delete(deleteTarget.id);
      setDeleteTarget(null);
      setIsDeleteModalOpen(false);
      await tableRef.current?.refetch();
    } catch (err) {
      console.error("Failed to delete user", err);
      alert("Failed to delete user");
    }
  };

  const handleDeleteCancel = () => {
    setDeleteTarget(null);
    setIsDeleteModalOpen(false);
  };

  return (
    <>
      <PageMeta
        title="Users (Students) | StudyCafe Admin"
        description="Manage students and instructors"
      />
      <PageBreadcrumb
        pageTitle="Users (Students)"
        actions={
          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={() => setExportModalOpen(true)}
              className="inline-flex items-center justify-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-3 text-sm font-medium text-gray-700 transition hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-900 dark:text-gray-200 dark:hover:bg-gray-800"
            >
              <DownloadIcon className="size-4 shrink-0 fill-current" />
              Export Excel
            </button>
            <RequirePermission permissions={[PERM_USERS_COURSE_ALLOTMENT]} fallback={null}>
              <button
                type="button"
                onClick={() => setIsMembershipModalOpen(true)}
                className="inline-flex items-center justify-center gap-2 rounded-lg border border-brand-500 px-4 py-3 text-sm font-medium text-brand-600 transition hover:bg-brand-50 dark:border-brand-400 dark:text-brand-400 dark:hover:bg-brand-500/10"
              >
                Allot Membership
              </button>
            </RequirePermission>
            <RequirePermission permissions={[PERM_USERS_COURSE_ALLOTMENT]} fallback={null}>
              <button
                type="button"
                onClick={() => setIsAllotmentModalOpen(true)}
                className="inline-flex items-center justify-center gap-2 rounded-lg border border-brand-500 px-4 py-3 text-sm font-medium text-brand-600 transition hover:bg-brand-50 dark:border-brand-400 dark:text-brand-400 dark:hover:bg-brand-500/10"
              >
                Allot Course
              </button>
            </RequirePermission>
            <RequirePermission permissions={[PERM_ADMIN_USERS_CREATE]} fallback={null}>
              <button
                type="button"
                onClick={() => setIsImportModalOpen(true)}
                className="inline-flex items-center justify-center gap-2 rounded-lg border border-brand-500 px-4 py-3 text-sm font-medium text-brand-600 transition hover:bg-brand-50 dark:border-brand-400 dark:text-brand-400 dark:hover:bg-brand-500/10"
              >
                Import Users
              </button>
            </RequirePermission>
            <RequirePermission permissions={[PERM_ADMIN_USERS_CREATE]} fallback={null}>
              <Link
                to="/users/create"
                className="inline-flex items-center justify-center gap-2 rounded-lg px-4 py-3 text-sm font-medium text-white transition bg-brand-500 shadow-theme-xs hover:bg-brand-600"
              >
                Add User
              </Link>
            </RequirePermission>
          </div>
        }
      />
      <div className="space-y-6">
        <FilterBar
          fields={userFilterFields}
          values={values}
          onChange={set}
          onReset={reset}
          hasActive={hasActive}
          actions={
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={exporting}
              className="h-10 whitespace-nowrap"
              startIcon={<DownloadIcon className="size-4 shrink-0" />}
              onClick={handleExportExcel}
            >
              {exporting ? "Exporting…" : filtersActive ? "Export filtered" : "Export Excel"}
            </Button>
          }
        />
        <UsersTable
          ref={tableRef}
          onDeleteClick={handleDeleteClick}
          filters={listFilters}
        />
      </div>

      <ConfirmDeleteModal
        isOpen={isDeleteModalOpen}
        onClose={handleDeleteCancel}
        onConfirm={handleDeleteConfirm}
        title="Delete User"
        itemName={deleteTarget?.name ?? deleteTarget?.email}
      />

      <CourseAllotmentModal
        isOpen={isAllotmentModalOpen}
        onClose={() => setIsAllotmentModalOpen(false)}
      />

      <MembershipAllotmentModal
        isOpen={isMembershipModalOpen}
        onClose={() => setIsMembershipModalOpen(false)}
      />

      <UserExportModal
        isOpen={exportModalOpen}
        onClose={() => setExportModalOpen(false)}
        onConfirm={handleExportConfirm}
        isExporting={exporting}
      />

      <UserImportModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        onImported={() => tableRef.current?.refetch()}
      />
    </>
  );
}
