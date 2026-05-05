import PageMeta from "../../components/common/PageMeta";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import { OrdersTable } from "../../components/tables";
import { FilterBar, useFilterState } from "../../components/filters";
import type { FilterFieldDef } from "../../components/filters";

const orderFilterFields: FilterFieldDef[] = [
  {
    type: "select",
    id: "status",
    label: "Status",
    placeholder: "All statuses",
    options: [
      { value: "paid", label: "Paid" },
      { value: "pending", label: "Pending" },
      { value: "failed", label: "Failed" },
      { value: "refunded", label: "Refunded" },
    ],
  },
  {
    type: "select",
    id: "type",
    label: "Type",
    placeholder: "All types",
    options: [
      { value: "course", label: "Course" },
      { value: "membership", label: "Membership" },
    ],
  },
  {
    type: "number-range",
    id: "amount",
    label: "Amount (₹)",
    minId: "amount_min",
    maxId: "amount_max",
  },
];

export default function OrderList() {
  const { values, set, reset, hasActive } = useFilterState();

  return (
    <>
      <PageMeta title="Orders | StudyCafe Admin" description="View orders" />
      <PageBreadcrumb pageTitle="Orders" />
      <div className="space-y-6">
        <FilterBar
          fields={orderFilterFields}
          values={values}
          onChange={set}
          onReset={reset}
          hasActive={hasActive}
        />
        <OrdersTable
          filterStatus={values.status ?? ""}
          filterType={values.type ?? ""}
          filterAmountMin={values.amount_min ?? ""}
          filterAmountMax={values.amount_max ?? ""}
        />
      </div>
    </>
  );
}
