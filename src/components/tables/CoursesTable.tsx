/**
 * Courses table using the reusable DataTable.
 * Client-side search (by title), filters (category, price band, visibility), and sort.
 */

import { useCallback, useMemo } from "react";
import { Link } from "react-router";
import { DataTable } from "./data-table";
import Badge from "../ui/badge/Badge";
import { PencilIcon, CopyIcon, TrashBinIcon } from "../../icons";
import { RequirePermission } from "../auth/RequirePermission";
import { PERM_COURSES_CREATE, PERM_COURSES_DELETE } from "../../constants/permissions";
import { fetchCourses, type Course } from "../../api/courses";
import type { TrashScope } from "../trash/TrashScopeTabs";
import type { DataTableFetchParams, DataTableFetchResult } from "./data-table/DataTable.types";
import type { CourseSortFilter, PriceRangeFilter, PublicationFilter } from "../../pages/courses/filterTypes";
import { getWebsiteUrl } from "../../config/env";
import { WebsiteViewLink, AdminViewLink } from "../common/WebsiteLink";

const WEBSITE_URL = getWebsiteUrl();

function courseListPrice(c: Course): number {
  const n = Number(c.price);
  return Number.isFinite(n) ? n : 0;
}

function courseEffectivePrice(c: Course): number {
  const sale = Number(c.sale_price);
  if (Number.isFinite(sale) && sale > 0) return sale;
  return courseListPrice(c);
}

function matchesPriceRange(c: Course, range: PriceRangeFilter): boolean {
  if (!range) return true;
  const p = courseEffectivePrice(c);
  switch (range) {
    case "0-500":
      return p < 500;
    case "500-2000":
      return p >= 500 && p < 2000;
    case "2000-5000":
      return p >= 2000 && p < 5000;
    case "5000+":
      return p >= 5000;
    default:
      return true;
  }
}

function matchesCategory(c: Course, categoryId: string): boolean {
  if (!categoryId) return true;
  const id = Number(categoryId);
  if (!Number.isFinite(id)) return true;
  if (c.course_cat_ids?.includes(id)) return true;
  return Boolean(c.categories?.some((x) => x.id === id));
}

function matchesPublication(c: Course, publication: PublicationFilter): boolean {
  if (!publication) return true;
  if (publication === "published") return Boolean(c.is_published);
  return !c.is_published;
}

function matchesStartDateRange(c: Course, from: string, to: string): boolean {
  if (!from && !to) return true;
  if (!c.start_date) return false;
  const t = Date.parse(c.start_date);
  if (!Number.isFinite(t)) return false;
  if (from && t < Date.parse(from)) return false;
  if (to && t > Date.parse(to) + 86399999) return false;
  return true;
}

function parseTimeMs(value: string | undefined): number {
  if (!value) return 0;
  const t = Date.parse(value);
  return Number.isFinite(t) ? t : 0;
}

function sortCoursesList(list: Course[], sort: CourseSortFilter): Course[] {
  if (!sort) return list;
  const copy = [...list];
  const idNum = (c: Course) => Number(c.id) || 0;
  switch (sort) {
    case "newest":
      return copy.sort((a, b) => {
        const d = parseTimeMs(b.created_at) - parseTimeMs(a.created_at);
        return d !== 0 ? d : idNum(b) - idNum(a);
      });
    case "oldest":
      return copy.sort((a, b) => {
        const d = parseTimeMs(a.created_at) - parseTimeMs(b.created_at);
        return d !== 0 ? d : idNum(a) - idNum(b);
      });
    default:
      return list;
  }
}

function toMeta(total: number, page: number, limit: number): DataTableFetchResult<Course>["meta"] {
  const totalPages = Math.max(1, Math.ceil(total / limit));
  return {
    total,
    page,
    limit,
    totalPages,
    hasNextPage: page < totalPages,
    hasPreviousPage: page > 1,
  };
}

export interface CoursesTableProps {
  filterCategoryId?: string;
  filterPriceRange?: PriceRangeFilter;
  filterPublication?: PublicationFilter;
  filterSortBy?: CourseSortFilter;
  filterStartDateFrom?: string;
  filterStartDateTo?: string;
  trashScope?: TrashScope;
  onDeleteClick?: (course: Course) => void;
  onRestoreClick?: (course: Course) => void;
}

export function CoursesTable({
  filterCategoryId = "",
  filterPriceRange = "",
  filterPublication = "",
  filterSortBy = "",
  filterStartDateFrom = "",
  filterStartDateTo = "",
  trashScope = "active",
  onDeleteClick,
  onRestoreClick,
}: CoursesTableProps) {
  const isTrash = trashScope === "trash";

  const columns = useMemo(
    () => [
      {
        key: "title",
        header: "Title",
        sortable: false,
        render: (row: Course) => (
          <div>
            <span className="block font-medium text-gray-800 dark:text-white/90">{row.title}</span>
            {row.description && (
              <span className="block line-clamp-1 text-theme-xs text-gray-500 dark:text-gray-400">
                {row.description}
              </span>
            )}
          </div>
        ),
      },
      {
        key: "price",
        header: "Price",
        sortable: false,
        align: "start" as const,
        render: (row: Course) => `₹${Number(row.price).toFixed(2)}`,
      },
      {
        key: "sale_price",
        header: "Sale Price",
        sortable: false,
        align: "start" as const,
        render: (row: Course) => {
          const s = Number(row.sale_price);
          if (!Number.isFinite(s) || s <= 0) return <span className="text-gray-400 dark:text-gray-600">—</span>;
          return <span className="text-green-600 dark:text-green-400">₹{s.toFixed(2)}</span>;
        },
      },
      {
        key: "is_published",
        header: "Status",
        sortable: false,
        render: (row: Course) => (
          <div className="flex flex-wrap items-center gap-1.5">
            <Badge size="sm" color={row.is_published ? "success" : "error"}>
              {row.is_published ? "Published" : "Draft"}
            </Badge>
            {row.hide_from_public ? (
              <span
                title="Not shown on the public course catalog or marketing course pages. Assigned learners still get access."
                className="inline-flex"
              >
                <Badge size="sm" color="warning">
                  Unlisted
                </Badge>
              </span>
            ) : null}
          </div>
        ),
      },
      {
        key: "actions",
        header: "Actions",
        align: "end" as const,
        sortable: false,
        render: (row: Course) => {
          const websiteUrl = row.is_published && row.slug
            ? `${WEBSITE_URL}/course/${row.slug}`
            : null;
          return (
            <div className="flex items-center justify-end gap-2">
              {!isTrash ? (
                <>
                  {websiteUrl
                    ? <WebsiteViewLink href={websiteUrl} />
                    : <AdminViewLink to={`/courses/${row.id}`} />}
                  <Link
                    to={`/courses/${row.id}/edit`}
                    className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-2 text-sm text-gray-600 hover:bg-gray-100 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-white"
                    title="Edit"
                  >
                    <PencilIcon className="size-4 shrink-0 fill-current" />
                    Edit
                  </Link>
                  <RequirePermission permissions={[PERM_COURSES_CREATE]} fallback={null}>
                    <Link
                      to={`/courses/create?duplicateFrom=${encodeURIComponent(String(row.id))}`}
                      className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-2 text-sm text-gray-600 hover:bg-gray-100 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-white"
                      title="Duplicate — opens create form with a copy of this course"
                    >
                      <CopyIcon className="size-4 shrink-0 fill-current" />
                      Duplicate
                    </Link>
                  </RequirePermission>
                  <RequirePermission permissions={[PERM_COURSES_DELETE]} fallback={null}>
                    <button
                      type="button"
                      onClick={() => onDeleteClick?.(row)}
                      className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-2 text-sm text-gray-600 transition hover:bg-error-50 hover:text-error-500 dark:text-gray-400 dark:hover:bg-error-500/10 dark:hover:text-error-400"
                      title="Move to trash"
                    >
                      <TrashBinIcon className="size-4 shrink-0 fill-current" />
                      Trash
                    </button>
                  </RequirePermission>
                </>
              ) : (
                <RequirePermission permissions={[PERM_COURSES_DELETE]} fallback={null}>
                  <button
                    type="button"
                    onClick={() => onRestoreClick?.(row)}
                    className="inline-flex items-center justify-center rounded-lg px-3 py-1.5 text-sm font-medium text-brand-600 transition hover:bg-brand-50 dark:text-brand-400 dark:hover:bg-brand-500/10"
                    title="Restore"
                  >
                    Restore
                  </button>
                </RequirePermission>
              )}
            </div>
          );
        },
      },
    ],
    [isTrash, onDeleteClick, onRestoreClick],
  );

  const fetchCoursesForTable = useCallback(
    async (params: DataTableFetchParams): Promise<DataTableFetchResult<Course>> => {
      const all = await fetchCourses({ trashed: isTrash });
      const search = (params.search ?? "").trim().toLowerCase();
      let filtered = all;

      if (search) {
        filtered = filtered.filter(
          (c) =>
            (c.title && c.title.toLowerCase().includes(search)) ||
            (c.description && c.description.toLowerCase().includes(search)) ||
            (c.brief_description && c.brief_description.toLowerCase().includes(search))
        );
      }

      if (!isTrash) {
        filtered = filtered.filter(
          (c) =>
            matchesCategory(c, filterCategoryId) &&
            matchesPriceRange(c, filterPriceRange) &&
            matchesPublication(c, filterPublication) &&
            matchesStartDateRange(c, filterStartDateFrom, filterStartDateTo)
        );
      }

      filtered = sortCoursesList(filtered, filterSortBy);

      const { page, limit } = params;
      const start = (page - 1) * limit;
      const data = filtered.slice(start, start + limit);
      return {
        data,
        meta: toMeta(filtered.length, page, limit),
      };
    },
    [
      isTrash,
      filterCategoryId,
      filterPriceRange,
      filterPublication,
      filterSortBy,
      filterStartDateFrom,
      filterStartDateTo,
    ],
  );

  const filterKey = `${trashScope}|${filterCategoryId}|${filterPriceRange}|${filterPublication}|${filterSortBy}|${filterStartDateFrom}|${filterStartDateTo}`;

  return (
    <DataTable<Course>
      key={filterKey}
      columns={columns}
      fetchData={fetchCoursesForTable}
      initialPageSize={20}
      pageSizeOptions={[10, 20, 50, 100]}
      enableSearch
      enableSorting={false}
      enablePagination
      searchPlaceholder="Search courses…"
      emptyMessage={isTrash ? "Trash is empty." : "No courses found."}
    />
  );
}
