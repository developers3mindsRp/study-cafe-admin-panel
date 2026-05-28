import { useCallback, useMemo, useState } from "react";
import { Link } from "react-router";
import PageMeta from "../../components/common/PageMeta";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import { CoursesTable } from "../../components/tables";
import { FilterBar, useFilterState } from "../../components/filters";
import type { FilterFieldDef } from "../../components/filters";
import { fetchCourseCats } from "../../api/courses";
import type { CourseSortFilter, PriceRangeFilter, PublicationFilter } from "./filterTypes";

export default function CourseList() {
  const { values, set, reset, hasActive } = useFilterState({ sortBy: "newest" });
  const [dateFilterKey, setDateFilterKey] = useState(0);

  const handleResetFilters = useCallback(() => {
    reset();
    setDateFilterKey((k) => k + 1);
  }, [reset]);

  const courseFilterFields: FilterFieldDef[] = useMemo(
    () => [
      {
        type: "select",
        id: "priceRange",
        label: "Price",
        placeholder: "Any price",
        options: [
          { value: "0-500", label: "Under ₹500" },
          { value: "500-2000", label: "₹500 – ₹2,000" },
          { value: "2000-5000", label: "₹2,000 – ₹5,000" },
          { value: "5000+", label: "₹5,000 and above" },
        ],
      },
      {
        type: "month-select",
        id: "startDate",
        label: "Start Date",
        fromId: "startDateFrom",
        toId: "startDateTo",
      },
      {
        type: "async-select",
        id: "categoryId",
        label: "Category",
        placeholder: "All categories",
        loader: async () => {
          const cats = await fetchCourseCats();
          return cats.map((c) => ({ value: String(c.id), label: c.name }));
        },
      },
      {
        type: "select",
        id: "publication",
        label: "Visibility",
        placeholder: "All",
        options: [
          { value: "published", label: "Published" },
          { value: "draft", label: "Draft" },
        ],
      },
      {
        type: "select",
        id: "sortBy",
        label: "Sort by",
        placeholder: "Default",
        options: [
          { value: "newest", label: "Newest" },
          { value: "oldest", label: "Oldest" },
        ],
      },
    ],
    []
  );

  return (
    <>
      <PageMeta title="Courses | StudyCafe Admin" description="Manage courses" />
      <PageBreadcrumb
        pageTitle="Courses"
        actions={
          <Link
            to="/courses/create"
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-brand-500 px-4 py-3 text-sm font-medium text-white shadow-theme-xs hover:bg-brand-600"
          >
            Create Course
          </Link>
        }
      />
      <div className="space-y-6">
        <FilterBar
          fields={courseFilterFields}
          values={values}
          onChange={set}
          onReset={handleResetFilters}
          hasActive={hasActive}
          resetKey={dateFilterKey}
        />
        <CoursesTable
          filterCategoryId={values.categoryId ?? ""}
          filterPriceRange={(values.priceRange ?? "") as PriceRangeFilter}
          filterPublication={(values.publication ?? "") as PublicationFilter}
          filterSortBy={(values.sortBy ?? "") as CourseSortFilter}
          filterStartDateFrom={values.startDateFrom ?? ""}
          filterStartDateTo={values.startDateTo ?? ""}
        />
      </div>
    </>
  );
}
