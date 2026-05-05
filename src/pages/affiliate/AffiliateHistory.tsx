import PageMeta from "../../components/common/PageMeta";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import { AffiliateHistoryTable } from "../../components/tables/AffiliateHistoryTable";
import { FilterBar, useFilterState } from "../../components/filters";
import type { FilterFieldDef } from "../../components/filters";

const affiliateHistoryFilterFields: FilterFieldDef[] = [
  {
    type: "date-range",
    id: "date",
    label: "Date",
    fromId: "date_from",
    toId: "date_to",
  },
];

export default function AffiliateHistory() {
  const { values, set, reset, hasActive } = useFilterState();

  return (
    <>
      <PageMeta
        title="Affiliate History | StudyCafe Admin"
        description="Track affiliate earnings and referrals"
      />
      <PageBreadcrumb pageTitle="Affiliate History" />
      <div className="space-y-6">
        <FilterBar
          fields={affiliateHistoryFilterFields}
          values={values}
          onChange={set}
          onReset={reset}
          hasActive={hasActive}
        />
        <AffiliateHistoryTable
          filterDateFrom={values.date_from ?? ""}
          filterDateTo={values.date_to ?? ""}
        />
      </div>
    </>
  );
}
