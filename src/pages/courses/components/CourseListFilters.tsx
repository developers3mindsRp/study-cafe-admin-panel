import { useEffect, useState } from "react";
import { fetchCourseCats, type CourseCat } from "../../../api/courses";
import type { PriceRangeFilter, PublicationFilter } from "../filterTypes";

const selectClass =
  "min-w-[160px] rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-800 transition focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20 dark:border-gray-700 dark:bg-gray-800 dark:text-white/90";

export interface CourseListFiltersProps {
  categoryId: string;
  onCategoryIdChange: (value: string) => void;
  priceRange: PriceRangeFilter;
  onPriceRangeChange: (value: PriceRangeFilter) => void;
  publication: PublicationFilter;
  onPublicationChange: (value: PublicationFilter) => void;
}

export function CourseListFilters({
  categoryId,
  onCategoryIdChange,
  priceRange,
  onPriceRangeChange,
  publication,
  onPublicationChange,
}: CourseListFiltersProps) {
  const [cats, setCats] = useState<CourseCat[]>([]);

  useEffect(() => {
    let cancelled = false;
    fetchCourseCats()
      .then((list) => {
        if (!cancelled) setCats(list);
      })
      .catch(() => {
        if (!cancelled) setCats([]);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const hasFilters = Boolean(categoryId || priceRange || publication);

  const clearAll = () => {
    onCategoryIdChange("");
    onPriceRangeChange("");
    onPublicationChange("");
  };

  return (
    <div className="flex flex-wrap items-end gap-3 rounded-2xl border border-gray-200 bg-white p-4 shadow-theme-xs dark:border-gray-800 dark:bg-white/[0.03]">
      <div className="flex min-w-[180px] flex-col gap-1.5">
        <label htmlFor="course-filter-category" className="text-theme-xs font-medium text-gray-600 dark:text-gray-400">
          Category
        </label>
        <select
          id="course-filter-category"
          className={selectClass}
          value={categoryId}
          onChange={(e) => onCategoryIdChange(e.target.value)}
        >
          <option value="">All categories</option>
          {cats.map((c) => (
            <option key={c.id} value={String(c.id)}>
              {c.name}
            </option>
          ))}
        </select>
      </div>
      <div className="flex min-w-[180px] flex-col gap-1.5">
        <label htmlFor="course-filter-price" className="text-theme-xs font-medium text-gray-600 dark:text-gray-400">
          Price
        </label>
        <select
          id="course-filter-price"
          className={selectClass}
          value={priceRange}
          onChange={(e) => onPriceRangeChange(e.target.value as PriceRangeFilter)}
        >
          <option value="">Any price</option>
          <option value="0-500">Under ₹500</option>
          <option value="500-2000">₹500 – ₹2,000</option>
          <option value="2000-5000">₹2,000 – ₹5,000</option>
          <option value="5000+">₹5,000 and above</option>
        </select>
      </div>
      <div className="flex min-w-[160px] flex-col gap-1.5">
        <label htmlFor="course-filter-published" className="text-theme-xs font-medium text-gray-600 dark:text-gray-400">
          Visibility
        </label>
        <select
          id="course-filter-published"
          className={selectClass}
          value={publication}
          onChange={(e) => onPublicationChange(e.target.value as PublicationFilter)}
        >
          <option value="">All</option>
          <option value="published">Published</option>
          <option value="draft">Draft</option>
        </select>
      </div>
      {hasFilters && (
        <button
          type="button"
          onClick={clearAll}
          className="ml-auto rounded-lg px-3 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-white"
        >
          Clear filters
        </button>
      )}
    </div>
  );
}
