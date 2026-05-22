/**
 * Dashboard API service.
 *
 * Currently returns mock data with a simulated network delay.
 * To wire up a real backend, replace the body of `fetchDashboardStats` with:
 *
 *   return api.get<DashboardStats>("/admin/dashboard/stats", { params: { period } })
 *              .then((res) => res.data);
 */

import type {
  ActivityItem,
  DashboardPeriod,
  DashboardStats,
  RevenueDataPoint,
  StatCardData,
  TopCourse,
} from "../types/dashboard";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function simulateDelay(ms = 700): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function daysAgo(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString();
}

// ---------------------------------------------------------------------------
// Mock revenue data generators
// ---------------------------------------------------------------------------

function revenueData7d(): RevenueDataPoint[] {
  const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  const revenue = [38400, 52100, 44800, 61300, 57900, 72400, 68100];
  const enrollments = [12, 18, 15, 22, 19, 27, 24];
  return days.map((label, i) => ({ label, revenue: revenue[i], enrollments: enrollments[i] }));
}

function revenueData30d(): RevenueDataPoint[] {
  return [
    { label: "Week 1", revenue: 218000, enrollments: 78 },
    { label: "Week 2", revenue: 264000, enrollments: 95 },
    { label: "Week 3", revenue: 291000, enrollments: 108 },
    { label: "Week 4", revenue: 347000, enrollments: 124 },
  ];
}

function revenueData90d(): RevenueDataPoint[] {
  return [
    { label: "Feb", revenue: 892000, enrollments: 312 },
    { label: "Mar", revenue: 1140000, enrollments: 398 },
    { label: "Apr", revenue: 1384000, enrollments: 467 },
  ];
}

// ---------------------------------------------------------------------------
// Mock stats per period
// ---------------------------------------------------------------------------

function statsFor(period: DashboardPeriod): StatCardData[] {
  const map: Record<DashboardPeriod, StatCardData[]> = {
    "7d": [
      { label: "Total Students", value: "12,847", delta: 8.2, deltaLabel: "vs last 7d", iconKey: "users" },
      { label: "Active Courses", value: 48, delta: 6.25, deltaLabel: "vs last 7d", iconKey: "courses" },
      { label: "Revenue", value: "₹3.95L", delta: 12.4, deltaLabel: "vs last 7d", iconKey: "revenue" },
      { label: "New Orders", value: 137, delta: -3.1, deltaLabel: "vs last 7d", iconKey: "orders" },
    ],
    "30d": [
      { label: "Total Students", value: "13,492", delta: 11.7, deltaLabel: "vs last 30d", iconKey: "users" },
      { label: "Active Courses", value: 51, delta: 6.25, deltaLabel: "vs last 30d", iconKey: "courses" },
      { label: "Revenue", value: "₹11.2L", delta: 18.3, deltaLabel: "vs last 30d", iconKey: "revenue" },
      { label: "New Orders", value: 605, delta: 9.8, deltaLabel: "vs last 30d", iconKey: "orders" },
    ],
    "90d": [
      { label: "Total Students", value: "15,210", delta: 24.6, deltaLabel: "vs last 90d", iconKey: "users" },
      { label: "Active Courses", value: 56, delta: 16.7, deltaLabel: "vs last 90d", iconKey: "courses" },
      { label: "Revenue", value: "₹34.1L", delta: 31.2, deltaLabel: "vs last 90d", iconKey: "revenue" },
      { label: "New Orders", value: 1872, delta: 22.5, deltaLabel: "vs last 90d", iconKey: "orders" },
    ],
  };
  return map[period];
}

// ---------------------------------------------------------------------------
// Mock activity feed
// ---------------------------------------------------------------------------

const ACTIVITY_FEED: ActivityItem[] = [
  {
    id: "act-1",
    type: "enrollment",
    title: "Ravi Kumar enrolled in GST Returns Filing Certification",
    meta: "₹4,999",
    timestamp: daysAgo(0),
    status: "success",
  },
  {
    id: "act-2",
    type: "order",
    title: "New order placed for CA Foundation Batch 2026",
    meta: "₹12,000",
    timestamp: daysAgo(0),
    status: "pending",
  },
  {
    id: "act-3",
    type: "article",
    title: "Article published: Madras HC Upholds ₹1.5 Cr Income Tax Penalty",
    meta: "by Admin",
    timestamp: daysAgo(1),
    status: "success",
  },
  {
    id: "act-4",
    type: "membership",
    title: "Priya Sharma upgraded to Lifetime Ultimate Membership",
    meta: "₹24,999",
    timestamp: daysAgo(1),
    status: "success",
  },
  {
    id: "act-5",
    type: "enrollment",
    title: "Amit Patel enrolled in Tally With AI Masterclass",
    meta: "₹2,999",
    timestamp: daysAgo(2),
    status: "success",
  },
  {
    id: "act-6",
    type: "order",
    title: "Refund requested for GSTR-9 & GSTR-9C with AI",
    meta: "₹3,499",
    timestamp: daysAgo(2),
    status: "failed",
  },
  {
    id: "act-7",
    type: "course",
    title: "New course draft created: Income Tax Practical Filing 2026",
    meta: "by Admin",
    timestamp: daysAgo(3),
    status: "pending",
  },
  {
    id: "act-8",
    type: "article",
    title: "Article published: Hospital Charges Under GST — AAR Ruling",
    meta: "by Admin",
    timestamp: daysAgo(3),
    status: "success",
  },
];

// ---------------------------------------------------------------------------
// Mock top courses
// ---------------------------------------------------------------------------

const TOP_COURSES: TopCourse[] = [
  {
    id: "c-1",
    title: "GST Returns Filing Certification",
    category: "GST",
    enrollments: 1248,
    revenue: 6235752,
    trend: 14.2,
  },
  {
    id: "c-2",
    title: "CA Foundation Batch 2026",
    category: "CA",
    enrollments: 892,
    revenue: 10704000,
    trend: 8.7,
  },
  {
    id: "c-3",
    title: "Tally With AI Masterclass",
    category: "Accounting",
    enrollments: 756,
    revenue: 2264244,
    trend: 22.1,
  },
  {
    id: "c-4",
    title: "GSTR-9 & GSTR-9C with AI",
    category: "GST",
    enrollments: 534,
    revenue: 1866066,
    trend: -2.3,
  },
  {
    id: "c-5",
    title: "Income Tax Practical Filing",
    category: "Income Tax",
    enrollments: 421,
    revenue: 1473499,
    trend: 5.6,
  },
];

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export async function fetchDashboardStats(
  period: DashboardPeriod
): Promise<DashboardStats> {
  // ── Real backend swap ────────────────────────────────────────────────────
  // import { api } from "./axios";
  // return api.get<DashboardStats>("/admin/dashboard/stats", { params: { period } })
  //           .then((res) => res.data);
  // ────────────────────────────────────────────────────────────────────────

  await simulateDelay(650);

  const revenueDataMap: Record<DashboardPeriod, RevenueDataPoint[]> = {
    "7d": revenueData7d(),
    "30d": revenueData30d(),
    "90d": revenueData90d(),
  };

  return {
    period,
    stats: statsFor(period),
    revenueData: revenueDataMap[period],
    activityFeed: ACTIVITY_FEED,
    topCourses: TOP_COURSES,
  };
}
