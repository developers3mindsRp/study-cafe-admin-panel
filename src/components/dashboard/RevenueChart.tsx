import { useMemo } from "react";
import Chart from "react-apexcharts";
import type { ApexOptions } from "apexcharts";
import type { DashboardPeriod, RevenueDataPoint } from "../../types/dashboard";

interface RevenueChartProps {
  data?: RevenueDataPoint[];
  loading?: boolean;
  period: DashboardPeriod;
}

const PERIOD_LABELS: Record<DashboardPeriod, string> = {
  "7d": "Last 7 days — daily breakdown",
  "30d": "Last 30 days — weekly breakdown",
  "90d": "Last 90 days — monthly breakdown",
};

function ChartSkeleton() {
  return (
    <div className="animate-pulse space-y-3 px-1 pb-4">
      <div className="flex items-end gap-2" style={{ height: 240 }}>
        {Array.from({ length: 7 }).map((_, i) => (
          <div
            key={i}
            className="flex-1 rounded-t-md bg-gray-200 dark:bg-gray-700"
            style={{ height: `${35 + ((i * 47) % 65)}%` }}
          />
        ))}
      </div>
      <div className="flex justify-between">
        {Array.from({ length: 7 }).map((_, i) => (
          <div key={i} className="h-3 w-8 rounded bg-gray-200 dark:bg-gray-700" />
        ))}
      </div>
    </div>
  );
}

export default function RevenueChart({ data, loading = false, period }: RevenueChartProps) {
  const { categories, revenueSeries, enrollmentSeries } = useMemo(() => {
    if (!data) return { categories: [] as string[], revenueSeries: [] as number[], enrollmentSeries: [] as number[] };
    return {
      categories: data.map((d) => d.label),
      revenueSeries: data.map((d) => Math.round(d.revenue / 1000)),
      enrollmentSeries: data.map((d) => d.enrollments),
    };
  }, [data]);

  const options = useMemo<ApexOptions>(() => ({
    chart: {
      fontFamily: "Outfit, sans-serif",
      type: "area",
      height: 260,
      toolbar: { show: false },
      zoom: { enabled: false },
      animations: {
        enabled: true,
        speed: 400,
        dynamicAnimation: { enabled: true, speed: 300 },
      },
    },
    colors: ["#465fff", "#9CB9FF"],
    stroke: {
      curve: "smooth",
      width: [2, 2],
    },
    fill: {
      type: "gradient",
      gradient: {
        opacityFrom: 0.4,
        opacityTo: 0.0,
      },
    },
    dataLabels: { enabled: false },
    legend: {
      show: true,
      position: "top",
      horizontalAlign: "right",
      fontFamily: "Outfit",
      fontSize: "13px",
    },
    markers: {
      size: 0,
      strokeColors: "#fff",
      strokeWidth: 2,
      hover: { size: 5 },
    },
    xaxis: {
      categories,
      axisBorder: { show: false },
      axisTicks: { show: false },
      labels: {
        style: { fontSize: "12px", colors: "#98a2b3" },
      },
      tooltip: { enabled: false },
    },
    yaxis: {
      labels: {
        style: { fontSize: "12px", colors: ["#98a2b3"] },
        formatter: (val: number) => `₹${val}K`,
      },
    },
    grid: {
      borderColor: "rgba(0,0,0,0.06)",
      strokeDashArray: 4,
      xaxis: { lines: { show: false } },
      yaxis: { lines: { show: true } },
      padding: { left: 4, right: 4 },
    },
    tooltip: {
      shared: true,
      intersect: false,
      theme: "light",
      y: [
        { formatter: (val: number) => `₹${(val * 1000).toLocaleString("en-IN")}` },
        { formatter: (val: number) => `${val} enrollments` },
      ],
    },
  }), [categories]);

  const series = useMemo(() => [
    { name: "Revenue", data: revenueSeries },
    { name: "Enrollments", data: enrollmentSeries },
  ], [revenueSeries, enrollmentSeries]);

  return (
    <div className="rounded-2xl border border-gray-200 bg-white px-5 pb-3 pt-5 shadow-theme-xs dark:border-gray-800 dark:bg-white/[0.03] sm:px-6 sm:pt-6">
      {/* Header */}
      <div className="mb-5 flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h3 className="text-base font-semibold text-gray-900 dark:text-white">
            Revenue &amp; Enrollments
          </h3>
          <p className="mt-0.5 text-sm text-gray-500 dark:text-gray-400">
            {PERIOD_LABELS[period]}
          </p>
        </div>

        {/* Summary chips */}
        <div className="flex shrink-0 gap-3">
          <div className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-brand-500" />
            <span className="text-xs text-gray-500 dark:text-gray-400">Revenue</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-brand-300" />
            <span className="text-xs text-gray-500 dark:text-gray-400">Enrollments</span>
          </div>
        </div>
      </div>

      {/* Chart */}
      <div className="max-w-full overflow-x-auto">
        {loading ? (
          <ChartSkeleton />
        ) : (
          <div className="min-w-[480px]">
            <Chart options={options} series={series} type="area" height={260} />
          </div>
        )}
      </div>
    </div>
  );
}
