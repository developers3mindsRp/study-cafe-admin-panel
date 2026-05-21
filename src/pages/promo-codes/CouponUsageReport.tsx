import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router";
import PageMeta from "../../components/common/PageMeta";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import { RequirePermission } from "../../components/auth/RequirePermission";
import { DataTable, type DataTableRef } from "../../components/tables/data-table/DataTable";
import { FilterBar, useFilterState } from "../../components/filters";
import type { FilterFieldDef } from "../../components/filters";
import {
  fetchCouponUsagesPaginated,
  type CouponUsageRow,
  type CouponUsageTotals,
} from "../../api/couponUsage";
import { couponsApi } from "../../api/promoCodes";
import type { DataTableFetchParams, DataTableFetchResult } from "../../components/tables/data-table";
import {
  filtersFromValues,
  formatDate,
  formatMoney,
  usageFilterFields,
} from "./couponUsageShared";

function Stat({
  label,
  value,
  highlight,
}: {
  label: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <div>
      <p className="text-xs text-gray-500 dark:text-gray-400">{label}</p>
      <p
        className={`mt-0.5 text-base font-semibold ${
          highlight ? "text-success-600 dark:text-success-400" : "text-gray-900 dark:text-white"
        }`}
      >
        {value}
      </p>
    </div>
  );
}

export default function CouponUsageReport() {
  return (
    <RequirePermission permissions={["coupons:list", "coupons:view"]}>
      <CouponUsageReportContent />
    </RequirePermission>
  );
}

function CouponUsageReportContent() {
  const tableRef = useRef<DataTableRef>(null);
  const { values, set, reset, hasActive } = useFilterState();
  const [totals, setTotals] = useState<CouponUsageTotals | null>(null);
  const [couponOptions, setCouponOptions] = useState<{ value: string; label: string }[]>([]);

  useEffect(() => {
    couponsApi
      .list()
      .then((res) => {
        const options = res.data
          .slice()
          .sort((a, b) => String(a.code).localeCompare(String(b.code)))
          .map((c) => ({ value: String(c.id), label: c.code }));
        setCouponOptions([{ value: "", label: "All coupons" }, ...options]);
      })
      .catch(() => setCouponOptions([{ value: "", label: "All coupons" }]));
  }, []);

  const filterFields = useMemo<FilterFieldDef[]>(
    () => [
      {
        type: "select",
        id: "couponId",
        label: "Coupon",
        placeholder: "All coupons",
        options: couponOptions.length ? couponOptions : [{ value: "", label: "All coupons" }],
      },
      ...usageFilterFields,
    ],
    [couponOptions],
  );

  const listFilters = useMemo(() => filtersFromValues(values), [values]);
  const filterKey = JSON.stringify(listFilters);

  const fetchData = useCallback(
    async (params: DataTableFetchParams): Promise<DataTableFetchResult<CouponUsageRow>> => {
      const res = await fetchCouponUsagesPaginated({
        ...params,
        filters: listFilters,
      });
      if (res.summary) setTotals(res.summary);
      return res;
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [filterKey],
  );

  const columns = useMemo(
    () => [
      {
        key: "created_at",
        header: "Used on",
        sortable: true,
        render: (row: CouponUsageRow) => (
          <span className="text-sm text-gray-700 dark:text-gray-300">{formatDate(row.used_at)}</span>
        ),
      },
      {
        key: "coupon_code",
        header: "Coupon",
        sortable: true,
        render: (row: CouponUsageRow) => (
          <div>
            <p className="font-mono text-sm font-medium text-brand-600 dark:text-brand-400">
              {row.coupon_code}
            </p>
            {row.coupon?.id ? (
              <Link
                to={`/coupons/${row.coupon.id}/usage`}
                className="text-xs text-gray-500 hover:text-brand-500 hover:underline dark:text-gray-400"
              >
                View coupon report
              </Link>
            ) : null}
          </div>
        ),
      },
      {
        key: "buyer_email",
        header: "User",
        sortable: true,
        render: (row: CouponUsageRow) => (
          <div>
            <p className="text-sm font-medium text-gray-900 dark:text-white">{row.buyer_name || "—"}</p>
            <p className="text-xs text-gray-500 dark:text-gray-400">{row.buyer_email || "—"}</p>
            {row.user_id ? (
              <Link to={`/users/${row.user_id}`} className="text-xs text-brand-500 hover:underline">
                View profile
              </Link>
            ) : null}
          </div>
        ),
      },
      {
        key: "order_id",
        header: "Order",
        sortable: true,
        render: (row: CouponUsageRow) => (
          <Link
            to={`/orders/${encodeURIComponent(row.order_id)}`}
            className="font-mono text-xs text-brand-600 hover:underline dark:text-brand-400"
          >
            {row.order_id}
          </Link>
        ),
      },
      {
        key: "entity_name",
        header: "Product",
        render: (row: CouponUsageRow) => (
          <span className="text-sm text-gray-700 dark:text-gray-300">
            {row.entity_name || row.entity_id || "—"}
            {row.type ? (
              <span className="ml-1 text-xs capitalize text-gray-400">({row.type})</span>
            ) : null}
          </span>
        ),
      },
      {
        key: "original_amount",
        header: "Subtotal",
        sortable: true,
        align: "end" as const,
        render: (row: CouponUsageRow) => (
          <span className="text-sm text-gray-600 dark:text-gray-400">
            {formatMoney(row.original_amount ?? row.amount, row.currency)}
          </span>
        ),
      },
      {
        key: "coupon_discount",
        header: "Discount",
        sortable: true,
        align: "end" as const,
        render: (row: CouponUsageRow) => (
          <span className="text-sm font-medium text-success-600 dark:text-success-400">
            −{formatMoney(row.coupon_discount, row.currency)}
          </span>
        ),
      },
      {
        key: "amount",
        header: "Amount paid",
        sortable: true,
        align: "end" as const,
        render: (row: CouponUsageRow) => (
          <span className="text-sm font-semibold text-gray-900 dark:text-white">
            {formatMoney(row.amount, row.currency)}
          </span>
        ),
      },
      {
        key: "status",
        header: "Status",
        sortable: true,
        render: (row: CouponUsageRow) => (
          <span className="inline-flex rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium capitalize text-gray-700 dark:bg-white/10 dark:text-gray-300">
            {row.status}
          </span>
        ),
      },
    ],
    [],
  );

  return (
    <>
      <PageMeta title="Coupon Usage Report | StudyCafe Admin" description="Who used coupons and when" />
      <PageBreadcrumb
        pageTitle="Coupon Usage Report"
        items={[{ label: "Coupons", path: "/coupons" }]}
      />

      <div className="space-y-6">
        <div className="rounded-xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03]">
          <p className="text-sm text-gray-600 dark:text-gray-300">
            Track every order where a coupon was applied — who used it, which coupon, and how much discount
            was given.
          </p>
          {totals && (
            <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-4">
              <Stat label="Total redemptions" value={String(totals.usage_count)} />
              <Stat label="Subtotal" value={formatMoney(totals.total_original)} />
              <Stat label="Total discount" value={formatMoney(totals.total_discount)} highlight />
              <Stat label="Total paid" value={formatMoney(totals.total_paid)} />
            </div>
          )}
        </div>

        <FilterBar
          fields={filterFields}
          values={values}
          onChange={set}
          onReset={reset}
          hasActive={hasActive}
        />

        <DataTable
          ref={tableRef}
          key={filterKey}
          columns={columns}
          fetchData={fetchData}
          searchPlaceholder="Search user, order ID, coupon code…"
          initialSortBy="created_at"
          initialSortOrder="DESC"
          emptyMessage="No coupon usage found for the selected filters."
        />
      </div>
    </>
  );
}
