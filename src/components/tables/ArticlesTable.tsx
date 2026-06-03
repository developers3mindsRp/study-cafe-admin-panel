/**
 * Articles table using the reusable DataTable with server-side pagination, sort, and search.
 */

import { forwardRef, useCallback } from "react";
import { Link, useNavigate } from "react-router";
import { DataTable, type DataTableRef } from "./data-table";
import Badge from "../ui/badge/Badge";
import { PencilIcon, TrashBinIcon } from "../../icons";
import { RequirePermission } from "../auth/RequirePermission";
import {
  PERM_ARTICLES_EDIT,
  PERM_ARTICLES_DELETE,
} from "../../constants/permissions";
import { decodeSlugForDisplay } from "../../lib/slug";
import {
  articlesApi,
  fetchArticleCategories,
  fetchArticleTypes,
  fetchArticlesPaginated,
  fetchCourts,
  fetchTags,
  type ArticleRecord,
} from "../../api/articles";
import type { DataTableFetchParams, DataTableFetchResult } from "./data-table/DataTable.types";
import { PREVIEW_STATE_KEY } from "../../pages/articles/ArticlePreview";
import type { ArticleFormData } from "../../pages/articles/ArticleForm";
import { getWebsiteUrl } from "../../config/env";
import { WebsiteViewLink, AdminViewLink } from "../common/WebsiteLink";

const WEBSITE_URL = getWebsiteUrl();

export interface ArticlesTableProps {
  onDeleteClick?: (article: ArticleRecord) => void;
  filterStatus?: string;
  filterCategoryId?: string;
  filterAccessTier?: string;
  filterDateFrom?: string;
  filterDateTo?: string;
}

const statusColor = (status: string) =>
  status === "publish" || status === "published"
    ? "success"
    : status === "scheduled"
      ? "primary"
    : status === "draft"
      ? "warning"
      : "error";

const statusLabel = (status: string) =>
  status === "publish" || status === "published"
    ? "Published"
    : status === "scheduled"
      ? "Scheduled"
    : status === "draft"
      ? "Draft"
      : status || "—";

export const ArticlesTable = forwardRef<DataTableRef, ArticlesTableProps>(
  function ArticlesTable(
    {
      onDeleteClick,
      filterStatus = "",
      filterCategoryId = "",
      filterAccessTier = "",
      filterDateFrom = "",
      filterDateTo = "",
    },
    ref
  ) {
    const navigate = useNavigate();

    const fetchData = useCallback(
      (params: DataTableFetchParams): Promise<DataTableFetchResult<ArticleRecord>> =>
        fetchArticlesPaginated({
          ...params,
          ...(filterStatus ? { status: filterStatus } : {}),
          ...(filterCategoryId ? { category_id: filterCategoryId } : {}),
          ...(filterAccessTier ? { blog_access_tier: filterAccessTier } : {}),
          ...(filterDateFrom ? { date_from: filterDateFrom } : {}),
          ...(filterDateTo ? { date_to: filterDateTo } : {}),
        }),
      [filterStatus, filterCategoryId, filterAccessTier, filterDateFrom, filterDateTo]
    );

    const handlePreview = useCallback(async (articleId: number | string) => {
      const article = await articlesApi.get(String(articleId));
      const articleContent =
        article.content ??
        (article as unknown as Record<string, unknown>).content ??
        (article as unknown as Record<string, unknown>).body ??
        "";

      const previewData: ArticleFormData = {
        meta: {
          title: article.title ?? "",
          subHeading: article.sub_heading ?? "",
          description: article.excerpt ?? "",
          metaTitle: article.meta_title ?? "",
          metaDesc: article.meta_description ?? "",
          metaKeywords: article.meta_keywords ?? "",
          slug: decodeSlugForDisplay(article.slug) ?? "", 
        },
        featuredImage: {
          imageUrl: article.thumbnail_url ?? "",
          linkUrl: "",
          alt: "",
          caption: "",
        },
        body: typeof articleContent === "string" ? articleContent : "",
        author: { name: "", role: "", imageUrl: "", bio: "" },
        tagsCommaRaw: "",
        shareEnabled: true,
        status:
          article.status === "publish" || article.status === "published"
            ? "Published"
            : article.status === "archived"
              ? "Archived"
              : article.status === "scheduled"
                ? "Scheduled"
              : "Draft",
        scheduled_publish_at: article.scheduled_publish_at ?? null,
        scheduled_publish_at_local: "",
        blog_access_tier: article.blog_access_tier === "premium" ? "premium" : "free",
        rel_download_url: article.rel_download_url ?? null,
        category_ids: article.category_ids ?? [],
        tag_ids: article.tag_ids ?? [],
        article_type_ids: article.article_type_ids ?? [],
        court_ids: article.court_ids ?? [],
        citation: (article.citation as ArticleFormData["citation"]) ?? null,
      };

      const [categories, tags, articleTypes, courts] = await Promise.all([
        fetchArticleCategories(),
        fetchTags(),
        fetchArticleTypes(),
        fetchCourts(),
      ]);

      navigate("/articles/preview", {
        state: {
          [PREVIEW_STATE_KEY]: previewData,
          returnPath: `/articles/${articleId}/edit`,
          taxonomyOptions: { categories, tags, articleTypes, courts },
        },
      });
    }, [navigate]);
    void handlePreview; // kept for internal preview navigation — not exposed in table UI

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
        key: "categories",
        header: "Category",
        sortable: false,
        render: (row: ArticleRecord) =>
          row.categories && row.categories.length > 0 ? (
            <div className="flex flex-wrap gap-1">
              {row.categories.map((cat) => (
                <Badge key={cat.id} size="sm" color="primary">
                  {cat.name}
                </Badge>
              ))}
            </div>
          ) : (
            <span className="text-gray-400 text-theme-xs">—</span>
          ),
      },
      {
        key: "tags",
        header: "Tags",
        sortable: false,
        render: (row: ArticleRecord) =>
          row.tags && row.tags.length > 0 ? (
            <div className="flex flex-wrap gap-1">
              {row.tags.map((tag) => (
                <Badge key={tag.id} size="sm" color="light">
                  {tag.name}
                </Badge>
              ))}
            </div>
          ) : (
            <span className="text-gray-400 text-theme-xs">—</span>
          ),
      },
      {
        key: "status",
        header: "Status",
        sortable: true,
        render: (row: ArticleRecord) => (
          <div>
            <Badge size="sm" color={statusColor(row.status)}>
              {statusLabel(row.status)}
            </Badge>
            {row.status === "scheduled" && row.scheduled_publish_at ? (
              <span className="mt-1 block text-theme-xs text-gray-500 dark:text-gray-400">
                {new Date(row.scheduled_publish_at).toLocaleString()}
              </span>
            ) : null}
          </div>
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
        render: (row: ArticleRecord) => {
          const isPublished = row.status === "publish" || row.status === "published";
          const websiteUrl = isPublished && row.slug
            ? `${WEBSITE_URL}/${row.slug}-${row.id}.html`
            : null;
          return (
          <div className="flex flex-nowrap items-center justify-end gap-2">
            {websiteUrl
              ? <WebsiteViewLink href={websiteUrl} />
              : <AdminViewLink to={`/articles/${row.id}`} />}
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
          );
        },
      },
    ];

    const filterKey = [filterStatus, filterCategoryId, filterAccessTier, filterDateFrom, filterDateTo].join("|");

    return (
      <DataTable<ArticleRecord>
        key={filterKey}
        ref={ref}
        columns={columns}
        fetchData={fetchData}
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
