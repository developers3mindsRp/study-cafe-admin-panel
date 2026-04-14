import PageMeta from "../../components/common/PageMeta";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import { AffiliateHistoryTable } from "../../components/tables/AffiliateHistoryTable";

export default function AffiliateHistory() {
  return (
    <>
      <PageMeta 
        title="Affiliate History | StudyCafe Admin" 
        description="Track affiliate earnings and referrals" 
      />
      <PageBreadcrumb pageTitle="Affiliate History" />
      <div className="space-y-6">
        <AffiliateHistoryTable />
      </div>
    </>
  );
}
