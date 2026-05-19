import { useCallback, useRef, useState } from "react";
import { Link } from "react-router";
import PageMeta from "../../components/common/PageMeta";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import { ConfirmDeleteModal } from "../../components/ui/modal/ConfirmDeleteModal";
import { useModal } from "../../hooks/useModal";
import { RequirePermission } from "../../components/auth/RequirePermission";
import { AccessDenied } from "../../components/auth/AccessDenied";
import { PERM_ARTICLES_LIST, PERM_ARTICLES_CREATE } from "../../constants/permissions";
import {
  articlesApi,
  fetchAllArticlesForExport,
  fetchArticleCategories,
  type ArticleRecord,
} from "../../api/articles";
import { ArticlesTable } from "../../components/tables";
import type { DataTableRef } from "../../components/tables/data-table";
import { FilterBar, useFilterState } from "../../components/filters";
import type { FilterFieldDef } from "../../components/filters";
import { exportRowsToExcel } from "../../utils/exportToExcel";
import { ARTICLE_EXPORT_COLUMNS } from "../../utils/articleExportColumns";
import { ArticleExportModal } from "./components/ArticleExportModal";
import Button from "../../components/ui/button/Button";
import { DownloadIcon } from "../../icons";

const articleFilterFields: FilterFieldDef[] = [
  {
    type: "select",
    id: "status",
    label: "Status",
    placeholder: "All statuses",
    options: [
      { value: "publish", label: "Published" },
      { value: "scheduled", label: "Scheduled" },
      { value: "draft", label: "Draft" },
    ],
  },
  {
    type: "async-select",
    id: "category_id",
    label: "Category",
    placeholder: "All categories",
    loader: async () => {
      const cats = await fetchArticleCategories();
      return cats.map((c) => ({ value: String(c.id), label: c.name }));
    },
  },
  {
    type: "select",
    id: "blog_access_tier",
    label: "Access Tier",
    placeholder: "All tiers",
    options: [
      { value: "free", label: "Free" },
      { value: "premium", label: "Premium" },
    ],
  },
  {
    type: "date-range",
    id: "created_at",
    label: "Created Date",
    fromId: "date_from",
    toId: "date_to",
  },
];

export default function ArticleList() {
  return (
    <RequirePermission
      permissions={[PERM_ARTICLES_LIST]}
      fallback={<AccessDenied />}
    >
      <ArticleListContent />
    </RequirePermission>
  );
}

function ArticleListContent() {
  const tableRef = useRef<DataTableRef>(null);
  const [deleteTarget, setDeleteTarget] = useState<ArticleRecord | null>(null);
  const { isOpen: isDeleteModalOpen, openModal: openDeleteModal, closeModal: closeDeleteModal } = useModal();
  const { isOpen: isExportModalOpen, openModal: openExportModal, closeModal: closeExportModal } = useModal();
  const { values, set, reset, hasActive } = useFilterState();
  const [exporting, setExporting] = useState(false);

  const handleDeleteClick = (article: ArticleRecord) => {
    setDeleteTarget(article);
    openDeleteModal();
  };

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    try {
      await articlesApi.delete(deleteTarget.id);
      setDeleteTarget(null);
      closeDeleteModal();
      await tableRef.current?.refetch();
    } catch (err) {
      console.error("Failed to delete article", err);
      alert("Failed to delete article");
    }
  };

  const handleDeleteCancel = () => {
    setDeleteTarget(null);
    closeDeleteModal();
  };

  const handleExportConfirm = useCallback(async () => {
    setExporting(true);
    try {
      const q = tableRef.current?.getQueryState();
      const rows = await fetchAllArticlesForExport({
        status: values.status || undefined,
        category_id: values.category_id || undefined,
        blog_access_tier: values.blog_access_tier || undefined,
        date_from: values.date_from || undefined,
        date_to: values.date_to || undefined,
        search: q?.search ?? "",
        sortBy: q?.sortBy ?? "created_at",
        sortOrder: q?.sortOrder ?? "DESC",
      });
      const datePart = new Date().toISOString().slice(0, 10);
      const filteredPart = hasActive || (q?.search ?? "").trim() ? "-filtered" : "";
      exportRowsToExcel({
        filename: `articles-export-${datePart}${filteredPart}`,
        sheetName: "Articles",
        columns: ARTICLE_EXPORT_COLUMNS,
        rows,
      });
      closeExportModal();
    } catch (err: unknown) {
      const msg =
        err && typeof err === "object" && "response" in err
          ? (err as { response?: { data?: { message?: string } } }).response?.data?.message
          : err instanceof Error
            ? err.message
            : "Export failed";
      alert(msg ?? "Export failed");
    } finally {
      setExporting(false);
    }
  }, [values, hasActive, closeExportModal]);

  return (
    <>
      <PageMeta
        title="Articles | StudyCafe Admin"
        description="Manage articles for studycafe.in"
      />
      <PageBreadcrumb
        pageTitle="Articles"
        actions={
          <RequirePermission permissions={[PERM_ARTICLES_CREATE]} fallback={null}>
            <Link
              to="/articles/create"
              className="inline-flex items-center justify-center gap-2 rounded-lg px-4 py-3 text-sm font-medium text-white transition bg-brand-500 shadow-theme-xs hover:bg-brand-600"
            >
              Create New
            </Link>
          </RequirePermission>
        }
      />
      <div className="space-y-6">
        <FilterBar
          fields={articleFilterFields}
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
              onClick={openExportModal}
            >
              {hasActive ? "Export filtered" : "Export Excel"}
            </Button>
          }
        />
        <ArticlesTable
          ref={tableRef}
          onDeleteClick={handleDeleteClick}
          filterStatus={values.status ?? ""}
          filterCategoryId={values.category_id ?? ""}
          filterAccessTier={values.blog_access_tier ?? ""}
          filterDateFrom={values.date_from ?? ""}
          filterDateTo={values.date_to ?? ""}
        />
      </div>

      <ConfirmDeleteModal
        isOpen={isDeleteModalOpen}
        onClose={handleDeleteCancel}
        onConfirm={handleDeleteConfirm}
        title="Delete Article"
        itemName={deleteTarget?.title}
      />

      <ArticleExportModal
        isOpen={isExportModalOpen}
        onClose={closeExportModal}
        onConfirm={handleExportConfirm}
        isExporting={exporting}
        hasActiveFilters={hasActive}
      />
    </>
  );
}
