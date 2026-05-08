import { useRef, useState } from "react";
import { Link } from "react-router";
import PageMeta from "../../components/common/PageMeta";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import { ConfirmDeleteModal } from "../../components/ui/modal/ConfirmDeleteModal";
import { useModal } from "../../hooks/useModal";
import { RequirePermission } from "../../components/auth/RequirePermission";
import { AccessDenied } from "../../components/auth/AccessDenied";
import { PERM_ARTICLES_LIST, PERM_ARTICLES_CREATE } from "../../constants/permissions";
import { articlesApi, type ArticleRecord } from "../../api/articles";
import { ArticlesTable } from "../../components/tables";
import type { DataTableRef } from "../../components/tables/data-table";
import { FilterBar, useFilterState } from "../../components/filters";
import type { FilterFieldDef } from "../../components/filters";

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
  const { values, set, reset, hasActive } = useFilterState();

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
        />
        <ArticlesTable
          ref={tableRef}
          onDeleteClick={handleDeleteClick}
          filterStatus={values.status ?? ""}
        />
      </div>

      <ConfirmDeleteModal
        isOpen={isDeleteModalOpen}
        onClose={handleDeleteCancel}
        onConfirm={handleDeleteConfirm}
        title="Delete Article"
        itemName={deleteTarget?.title}
      />
    </>
  );
}
