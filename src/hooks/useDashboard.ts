import { useQuery } from "@tanstack/react-query";
import { fetchDashboardStats } from "../api/dashboard";
import type { DashboardPeriod } from "../types/dashboard";

export function useDashboard(period: DashboardPeriod) {
  return useQuery({
    queryKey: ["dashboard", period],
    queryFn: () => fetchDashboardStats(period),
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
  });
}
