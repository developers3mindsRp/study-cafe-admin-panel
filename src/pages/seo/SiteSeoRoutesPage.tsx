import { useState, useRef, useCallback, useMemo } from "react";
import { Link } from "react-router";
import PageMeta from "../../components/common/PageMeta";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import BackLink from "../../components/common/BackLink";
import { ConfirmDeleteModal } from "../../components/ui/modal/ConfirmDeleteModal";
import { Modal } from "../../components/ui/modal";
import Label from "../../components/form/Label";
import Input from "../../components/form/input/InputField";
import { DataTable, type DataTableRef } from "../../components/tables/data-table/DataTable";
import { PencilIcon, TrashBinIcon } from "../../icons";
import { useModal } from "../../hooks/useModal";
import { RequirePermission } from "../../components/auth/RequirePermission";
import { PERM_SEO_EDIT, PERM_SEO_DELETE } from "../../constants/permissions";
import {
  fetchSiteSeoRoutes,
  createSiteSeoRoute,
  updateSiteSeoRoute,
  deleteSiteSeoRoute,
  type SiteSeoRoute,
} from "../../api/siteSeoRoutes";
import { withClientPagination } from "../../utils/dataTableUtils";
import { getWebsiteUrl } from "../../config/env";
import { WebsiteViewLink } from "../../components/common/WebsiteLink";

const WEBSITE_URL = getWebsiteUrl();

const fetchRoutesPaginated = withClientPagination(
  fetchSiteSeoRoutes,
  ["path", "label"],
);

const emptyForm = { path: "", label: "", sort_order: "0" };

export default function SiteSeoRoutesPage() {
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<SiteSeoRoute | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [saveLoading, setSaveLoading] = useState(false);
  const dataTableRef = useRef<DataTableRef>(null);
  const [deleteTarget, setDeleteTarget] = useState<SiteSeoRoute | null>(null);
  const [deleting, setDeleting] = useState(false);
  const { isOpen: isDeleteModalOpen, openModal: openDeleteModal, closeModal: closeDeleteModal } = useModal();

  const modalTitle = useMemo(
    () => (editing ? "Edit site page / URL" : "Add site page / URL"),
    [editing],
  );

  const openCreate = () => {
    setEditing(null);
    setForm(emptyForm);
    setFormOpen(true);
  };

  const openEdit = (row: SiteSeoRoute) => {
    setEditing(row);
    setForm({
      path: row.path,
      label: row.label,
      sort_order: String(row.sort_order ?? 0),
    });
    setFormOpen(true);
  };

  const closeForm = () => {
    setFormOpen(false);
    setEditing(null);
    setForm(emptyForm);
  };

  const handleSave = async () => {
    const path = form.path.trim();
    const label = form.label.trim();
    const sort_order = Math.max(0, parseInt(form.sort_order, 10) || 0);
    if (!path || !label) {
      alert("Path and label are required.");
      return;
    }
    setSaveLoading(true);
    try {
      if (editing) {
        await updateSiteSeoRoute(editing.id, { path, label, sort_order });
      } else {
        await createSiteSeoRoute({ path, label, sort_order });
      }
      dataTableRef.current?.refetch();
      closeForm();
    } catch (err: unknown) {
      console.error(err);
      const msg =
        err && typeof err === "object" && "response" in err
          ? (err as { response?: { data?: { message?: string } } }).response?.data?.message
          : undefined;
      alert(msg || "Failed to save route");
    } finally {
      setSaveLoading(false);
    }
  };

  const handleDeleteClick = useCallback((row: SiteSeoRoute) => {
    setDeleteTarget(row);
    openDeleteModal();
  }, [openDeleteModal]);

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await deleteSiteSeoRoute(deleteTarget.id);
      dataTableRef.current?.refetch();
      setDeleteTarget(null);
      closeDeleteModal();
    } catch (err: unknown) {
      console.error(err);
      alert(
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message
          || "Failed to delete route",
      );
    } finally {
      setDeleting(false);
    }
  };

  const columns = [
    {
      key: "sort_order",
      header: "Order",
      sortable: true,
      render: (row: SiteSeoRoute) => (
        <span className="text-gray-600 dark:text-gray-400">{row.sort_order}</span>
      ),
    },
    {
      key: "label",
      header: "Label",
      sortable: true,
      render: (row: SiteSeoRoute) => (
        <span className="font-medium text-gray-800 text-theme-sm dark:text-white/90">
          {row.label}
        </span>
      ),
    },
    {
      key: "path",
      header: "URL path",
      sortable: true,
      render: (row: SiteSeoRoute) => (
        <code className="text-theme-sm text-gray-600 dark:text-gray-300">{row.path}</code>
      ),
    },
    {
      key: "actions",
      header: "Actions",
      align: "end" as const,
      sortable: false,
      render: (row: SiteSeoRoute) => (
        <div className="flex items-center justify-end gap-2">
          <WebsiteViewLink
            href={`${WEBSITE_URL}${row.path.startsWith("/") ? row.path : "/" + row.path}`}
            title={`Open ${row.path} on Website`}
          />
          <RequirePermission permissions={[PERM_SEO_EDIT]} fallback={null}>
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
          <RequirePermission permissions={[PERM_SEO_DELETE]} fallback={null}>
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
        title="Site pages (URLs) | StudyCafe Admin"
        description="Master list of site paths used for SEO metadata and admin pickers."
      />
      <PageBreadcrumb
        pageTitle="Site pages (URLs)"
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <BackLink to="/seo-metadata">SEO metadata list</BackLink>
            <RequirePermission permissions={[PERM_SEO_EDIT]} fallback={null}>
              <button
                type="button"
                onClick={openCreate}
                className="inline-flex items-center justify-center gap-2 rounded-lg px-4 py-3 text-sm font-medium text-white transition bg-brand-500 shadow-theme-xs hover:bg-brand-600"
              >
                Add path
              </button>
            </RequirePermission>
          </div>
        }
      />

      <p className="mb-4 text-sm text-gray-500 dark:text-gray-400">
        These URLs power the dropdown when{' '}
        <Link className="text-brand-600 hover:underline" to="/seo-metadata/create">
          creating SEO metadata
        </Link>
        . Paths should match how the browser sees them on the live site (e.g.{' '}
        <code>/All-courses</code>
        ).
      </p>

      <div className="space-y-6">
        <DataTable<SiteSeoRoute>
          ref={dataTableRef}
          columns={columns}
          fetchData={fetchRoutesPaginated}
          initialPageSize={20}
          initialSortBy="sort_order"
          initialSortOrder="ASC"
          pageSizeOptions={[10, 20, 50, 100]}
          enableSearch
          enableSorting
          enablePagination
          searchPlaceholder="Search paths or labels…"
          emptyMessage="No routes defined. Run API seed script or click Add path."
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
          <h2 className="mb-4 text-xl font-semibold text-gray-800 dark:text-white">
            {modalTitle}
          </h2>
          <div className="space-y-4">
            <div>
              <Label>
                URL path <span className="text-error-500">*</span>
              </Label>
              <Input
                value={form.path}
                onChange={(e) =>
                  setForm((f) => ({ ...f, path: e.target.value }))
                }
                placeholder="/about or / for home"
                disabled={saveLoading}
              />
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                Use the same casing as live URLs (e.g.{' '}
                <code>/All-courses</code>
                ); a leading slash is added when missing except for home (<code>/</code>).
              </p>
            </div>
            <div>
              <Label>
                Display label <span className="text-error-500">*</span>
              </Label>
              <Input
                value={form.label}
                onChange={(e) =>
                  setForm((f) => ({ ...f, label: e.target.value }))
                }
                placeholder="About us"
                disabled={saveLoading}
              />
            </div>
            <div>
              <Label>Sort order</Label>
              <Input
                type="number"
                min={0}
                value={form.sort_order}
                onChange={(e) =>
                  setForm((f) => ({ ...f, sort_order: e.target.value }))
                }
                disabled={saveLoading}
              />
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                Lower numbers appear earlier in dropdowns (then path A–Z).
              </p>
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
        title="Delete site route"
        itemName={deleteTarget?.path}
        isLoading={deleting}
      />
    </>
  );
}
