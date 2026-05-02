import { useState } from "react";
import { Link } from "react-router";
import PageMeta from "../../components/common/PageMeta";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import { CoursesTable } from "../../components/tables";
import { CourseListFilters } from "./components/CourseListFilters";
import type { CourseSortFilter, PriceRangeFilter, PublicationFilter } from "./filterTypes";

export default function CourseList() {
  const [categoryId, setCategoryId] = useState("");
  const [priceRange, setPriceRange] = useState<PriceRangeFilter>("");
  const [publication, setPublication] = useState<PublicationFilter>("");
  const [sortBy, setSortBy] = useState<CourseSortFilter>("newest");

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
        <CourseListFilters
          categoryId={categoryId}
          onCategoryIdChange={setCategoryId}
          priceRange={priceRange}
          onPriceRangeChange={setPriceRange}
          publication={publication}
          onPublicationChange={setPublication}
          sortBy={sortBy}
          onSortByChange={setSortBy}
        />
        <CoursesTable
          filterCategoryId={categoryId}
          filterPriceRange={priceRange}
          filterPublication={publication}
          filterSortBy={sortBy}
        />
      </div>
    </>
  );
}
