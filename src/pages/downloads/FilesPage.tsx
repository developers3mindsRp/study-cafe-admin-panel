import { useState, useRef, useCallback, useEffect } from "react";
import PageMeta from "../../components/common/PageMeta";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import { DataTable, type DataTableRef } from "../../components/tables/data-table/DataTable";
import { ConfirmDeleteModal } from "../../components/ui/modal/ConfirmDeleteModal";
import { PencilIcon, TrashBinIcon } from "../../icons";
import { useModal } from "../../hooks/useModal";
import {
  downloadFilesApi,
  downloadCategoriesApi,
  fetchFilesPaginated,
  type DownloadFile,
  type DownloadCategory,
  type CreateFilePayload,
} from "../../api/downloads";
import FileForm from "../../components/downloads/FileForm";

function formatDate(dateStr: string | null | undefined): string {
  if (!dateStr) return "—";
  try {
    return new Date(dateStr).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  } catch {
    return dateStr;
  }
}

function CopyUrlButton({ url }: { url: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // fallback for older browsers
      const el = document.createElement("textarea");
      el.value = url;
      document.body.appendChild(el);
      el.select();
      document.execCommand("copy");
      document.body.removeChild(el);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <button
      type="button"
      onClick={handleCopy}
      title={copied ? "Copied!" : "Copy file URL"}
      className={`inline-flex items-center justify-center gap-1.5 rounded-lg px-2.5 py-2 text-sm transition ${
        copied
          ? "bg-success-50 text-success-600 dark:bg-success-500/10 dark:text-success-400"
          : "text-gray-600 hover:bg-gray-100 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-white"
      }`}
    >
      {copied ? (
        <>
          <svg className="size-4 shrink-0" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
          </svg>
          Copied
        </>
      ) : (
        <>
          <svg className="size-4 shrink-0" viewBox="0 0 20 20" fill="currentColor">
            <path d="M8 3a1 1 0 011-1h2a1 1 0 110 2H9a1 1 0 01-1-1z" />
            <path d="M6 3a2 2 0 00-2 2v11a2 2 0 002 2h8a2 2 0 002-2V5a2 2 0 00-2-2 3 3 0 01-3 3H9a3 3 0 01-3-3z" />
          </svg>
          Copy URL
        </>
      )}
    </button>
  );
}

export default function FilesPage() {
  const dataTableRef = useRef<DataTableRef>(null);
  const [categories, setCategories] = useState<DownloadCategory[]>([]);
  const [editTarget, setEditTarget] = useState<DownloadFile | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<DownloadFile | null>(null);
  const [deleting, setDeleting] = useState(false);

  const { isOpen: isFormOpen, openModal: openForm, closeModal: closeForm } = useModal();
  const { isOpen: isDeleteOpen, openModal: openDelete, closeModal: closeDelete } = useModal();

  // Load categories for the form dropdowns
  useEffect(() => {
    downloadCategoriesApi.listAll().then(setCategories).catch(console.error);
  }, []);

  const handleAddClick = useCallback(() => {
    setEditTarget(null);
    openForm();
  }, [openForm]);

  const handleEditClick = useCallback(
    (file: DownloadFile) => {
      setEditTarget(file);
      openForm();
    },
    [openForm]
  );

  const handleDeleteClick = useCallback(
    (file: DownloadFile) => {
      setDeleteTarget(file);
      openDelete();
    },
    [openDelete]
  );

  const handleFormClose = () => {
    setEditTarget(null);
    closeForm();
  };

  const handleSave = async (payload: CreateFilePayload) => {
    if (editTarget) {
      await downloadFilesApi.update(editTarget.id, payload);
    } else {
      await downloadFilesApi.create(payload);
    }
    dataTableRef.current?.refetch();
  };

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await downloadFilesApi.delete(deleteTarget.id);
      dataTableRef.current?.refetch();
      setDeleteTarget(null);
      closeDelete();
    } catch (err: unknown) {
      alert((err as any)?.response?.data?.message ?? "Failed to delete file");
    } finally {
      setDeleting(false);
    }
  };

  const columns = [
    {
      key: "title",
      header: "Title",
      sortable: true,
      render: (row: DownloadFile) => (
        <div className="max-w-xs">
          <p className="font-medium text-gray-800 text-theme-sm dark:text-white/90 line-clamp-2">
            {row.title}
          </p>
          {row.slug && (
            <p className="mt-0.5 font-mono text-xs text-gray-400 truncate">{row.slug}</p>
          )}
        </div>
      ),
    },
    {
      key: "FileCats",
      header: "Categories",
      sortable: false,
      render: (row: DownloadFile) => {
        const cats = row.FileCats ?? [];
        if (cats.length === 0) return <span className="text-gray-400 text-theme-sm">—</span>;
        return (
          <div className="flex flex-wrap gap-1">
            {cats.map((c) => (
              <span
                key={c.id}
                className="inline-flex items-center rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-600 dark:bg-gray-800 dark:text-gray-400"
              >
                {c.name}
              </span>
            ))}
          </div>
        );
      },
    },
    {
      key: "views",
      header: "Views",
      sortable: true,
      render: (row: DownloadFile) => (
        <span className="text-gray-600 text-theme-sm dark:text-gray-400">
          {row.views.toLocaleString()}
        </span>
      ),
    },
    {
      key: "status",
      header: "Status",
      sortable: true,
      render: (row: DownloadFile) => {
        const statusMap = {
          publish: "bg-success-50 text-success-700 dark:bg-success-500/10 dark:text-success-400",
          draft: "bg-warning-50 text-warning-700 dark:bg-warning-500/10 dark:text-warning-400",
          private: "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400",
        };
        return (
          <span
            className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${
              statusMap[row.status] ?? statusMap.draft
            }`}
          >
            {row.status}
          </span>
        );
      },
    },
    {
      key: "created_at",
      header: "Created",
      sortable: true,
      render: (row: DownloadFile) => (
        <span className="whitespace-nowrap text-gray-500 text-theme-sm dark:text-gray-400">
          {formatDate(row.created_at)}
        </span>
      ),
    },
    {
      key: "actions",
      header: "Actions",
      align: "end" as const,
      sortable: false,
      render: (row: DownloadFile) => (
        <div className="flex items-center justify-end gap-1">
          <CopyUrlButton url={row.file_url} />
          <button
            type="button"
            onClick={() => handleEditClick(row)}
            className="inline-flex items-center justify-center gap-1.5 rounded-lg px-2.5 py-2 text-sm text-gray-600 transition hover:bg-gray-100 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-white"
            title="Edit"
          >
            <PencilIcon className="size-4 shrink-0 fill-current" />
            Edit
          </button>
          <button
            type="button"
            onClick={() => handleDeleteClick(row)}
            className="inline-flex items-center justify-center gap-1.5 rounded-lg px-2.5 py-2 text-sm text-gray-600 transition hover:bg-error-50 hover:text-error-500 dark:text-gray-400 dark:hover:bg-error-500/10 dark:hover:text-error-400"
            title="Delete"
          >
            <TrashBinIcon className="size-4 shrink-0 fill-current" />
            Delete
          </button>
        </div>
      ),
    },
  ];

  return (
    <>
      <PageMeta
        title="Downloads | StudyCafe Admin"
        description="Manage downloadable files"
      />
      <PageBreadcrumb
        pageTitle="Downloads"
        actions={
          <button
            type="button"
            onClick={handleAddClick}
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-brand-500 px-4 py-3 text-sm font-medium text-white shadow-theme-xs hover:bg-brand-600"
          >
            Add File
          </button>
        }
      />

      <div className="space-y-6">
        <DataTable<DownloadFile>
          ref={dataTableRef}
          columns={columns}
          fetchData={fetchFilesPaginated}
          initialPageSize={20}
          initialSortBy="created_at"
          initialSortOrder="DESC"
          pageSizeOptions={[10, 20, 50]}
          enableSearch
          enableSorting
          enablePagination
          searchPlaceholder="Search files by title…"
          emptyMessage="No download files found."
        />
      </div>

      <FileForm
        isOpen={isFormOpen}
        onClose={handleFormClose}
        onSave={handleSave}
        initial={editTarget}
        categories={categories}
      />

      <ConfirmDeleteModal
        isOpen={isDeleteOpen}
        onClose={() => { setDeleteTarget(null); closeDelete(); }}
        onConfirm={handleDeleteConfirm}
        title="Delete File"
        itemName={deleteTarget?.title}
        isLoading={deleting}
      />
    </>
  );
}
