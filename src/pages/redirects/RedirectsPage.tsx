import { useState, useRef, useCallback, useMemo } from "react";
import PageMeta from "../../components/common/PageMeta";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import { ConfirmDeleteModal } from "../../components/ui/modal/ConfirmDeleteModal";
import { Modal } from "../../components/ui/modal";
import Label from "../../components/form/Label";
import Input from "../../components/form/input/InputField";
import { DataTable, type DataTableRef } from "../../components/tables/data-table/DataTable";
import { PencilIcon, TrashBinIcon } from "../../icons";
import { useModal } from "../../hooks/useModal";
import { RequirePermission } from "../../components/auth/RequirePermission";
import { PERM_REDIRECTS_CREATE, PERM_REDIRECTS_EDIT, PERM_REDIRECTS_DELETE } from "../../constants/permissions";
import {
  fetchRedirects,
  createRedirect,
  updateRedirect,
  deleteRedirect,
  type Redirect,
} from "../../api/redirects";
import { withClientPagination } from "../../utils/dataTableUtils";

const fetchRedirectsPaginated = withClientPagination(fetchRedirects, ["old_path", "new_path"]);

const emptyForm = { old_path: "", new_path: "", redirect_type: "301" as "301" | "302", is_active: true };

export default function RedirectsPage() {
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Redirect | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [saveLoading, setSaveLoading] = useState(false);
  const dataTableRef = useRef<DataTableRef>(null);
  const [deleteTarget, setDeleteTarget] = useState<Redirect | null>(null);
  const [deleting, setDeleting] = useState(false);
  const { isOpen: isDeleteModalOpen, openModal: openDeleteModal, closeModal: closeDeleteModal } = useModal();

  const modalTitle = useMemo(() => (editing ? "Edit redirect" : "Add redirect"), [editing]);

  const openCreate = () => {
    setEditing(null);
    setForm(emptyForm);
    setFormOpen(true);
  };

  const openEdit = (row: Redirect) => {
    setEditing(row);
    setForm({
      old_path: row.old_path,
      new_path: row.new_path,
      redirect_type: row.redirect_type,
      is_active: row.is_active,
    });
    setFormOpen(true);
  };

  const closeForm = () => {
    setFormOpen(false);
    setEditing(null);
    setForm(emptyForm);
  };

  const handleSave = async () => {
    const old_path = form.old_path.trim();
    const new_path = form.new_path.trim();
    if (!old_path || !new_path) {
      alert("Old path and new path are required.");
      return;
    }
    setSaveLoading(true);
    try {
      if (editing) {
        await updateRedirect(editing.id, {
          old_path,
          new_path,
          redirect_type: form.redirect_type,
          is_active: form.is_active,
        });
      } else {
        await createRedirect({
          old_path,
          new_path,
          redirect_type: form.redirect_type,
          is_active: form.is_active,
        });
      }
      alert("Redirect saved successfully!");
      dataTableRef.current?.refetch();
      closeForm();
    } catch (err: unknown) {
      console.error(err);
      const msg =
        err && typeof err === "object" && "response" in err
          ? (err as { response?: { data?: { message?: string } } }).response?.data?.message
          : undefined;
      alert(msg || "Failed to save redirect");
    } finally {
      setSaveLoading(false);
    }
  };

  const handleDeleteClick = useCallback(
    (row: Redirect) => {
      setDeleteTarget(row);
      openDeleteModal();
    },
    [openDeleteModal],
  );

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await deleteRedirect(deleteTarget.id);
      dataTableRef.current?.refetch();
      setDeleteTarget(null);
      closeDeleteModal();
    } catch (err: unknown) {
      console.error(err);
      alert(
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
          "Failed to delete redirect",
      );
    } finally {
      setDeleting(false);
    }
  };

  const columns = [
    {
      key: "old_path",
      header: "Old URL",
      sortable: true,
      render: (row: Redirect) => (
        <code className="text-theme-sm text-gray-600 dark:text-gray-300">{row.old_path}</code>
      ),
    },
    {
      key: "new_path",
      header: "Redirects to",
      sortable: true,
      render: (row: Redirect) => (
        <code className="text-theme-sm text-gray-600 dark:text-gray-300">{row.new_path}</code>
      ),
    },
    {
      key: "redirect_type",
      header: "Type",
      sortable: true,
      render: (row: Redirect) => (
        <span className="text-gray-600 dark:text-gray-400">{row.redirect_type}</span>
      ),
    },
    {
      key: "is_active",
      header: "Active",
      sortable: true,
      render: (row: Redirect) => (
        <span
          className={
            row.is_active
              ? "rounded-full bg-success-50 px-2 py-0.5 text-xs font-medium text-success-700 dark:bg-success-500/10 dark:text-success-400"
              : "rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-600 dark:bg-gray-800 dark:text-gray-400"
          }
        >
          {row.is_active ? "Active" : "Disabled"}
        </span>
      ),
    },
    {
      key: "actions",
      header: "Actions",
      align: "end" as const,
      sortable: false,
      render: (row: Redirect) => (
        <div className="flex items-center justify-end gap-2">
          <RequirePermission permissions={[PERM_REDIRECTS_EDIT]} fallback={null}>
            <button
              type="button"
              onClick={() => openEdit(row)}
              className="inline-flex items-center justify-center gap-1.5 rounded-lg px-2.5 py-2 text-sm text-gray-600 transition hover:bg-gray-100 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-white"
              title="Edit"
            >
              <PencilIcon className="size-4 shrink-0 fill-current" />
              Edit
            </button>
          </RequirePermission>
          <RequirePermission permissions={[PERM_REDIRECTS_DELETE]} fallback={null}>
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
        title="Redirects | StudyCafe Admin"
        description="Manage old URL to new URL redirects for the public website."
      />
      <PageBreadcrumb
        pageTitle="Redirects"
        actions={
          <RequirePermission permissions={[PERM_REDIRECTS_CREATE]} fallback={null}>
            <button
              type="button"
              onClick={openCreate}
              className="inline-flex items-center justify-center gap-2 rounded-lg px-4 py-3 text-sm font-medium text-white transition bg-brand-500 shadow-theme-xs hover:bg-brand-600"
            >
              Add redirect
            </button>
          </RequirePermission>
        }
      />

      <p className="mb-4 text-sm text-gray-500 dark:text-gray-400">
        Requests to <b>Old URL</b> on the public site are redirected to <b>Redirects to</b>. Paths should match how
        the browser sees them on the live site (e.g. <code>/old-page</code>).
      </p>

      <div className="space-y-6">
        <DataTable<Redirect>
          ref={dataTableRef}
          columns={columns}
          fetchData={fetchRedirectsPaginated}
          initialPageSize={20}
          initialSortBy="id"
          initialSortOrder="DESC"
          pageSizeOptions={[10, 20, 50, 100]}
          enableSearch
          enableSorting
          enablePagination
          searchPlaceholder="Search old or new URLs…"
          emptyMessage="No redirects defined. Click Add redirect to create one."
        />
      </div>

      <Modal
        isOpen={formOpen}
        onClose={() => {
          if (!saveLoading) closeForm();
        }}
        className="dark:bg-gray-900 p-4 sm:p-6 max-w-lg"
      >
        <div className="p-6 pr-14">
          <h2 className="mb-4 text-xl font-semibold text-gray-800 dark:text-white">{modalTitle}</h2>
          <div className="space-y-4">
            <div>
              <Label>
                Old URL <span className="text-error-500">*</span>
              </Label>
              <Input
                value={form.old_path}
                onChange={(e) => setForm((f) => ({ ...f, old_path: e.target.value }))}
                placeholder="/old-page"
                disabled={saveLoading}
              />
            </div>
            <div>
              <Label>
                Redirects to <span className="text-error-500">*</span>
              </Label>
              <Input
                value={form.new_path}
                onChange={(e) => setForm((f) => ({ ...f, new_path: e.target.value }))}
                placeholder="/new-page or https://external-url.com"
                disabled={saveLoading}
              />
            </div>
            <div>
              <Label>Redirect type</Label>
              <select
                className="h-11 w-full appearance-none rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 pr-11 text-sm shadow-theme-xs focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:focus:border-brand-800"
                value={form.redirect_type}
                onChange={(e) => setForm((f) => ({ ...f, redirect_type: e.target.value as "301" | "302" }))}
                disabled={saveLoading}
              >
                <option value="301">301 — Permanent</option>
                <option value="302">302 — Temporary</option>
              </select>
            </div>
            <div>
              <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
                <input
                  type="checkbox"
                  checked={form.is_active}
                  onChange={(e) => setForm((f) => ({ ...f, is_active: e.target.checked }))}
                  disabled={saveLoading}
                  className="size-4 rounded border-gray-300 text-brand-500 focus:ring-brand-500"
                />
                Active
              </label>
            </div>
          </div>
          <div className="mt-6 flex gap-3">
            <button
              type="button"
              disabled={saveLoading}
              onClick={handleSave}
              className="rounded-lg bg-brand-500 px-4 py-2.5 text-sm font-medium text-white hover:bg-brand-600 disabled:opacity-50"
            >
              {saveLoading ? "Saving…" : "Save"}
            </button>
            <button
              type="button"
              disabled={saveLoading}
              onClick={closeForm}
              className="rounded-lg border border-gray-200 px-4 py-2.5 text-sm dark:border-gray-700"
            >
              Cancel
            </button>
          </div>
        </div>
      </Modal>

      <ConfirmDeleteModal
        isOpen={isDeleteModalOpen}
        onClose={() => {
          setDeleteTarget(null);
          closeDeleteModal();
        }}
        onConfirm={handleDeleteConfirm}
        title="Delete redirect"
        itemName={deleteTarget?.old_path}
        isLoading={deleting}
      />
    </>
  );
}
