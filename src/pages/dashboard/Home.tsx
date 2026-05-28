import { useState } from "react";
import PageMeta from "../../components/common/PageMeta";
import {
  ActivityFeed,
  DashboardHeader,
  RevenueChart,
  StatCard,
  TopCourses,
} from "../../components/dashboard";
import { useDashboard } from "../../hooks/useDashboard";
import type { DashboardPeriod } from "../../types/dashboard";

const SKELETON_KEYS = ["s1", "s2", "s3", "s4"] as const;

export default function Home() {
  const [period, setPeriod] = useState<DashboardPeriod>("30d");
  const { data, isLoading } = useDashboard(period);

  return (
    <>
      <PageMeta
        title="Dashboard | StudyCafe Admin"
        description="StudyCafe Admin — overview of students, revenue, courses and platform activity"
      />

      <div className="space-y-6 pb-8">
        {/* Header + period filter */}
        <DashboardHeader period={period} onPeriodChange={setPeriod} />

        {/* KPI stat cards */}
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {isLoading
            ? SKELETON_KEYS.map((k) => (
                <StatCard
                  key={k}
                  loading
                  label=""
                  value=""
                  delta={0}
                  iconKey="orders"
                />
              ))
            : (data?.stats ?? []).map((stat) => (
                <StatCard key={stat.label} {...stat} />
              ))}
        </div>

        {/* Revenue + enrollments chart */}
        <RevenueChart data={data?.revenueData} loading={isLoading} period={period} />

        {/* Activity feed + top courses */}
        <div className="grid grid-cols-1 gap-6 xl:grid-cols-5">
          <div className="xl:col-span-3">
            <ActivityFeed items={data?.activityFeed} loading={isLoading} />
          </div>
          <div className="xl:col-span-2">
            <TopCourses courses={data?.topCourses} loading={isLoading} />
          </div>
        </div>
      </div>
    </>
  );
}
