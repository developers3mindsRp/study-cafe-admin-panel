import { api } from "./axios";
import type { DataTableFetchParams, DataTableFetchResult } from "../components/tables/data-table/DataTable.types";

export interface CourseReviewAdmin {
  id: number;
  user_id: number;
  course_id: number;
  course_title: string | null;
  rating: number;
  body: string | null;
  user_name: string | null;
  user_email: string | null;
  created_at: string;
  updated_at: string;
}

export async function fetchCourseReviewsTable(
  params: DataTableFetchParams
): Promise<DataTableFetchResult<CourseReviewAdmin>> {
  const res = await api.get("/admin/course-reviews", {
    params: {
      page: params.page,
      limit: params.limit,
      sortBy: params.sortBy || undefined,
      sortOrder: params.sortOrder || undefined,
    },
  });
  const d = res.data as {
    data?: CourseReviewAdmin[];
    total?: number;
    page?: number;
    limit?: number;
    totalPages?: number;
    hasNextPage?: boolean;
    hasPreviousPage?: boolean;
  };
  return {
    data: Array.isArray(d.data) ? d.data : [],
    meta: {
      total: d.total ?? 0,
      page: d.page ?? params.page,
      limit: d.limit ?? params.limit,
      totalPages: d.totalPages ?? 1,
      hasNextPage: !!d.hasNextPage,
      hasPreviousPage: !!d.hasPreviousPage,
    },
  };
}

export async function updateCourseReview(
  id: number,
  payload: { rating?: number; body?: string | null }
): Promise<CourseReviewAdmin> {
  const res = await api.patch(`/admin/course-reviews/${id}`, payload);
  return res.data as CourseReviewAdmin;
}

export async function deleteCourseReview(id: number): Promise<void> {
  await api.delete(`/admin/course-reviews/${id}`);
}
