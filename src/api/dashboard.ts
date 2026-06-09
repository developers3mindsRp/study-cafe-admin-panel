import { api } from "./axios";
import type { DashboardPeriod, DashboardStats } from "../types/dashboard";

export async function fetchDashboardStats(period: DashboardPeriod): Promise<DashboardStats> {
  const { data } = await api.get<DashboardStats>("/admin/dashboard/stats", { params: { period } });
  return data;
}
