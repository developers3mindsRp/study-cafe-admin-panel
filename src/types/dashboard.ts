export type DashboardPeriod = "7d" | "30d" | "90d";

export type StatIconKey =
  | "users"
  | "courses"
  | "articles"
  | "revenue"
  | "memberships"
  | "orders";

export interface StatCardData {
  label: string;
  value: string | number;
  /** Percentage change vs previous period. Positive = up, negative = down. */
  delta: number;
  deltaLabel?: string;
  iconKey: StatIconKey;
}

export interface RevenueDataPoint {
  /** Short display label, e.g. "Mon", "Week 1", "Jan" */
  label: string;
  /** Revenue in INR (paise or rupees — pick one consistently) */
  revenue: number;
  enrollments: number;
}

export type ActivityType =
  | "enrollment"
  | "order"
  | "article"
  | "membership"
  | "course";

export type ActivityStatus = "success" | "pending" | "failed";

export interface ActivityItem {
  id: string;
  type: ActivityType;
  title: string;
  /** Supporting detail, e.g. "by Ravi Kumar" or "₹4,999" */
  meta: string;
  /** ISO date-time string */
  timestamp: string;
  status: ActivityStatus;
}

export interface TopCourse {
  id: string;
  title: string;
  category: string;
  enrollments: number;
  /** Revenue in INR */
  revenue: number;
  /** % change vs previous period */
  trend: number;
}

export interface DashboardStats {
  period: DashboardPeriod;
  stats: StatCardData[];
  revenueData: RevenueDataPoint[];
  activityFeed: ActivityItem[];
  topCourses: TopCourse[];
}
