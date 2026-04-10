import InstituteMetrics from "../../components/institute/InstituteMetrics";
import MonthlyActivityChart from "../../components/institute/MonthlyActivityChart";
import InstituteStatisticsChart from "../../components/institute/InstituteStatisticsChart";
import MonthlyGoal from "../../components/institute/MonthlyGoal";
import RecentActivity from "../../components/institute/RecentActivity";
// import StudentsDemographic from "../../components/institute/StudentsDemographic";
import PageMeta from "../../components/common/PageMeta";

export default function Home() {
  return (
    <>
      <PageMeta
        title="Dashboard | StudyCafe Admin"
        description="StudyCafe Admin dashboard - Manage your resources for CA, CS, CWA, GST, Income Tax and more"
      />
      <div className="grid grid-cols-12 gap-4 pb-6 md:gap-6 xl:items-start">
        <div className="col-span-12">
          <InstituteMetrics />
        </div>

        <div className="col-span-12 flex flex-col gap-4 xl:col-span-7 xl:gap-6">
          <MonthlyActivityChart />
          <InstituteStatisticsChart />
        </div>

        <div className="col-span-12 flex flex-col gap-4 xl:col-span-5 xl:gap-6">
          <MonthlyGoal />
          <RecentActivity />
        </div>
      </div>
    </>
  );
}
