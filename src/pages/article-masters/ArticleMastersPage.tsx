import { useCallback, useMemo, useRef, useState } from "react";
import { Link, Navigate, useParams } from "react-router";
import PageMeta from "../../components/common/PageMeta";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import { ConfirmDeleteModal } from "../../components/ui/modal/ConfirmDeleteModal";
import { DataTable, type DataTableRef } from "../../components/tables/data-table/DataTable";
import { PencilIcon, TrashBinIcon } from "../../icons";
import { useModal } from "../../hooks/useModal";
import { RequirePermission } from "../../components/auth/RequirePermission";
import {
  MASTER_KINDS,
  createMasterFetchPaginated,
  getMasterApi,
  getMasterKindConfig,
  type MasterKind,
  type MasterTermRecord,
} from "../../api/articleMasters";

function MasterTabNav({ activeKind }: { activeKind: MasterKind }) {
  return (
    <div className="flex flex-wrap gap-2 border-b border-gray-200 pb-3 dark:border-gray-800">
      {MASTER_KINDS.map((config) => {
        const isActive = config.kind === activeKind;
        return (
          <Link
            key={config.kind}
            to={config.listPath}
            className={`rounded-lg px-4 py-2 text-sm font-medium transition ${
              isActive
                ? "bg-brand-500 text-white shadow-theme-xs"
                : "text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800"
            }`}
          >
            {config.label}
          </Link>
        );
      })}
    </div>
  );
}

export default function ArticleMastersPage() {
  const { kind: kindParam } = useParams<{ kind: string }>();
  const config = getMasterKindConfig(kindParam);

  if (!config) {
    return <Navigate to="/article-masters/tags" replace />;
  }

  const [deleteTarget, setDeleteTarget] = useState<MasterTermRecord | null>(null);
  const [deleting, setDeleting] = useState(false);
  const { isOpen: isDeleteModalOpen, openModal: openDeleteModal, closeModal: closeDeleteModal } = useModal();
  const dataTableRef = useRef<DataTableRef>(null);

  const masterApi = useMemo(() => getMasterApi(config.kind), [config.kind]);
  const fetchData = useMemo(() => createMasterFetchPaginated(config.kind), [config.kind]);

  const handleDeleteClick = useCallback(
    (row: MasterTermRecord) => {
      setDeleteTarget(row);
      openDeleteModal();
    },
    [openDeleteModal],
  );

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await masterApi.delete(deleteTarget.id);
      dataTableRef.current?.refetch();
      setDeleteTarget(null);
      closeDeleteModal();
    } catch (err: unknown) {
      console.error(`Failed to delete ${config.labelSingular.toLowerCase()}`, err);
      alert((err as { response?: { data?: { message?: string } } })?.response?.data?.message || `Failed to delete ${config.labelSingular.toLowerCase()}`);
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
      render: (row: MasterTermRecord) => (
        <span className="font-medium text-gray-800 text-theme-sm dark:text-white/90">{row.name}</span>
      ),
    },
    {
      key: "slug",
      header: "Slug",
      sortable: true,
      render: (row: MasterTermRecord) => (
        <span className="text-gray-500 text-theme-sm dark:text-gray-400">{row.slug || "—"}</span>
      ),
    },
    {
      key: "actions",
      header: "Actions",
      align: "end" as const,
      sortable: false,
      render: (row: MasterTermRecord) => (
        <div className="flex items-center justify-end gap-2">
          <RequirePermission permissions={["articles:edit"]} fallback={null}>
            <Link
              to={`/article-masters/${config.kind}/${row.id}/edit`}
              className="inline-flex items-center justify-center gap-1.5 rounded-lg px-2.5 py-2 text-sm text-gray-600 transition hover:bg-gray-100 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-white"
              title="Edit"
            >
              <PencilIcon className="size-4 shrink-0 fill-current" />
              Edit
            </Link>
          </RequirePermission>
          <RequirePermission permissions={["articles:delete"]} fallback={null}>
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
        title={`${config.label} | Article Masters | StudyCafe Admin`}
        description={`Manage article ${config.label.toLowerCase()}`}
      />
      <PageBreadcrumb
        pageTitle="Article Masters"
        actions={
          <RequirePermission permissions={["articles:create"]} fallback={null}>
            <Link
              to={`/article-masters/${config.kind}/create`}
              className="inline-flex items-center justify-center gap-2 rounded-lg px-4 py-3 text-sm font-medium text-white transition bg-brand-500 shadow-theme-xs hover:bg-brand-600"
            >
              Create {config.labelSingular}
            </Link>
          </RequirePermission>
        }
      />
      <div className="space-y-6">
        <MasterTabNav activeKind={config.kind} />
        <DataTable<MasterTermRecord>
          ref={dataTableRef}
          columns={columns}
          fetchData={fetchData}
          initialPageSize={10}
          pageSizeOptions={[10, 20, 50, 100]}
          initialSortBy="id"
          initialSortOrder="DESC"
          enableSearch
          enableSorting
          enablePagination
          searchPlaceholder={`Search ${config.label.toLowerCase()}…`}
          emptyMessage={`No ${config.label.toLowerCase()} found.`}
        />
      </div>

      <ConfirmDeleteModal
        isOpen={isDeleteModalOpen}
        onClose={handleDeleteCancel}
        onConfirm={handleDeleteConfirm}
        title={`Delete ${config.labelSingular}`}
        itemName={deleteTarget?.name}
        isLoading={deleting}
        message="This will remove the term from all linked articles. Articles themselves will not be deleted."
      />
    </>
  );
}
