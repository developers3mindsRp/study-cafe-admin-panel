/**
 * Articles table using the reusable DataTable with server-side pagination, sort, and search.
 */

import { forwardRef } from "react";
import { Link } from "react-router";
import { DataTable, type DataTableRef } from "./data-table";
import Badge from "../ui/badge/Badge";
import { EyeIcon, PencilIcon, TrashBinIcon } from "../../icons";
import { RequirePermission } from "../auth/RequirePermission";
import {
  PERM_ARTICLES_EDIT,
  PERM_ARTICLES_DELETE,
} from "../../constants/permissions";
import { decodeSlugForDisplay } from "../../lib/slug";
import { fetchArticlesPaginated, type ArticleRecord } from "../../api/articles";

export interface ArticlesTableProps {
  onDeleteClick?: (article: ArticleRecord) => void;
}

const statusColor = (status: string) =>
  status === "publish" || status === "published"
    ? "success"
    : status === "draft"
      ? "warning"
      : "error";

const statusLabel = (status: string) =>
  status === "publish" || status === "published"
    ? "Published"
    : status === "draft"
      ? "Draft"
      : status || "—";

export const ArticlesTable = forwardRef<DataTableRef, ArticlesTableProps>(
  function ArticlesTable({ onDeleteClick }, ref) {
    const columns = [
      {
        key: "image",
        header: "Image",
        sortable: false,
        render: (row: ArticleRecord) => (
          <div className="h-10 w-16 overflow-hidden rounded bg-gray-100 dark:bg-gray-800">
            {row.thumbnail_url ? (
              <img
                src={row.thumbnail_url}
                alt={row.title}
                className="h-full w-full object-cover"
                referrerPolicy="no-referrer"
                loading="lazy"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-xs text-gray-400">
                No IMG
              </div>
            )}
          </div>
        ),
      },
      {
        key: "title",
        header: "Title",
        sortable: true,
        render: (row: ArticleRecord) => (
          <div>
            <span className="block font-medium text-gray-800 text-theme-sm dark:text-white/90">
              {row.title}
            </span>
            <span className="block text-gray-500 text-theme-xs dark:text-gray-400">
              /{decodeSlugForDisplay(row.slug) || row.id}
            </span>
          </div>
        ),
      },
      {
        key: "author_name",
        header: "Author",
        sortable: false,
        render: (row: ArticleRecord) => row.author_name ?? "—",
      },
      {
        key: "status",
        header: "Status",
        sortable: true,
        render: (row: ArticleRecord) => (
          <Badge size="sm" color={statusColor(row.status)}>
            {statusLabel(row.status)}
          </Badge>
        ),
      },
      {
        key: "blog_access_tier",
        header: "Blog",
        sortable: false,
        render: (row: ArticleRecord) =>
          row.blog_access_tier === "premium" ? (
            <Badge size="sm" color="warning">
              Premium
            </Badge>
          ) : (
            <Badge size="sm" color="light">
              Free
            </Badge>
          ),
      },
      {
        key: "created_at",
        header: "Created At",
        sortable: true,
        render: (row: ArticleRecord) =>
          row.created_at
            ? new Date(row.created_at).toLocaleDateString()
            : "—",
      },
      {
        key: "actions",
        header: "Actions",
        align: "end" as const,
        sortable: false,
        render: (row: ArticleRecord) => (
          <div className="flex items-center justify-end gap-2">
            <Link
              to={`/articles/${row.id}`}
              className="inline-flex items-center justify-center gap-1.5 rounded-lg px-2.5 py-2 text-sm text-gray-600 transition hover:bg-gray-100 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-white"
              title="View"
            >
              <EyeIcon className="size-4 shrink-0 fill-current" />
              View
            </Link>
            <RequirePermission permissions={[PERM_ARTICLES_EDIT]} fallback={null}>
              <Link
                to={`/articles/${row.id}/edit`}
                className="inline-flex items-center justify-center gap-1.5 rounded-lg px-2.5 py-2 text-sm text-gray-600 transition hover:bg-gray-100 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-white"
                title="Edit"
              >
                <PencilIcon className="size-4 shrink-0 fill-current" />
                Edit
              </Link>
            </RequirePermission>
            <RequirePermission permissions={[PERM_ARTICLES_DELETE]} fallback={null}>
              <button
                type="button"
                onClick={() => onDeleteClick?.(row)}
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
      <DataTable<ArticleRecord>
        ref={ref}
        columns={columns}
        fetchData={fetchArticlesPaginated}
        initialPageSize={10}
        initialSortBy="created_at"
        initialSortOrder="DESC"
        pageSizeOptions={[10, 20, 50, 100]}
        enableSearch
        enableSorting
        enablePagination
        searchPlaceholder="Search articles…"
        emptyMessage="No articles yet."
      />
    );
  }
);
