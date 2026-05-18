import { useCallback, useRef, useState } from "react";
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
import { usersApi, fetchAllUsersForExport, type User } from "../../api/users";
import { UsersTable } from "../../components/tables";
import type { DataTableRef } from "../../components/tables/data-table";
import { FilterBar, useFilterState } from "../../components/filters";
import type { FilterFieldDef } from "../../components/filters";
import { CourseAllotmentModal } from "./components/CourseAllotmentModal";
import { MembershipAllotmentModal } from "./components/MembershipAllotmentModal";
import { UserExportModal } from "./components/UserExportModal";
import { USER_MEMBERSHIP_FILTER_OPTIONS } from "./constants/userMembershipOptions";
import { DownloadIcon } from "../../icons";
import { exportRowsToExcel } from "../../utils/exportToExcel";
import {
  USER_EXPORT_COLUMNS,
  usersMembershipSummaryAoa,
  usersStateSummaryAoa,
  type UserExportRow,
} from "../../utils/userExportColumns";

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
  const [exporting, setExporting] = useState(false);
  const { values, set, reset, hasActive } = useFilterState();

  const handleExportConfirm = useCallback(
    async (opts: { membership: string; state: string }) => {
      const q = tableRef.current?.getQueryState();
      if (!q) return;
      setExporting(true);
      try {
        const rows = await fetchAllUsersForExport({
          search: q.search.trim() !== "" ? q.search : undefined,
          sortBy: q.sortBy,
          sortOrder: q.sortOrder,
          role: values.role ?? "",
          status: values.status ?? "",
          email: values.email ?? "",
          state: opts.state,
          membership: opts.membership,
          joinedFrom: values.joinedFrom ?? "",
          joinedTo: values.joinedTo ?? "",
        });
        const exportRows = rows as UserExportRow[];
        exportRowsToExcel({
          filename: `users-export-${new Date().toISOString().slice(0, 10)}`,
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
    [values]
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
        />
        <UsersTable
          ref={tableRef}
          onDeleteClick={handleDeleteClick}
          filterEmail={values.email ?? ""}
          filterState={values.state ?? ""}
          filterStatus={values.status ?? ""}
          filterMembership={values.membership ?? ""}
          filterRole={values.role ?? ""}
          filterJoinedFrom={values.joinedFrom ?? ""}
          filterJoinedTo={values.joinedTo ?? ""}
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
        initialMembership={values.membership ?? ""}
        initialState={values.state ?? ""}
        isExporting={exporting}
      />
    </>
  );
}
