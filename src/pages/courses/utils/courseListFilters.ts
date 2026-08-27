/**
 * Client-side search/filter/sort for the admin courses list.
 * Shared by CoursesTable and the courses CSV export so both see the same rows.
 */
import type { Course } from "../../../api/courses";
import type { CourseSortFilter, PriceRangeFilter, PublicationFilter } from "../filterTypes";

function courseListPrice(c: Course): number {
  const n = Number(c.price);
  return Number.isFinite(n) ? n : 0;
}

export function courseEffectivePrice(c: Course): number {
  if (c.sale_price != null && c.sale_price !== "") {
    const sale = Number(c.sale_price);
    if (Number.isFinite(sale)) return sale;
  }
  return courseListPrice(c);
}

export function matchesPriceRange(c: Course, range: PriceRangeFilter): boolean {
  if (!range) return true;
  const p = courseEffectivePrice(c);
  switch (range) {
    case "0-500":
      return p < 500;
    case "500-2000":
      return p >= 500 && p < 2000;
    case "2000-5000":
      return p >= 2000 && p < 5000;
    case "5000+":
      return p >= 5000;
    default:
      return true;
  }
}

export function matchesCategory(c: Course, categoryId: string): boolean {
  if (!categoryId) return true;
  const id = Number(categoryId);
  if (!Number.isFinite(id)) return true;
  if (c.course_cat_ids?.includes(id)) return true;
  return Boolean(c.categories?.some((x) => x.id === id));
}

export function matchesPublication(c: Course, publication: PublicationFilter): boolean {
  if (!publication) return true;
  if (publication === "unlisted") return Boolean(c.hide_from_public);
  if (publication === "published") return Boolean(c.is_published);
  return !c.is_published;
}

export function matchesStartDateRange(c: Course, from: string, to: string): boolean {
  if (!from && !to) return true;
  if (!c.start_date) return false;
  const t = Date.parse(c.start_date);
  if (!Number.isFinite(t)) return false;
  if (from && t < Date.parse(from)) return false;
  if (to && t > Date.parse(to) + 86399999) return false;
  return true;
}

function parseTimeMs(value: string | undefined): number {
  if (!value) return 0;
  const t = Date.parse(value);
  return Number.isFinite(t) ? t : 0;
}

export function sortCoursesList(list: Course[], sort: CourseSortFilter): Course[] {
  if (!sort) return list;
  const copy = [...list];
  const idNum = (c: Course) => Number(c.id) || 0;
  switch (sort) {
    case "newest":
      return copy.sort((a, b) => {
        const d = parseTimeMs(b.created_at) - parseTimeMs(a.created_at);
        return d !== 0 ? d : idNum(b) - idNum(a);
      });
    case "oldest":
      return copy.sort((a, b) => {
        const d = parseTimeMs(a.created_at) - parseTimeMs(b.created_at);
        return d !== 0 ? d : idNum(a) - idNum(b);
      });
    default:
      return list;
  }
}

export interface CourseListCriteria {
  search: string;
  categoryId: string;
  membershipId: string;
  priceRange: PriceRangeFilter;
  publication: PublicationFilter;
  sortBy: CourseSortFilter;
  startDateFrom: string;
  startDateTo: string;
  /** Trash view lists deleted courses and applies search only. */
  isTrash: boolean;
  /** plan id → course ids; required only when `membershipId` is set. */
  planCoursesMap?: Record<number, number[]>;
}

/** True when anything beyond the default sort would narrow the list. */
export function courseListCriteriaAreActive(criteria: CourseListCriteria): boolean {
  return Boolean(
    criteria.search.trim() ||
      criteria.categoryId ||
      criteria.membershipId ||
      criteria.priceRange ||
      criteria.publication ||
      criteria.startDateFrom ||
      criteria.startDateTo,
  );
}

export function filterAndSortCourses(all: Course[], criteria: CourseListCriteria): Course[] {
  const search = criteria.search.trim().toLowerCase();
  let filtered = all;

  if (search) {
    filtered = filtered.filter(
      (c) =>
        (c.title && c.title.toLowerCase().includes(search)) ||
        (c.description && c.description.toLowerCase().includes(search)) ||
        (c.brief_description && c.brief_description.toLowerCase().includes(search)),
    );
  }

  if (!criteria.isTrash) {
    filtered = filtered.filter(
      (c) =>
        matchesCategory(c, criteria.categoryId) &&
        matchesPriceRange(c, criteria.priceRange) &&
        matchesPublication(c, criteria.publication) &&
        matchesStartDateRange(c, criteria.startDateFrom, criteria.startDateTo),
    );
    if (criteria.membershipId) {
      const planId = Number(criteria.membershipId);
      const courseIds = new Set(criteria.planCoursesMap?.[planId] ?? []);
      filtered = filtered.filter((c) => courseIds.has(Number(c.id)));
    }
  }

  return sortCoursesList(filtered, criteria.sortBy);
}
