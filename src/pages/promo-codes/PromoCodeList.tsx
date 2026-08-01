import { useState, useRef, useCallback } from "react";
import { Link } from "react-router";
import PageMeta from "../../components/common/PageMeta";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import { ConfirmDeleteModal } from "../../components/ui/modal/ConfirmDeleteModal";
import { DataTable, type DataTableRef } from "../../components/tables/data-table/DataTable";
import { PencilIcon, TrashBinIcon } from "../../icons";
import { useModal } from "../../hooks/useModal";
import { RequirePermission } from "../../components/auth/RequirePermission";
import { couponsApi, deleteCoupon, type Coupon } from "../../api/promoCodes";
import { fetchCouponUsageSummary, type CouponUsageSummaryItem } from "../../api/couponUsage";
import { FilterBar, useFilterState } from "../../components/filters";
import type { FilterFieldDef } from "../../components/filters";
import type { DataTableFetchParams, DataTableFetchResult } from "../../components/tables/data-table/DataTable.types";
import {
  COUPON_STATE_LABELS,
  couponState,
  formatCouponExpireDate,
  formatCouponStartDate,
  formatPublishedDate,
  publishedDateInRange,
  type CouponState,
} from "../../utils/couponDates";

const couponFilterFields: FilterFieldDef[] = [
  {
    type: "select",
    id: "status",
    label: "Status",
    placeholder: "All statuses",
    options: [
      { value: "active", label: "Active" },
      { value: "expired", label: "Expired" },
      { value: "scheduled", label: "Scheduled" },
      { value: "draft", label: "Draft" },
    ],
  },
  {
    type: "select",
    id: "type",
    label: "Coupon Type",
    placeholder: "All types",
    options: [
      { value: "Percentage", label: "Percentage (%)" },
      { value: "Amount", label: "Fixed Amount (₹)" },
    ],
  },
  {
    type: "select",
    id: "discount_on",
    label: "Discount On",
    placeholder: "All",
    options: [
      { value: "Membership Only", label: "Membership Only" },
      { value: "Everything", label: "Everything" },
      { value: "All Courses", label: "All Courses" },
    ],
  },
  {
    type: "date-range",
    id: "published",
    label: "Published",
    fromId: "publishedFrom",
    toId: "publishedTo",
  },
];

function getErrorMessage(error: unknown): string | undefined {
  if (error instanceof Error) return error.message;
  if (typeof error === "object" && error !== null && "response" in error) {
    return (error as { response?: { data?: { message?: string } } }).response?.data?.message;
  }
  return undefined;
}

function toMeta(total: number, page: number, limit: number): DataTableFetchResult<Coupon>["meta"] {
  const totalPages = Math.max(1, Math.ceil(total / limit));
  return { total, page, limit, totalPages, hasNextPage: page < totalPages, hasPreviousPage: page > 1 };
}

type CouponRow = Coupon & { usage_count?: number; state: CouponState };

const STATE_BADGE_CLASSES: Record<CouponState, string> = {
  active: "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400",
  expired: "bg-error-50 text-error-600 dark:bg-error-500/15 dark:text-error-400",
  scheduled: "bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-400",
  draft: "bg-gray-100 text-gray-500 dark:bg-white/[0.05] dark:text-gray-400",
};

export default function PromoCodeList() {
  const [deleteTarget, setDeleteTarget] = useState<Coupon | null>(null);
  const [deleting, setDeleting] = useState(false);
  const { isOpen: isDeleteModalOpen, openModal: openDeleteModal, closeModal: closeDeleteModal } = useModal();
  const dataTableRef = useRef<DataTableRef>(null);
  const { values, set, reset, hasActive } = useFilterState();
  const [resetKey, setResetKey] = useState(0);

  const handleReset = useCallback(() => {
    reset();
    setResetKey((k) => k + 1);
  }, [reset]);

  const handleDeleteClick = useCallback(
    (item: Coupon) => {
      setDeleteTarget(item);
      openDeleteModal();
    },
    [openDeleteModal]
  );

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await deleteCoupon(deleteTarget.id);
      dataTableRef.current?.refetch();
      setDeleteTarget(null);
      closeDeleteModal();
    } catch (err: unknown) {
      console.error("Failed to delete coupon", err);
      alert(getErrorMessage(err) || "Failed to delete coupon");
    } finally {
      setDeleting(false);
    }
  };

  const handleDeleteCancel = () => {
    setDeleteTarget(null);
    closeDeleteModal();
  };

  const fetchData = useCallback(
    async (params: DataTableFetchParams): Promise<DataTableFetchResult<CouponRow>> => {
      const [res, usageSummary] = await Promise.all([
        couponsApi.list(),
        fetchCouponUsageSummary().catch(() => [] as CouponUsageSummaryItem[]),
      ]);

      const usageMap = new Map<number, CouponUsageSummaryItem>();
      for (const u of usageSummary) {
        usageMap.set(Number(u.coupon_id), u);
      }
      let data: CouponRow[] = res.data.map((c) => {
        const stats = usageMap.get(Number(c.id));
        return { ...c, usage_count: stats?.usage_count ?? 0, state: couponState(c) };
      });

      const search = (params.search ?? "").trim().toLowerCase();
      if (search) {
        data = data.filter((c) =>
          [c.code, c.description, c.discount_on].some(
            (v) => v && String(v).toLowerCase().includes(search)
          )
        );
      }

      if (values.status) {
        data = data.filter((c) => c.state === values.status);
      }

      if (values.type) {
        data = data.filter((c) => c.type === values.type);
      }

      if (values.discount_on) {
        data = data.filter((c) => c.discount_on === values.discount_on);
      }

      if (values.publishedFrom || values.publishedTo) {
        data = data.filter((c) =>
          publishedDateInRange(
            c.created_at,
            values.publishedFrom ?? "",
            values.publishedTo ?? "",
          ),
        );
      }

      // Sorting
      if (params.sortBy) {
        const { sortBy, sortOrder } = params;
        data = [...data].sort((a, b) => {
          const va = (a as unknown as Record<string, unknown>)[sortBy];
          const vb = (b as unknown as Record<string, unknown>)[sortBy];
          if (typeof va === "string" && typeof vb === "string") {
            return sortOrder === "DESC" ? vb.localeCompare(va) : va.localeCompare(vb);
          }
          if (va == null) return 1;
          if (vb == null) return -1;
          return sortOrder === "DESC" ? (va < vb ? 1 : -1) : va < vb ? -1 : 1;
        });
      }

      const { page, limit } = params;
      const start = (page - 1) * limit;
      return {
        data: data.slice(start, start + limit),
        meta: toMeta(data.length, page, limit),
      };
    },
    [values]
  );

  const filterKey = Object.values(values).join("|");

  const columns = [
    {
      key: "code",
      header: "Code",
      sortable: true,
      render: (row: CouponRow) => (
        <span className="font-medium text-gray-800 text-theme-sm dark:text-white/90">{row.code}</span>
      ),
    },
    {
      key: "discount",
      header: "Discount",
      sortable: false,
      render: (row: CouponRow) => {
        const value = row.value ?? 0;
        return (
          <span className="text-gray-500 text-theme-sm dark:text-gray-400">
            {row.type === "Percentage" ? `${value}%` : `₹${value}`}
          </span>
        );
      },
    },
    {
      key: "discount_on",
      header: "Discount On",
      sortable: true,
      render: (row: CouponRow) => (
        <span className="text-gray-500 text-theme-sm dark:text-gray-400">
          {row.discount_on ?? "—"}
        </span>
      ),
    },
    {
      key: "validity",
      header: "Validity",
      sortable: false,
      render: (row: CouponRow) => (
        <div className="text-gray-500 text-theme-sm dark:text-gray-400">
          {formatCouponStartDate(row.start_date)} → {formatCouponExpireDate(row.expire_date)}
        </div>
      ),
    },
    {
      key: "created_at",
      header: "Published",
      sortable: true,
      render: (row: CouponRow) => (
        <span className="text-gray-500 text-theme-sm dark:text-gray-400">
          {formatPublishedDate(row.created_at)}
        </span>
      ),
    },
    {
      key: "state",
      header: "Status",
      sortable: true,
      render: (row: CouponRow) => (
        <span
          className={`rounded-full px-2 py-1 text-theme-xs font-semibold ${STATE_BADGE_CLASSES[row.state]}`}
          title={
            row.state === "expired"
              ? `Published, but expired on ${formatCouponExpireDate(row.expire_date)} — no longer usable at checkout`
              : row.state === "scheduled"
                ? `Published, but not usable until ${formatCouponStartDate(row.start_date)}`
                : undefined
          }
        >
          {COUPON_STATE_LABELS[row.state]}
        </span>
      ),
    },
    {
      key: "usage_count",
      header: "Usage",
      sortable: true,
      render: (row: CouponRow) => {
        const count = row.usage_count ?? 0;
        return (
          <Link
            to={`/coupons/${row.id}/usage`}
            className={`inline-flex min-w-[2rem] items-center justify-center rounded-full px-2.5 py-1 text-sm font-semibold transition ${
              count === 0
                ? "text-gray-400 hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-white/5"
                : "bg-brand-50 text-brand-600 hover:bg-brand-100 dark:bg-brand-500/15 dark:text-brand-400 dark:hover:bg-brand-500/25"
            }`}
            title="View who used this coupon"
          >
            {count}
          </Link>
        );
      },
    },
    {
      key: "actions",
      header: "Actions",
      align: "end" as const,
      sortable: false,
      render: (row: CouponRow) => (
        <div className="flex items-center justify-end gap-2">
          <RequirePermission permissions={["admin:access"]} fallback={null}>
            <Link
              to={`/coupons/${row.id}/edit`}
              className="inline-flex items-center justify-center gap-1.5 rounded-lg px-2.5 py-2 text-sm text-gray-600 transition hover:bg-gray-100 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-white"
              title="Edit"
            >
              <PencilIcon className="size-4 shrink-0 fill-current" />
              Edit
            </Link>
          </RequirePermission>
          <RequirePermission permissions={["admin:access"]} fallback={null}>
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
        title="Coupons | StudyCafe Admin"
        description="Manage coupons and discounts for the admin panel"
      />
      <PageBreadcrumb
        pageTitle="Coupons"
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <Link
              to="/coupons/usage"
              className="inline-flex items-center justify-center gap-2 rounded-lg border border-gray-200 px-4 py-3 text-sm font-medium text-gray-700 transition hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-white/5"
            >
              Usage Report
            </Link>
            <RequirePermission permissions={["admin:access"]} fallback={null}>
              <Link
                to="/coupons/create"
                className="inline-flex items-center justify-center gap-2 rounded-lg px-4 py-3 text-sm font-medium text-white transition bg-brand-500 shadow-theme-xs hover:bg-brand-600"
              >
                Create New
              </Link>
            </RequirePermission>
          </div>
        }
      />
      <div className="space-y-6">
        <FilterBar
          fields={couponFilterFields}
          values={values}
          onChange={set}
          onReset={handleReset}
          hasActive={hasActive}
          resetKey={resetKey}
        />
        <DataTable<CouponRow>
          key={filterKey}
          ref={dataTableRef}
          columns={columns}
          fetchData={fetchData}
          initialPageSize={10}
          initialSortBy="created_at"
          initialSortOrder="DESC"
          pageSizeOptions={[10, 20, 50, 100]}
          enableSearch
          enableSorting
          enablePagination
          searchPlaceholder="Search coupons…"
          emptyMessage="No coupons found."
        />
      </div>

      <ConfirmDeleteModal
        isOpen={isDeleteModalOpen}
        onClose={handleDeleteCancel}
        onConfirm={handleDeleteConfirm}
        title="Delete Coupon"
        itemName={deleteTarget?.code}
        isLoading={deleting}
      />
    </>
  );
}
