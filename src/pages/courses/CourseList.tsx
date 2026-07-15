import { useCallback, useMemo, useState } from "react";
import { Link } from "react-router";
import PageMeta from "../../components/common/PageMeta";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import { ConfirmDeleteModal } from "../../components/ui/modal/ConfirmDeleteModal";
import { CoursesTable } from "../../components/tables";
import { FilterBar, FilterSearchInput, useFilterState } from "../../components/filters";
import type { FilterFieldDef } from "../../components/filters";
import { TrashScopeTabs, type TrashScope } from "../../components/trash/TrashScopeTabs";
import { deleteCourse, deleteCoursePermanently, fetchCourseCats, restoreCourse, type Course } from "../../api/courses";
import { plansApi } from "../../api/plans";
import type { CourseSortFilter, PriceRangeFilter, PublicationFilter } from "./filterTypes";

export default function CourseList() {
  const { values, set, reset, hasActive } = useFilterState({ sortBy: "newest" });
  const [search, setSearch] = useState("");
  const [dateFilterKey, setDateFilterKey] = useState(0);
  const [tableRefreshKey, setTableRefreshKey] = useState(0);
  const [trashScope, setTrashScope] = useState<TrashScope>("active");
  const [deleteTarget, setDeleteTarget] = useState<Course | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [restoreTarget, setRestoreTarget] = useState<Course | null>(null);
  const [isRestoreModalOpen, setIsRestoreModalOpen] = useState(false);
  const [restoreLoading, setRestoreLoading] = useState(false);
  const [permanentDeleteTarget, setPermanentDeleteTarget] = useState<Course | null>(null);
  const [isPermanentDeleteModalOpen, setIsPermanentDeleteModalOpen] = useState(false);
  const [permanentDeleteLoading, setPermanentDeleteLoading] = useState(false);
  const isTrash = trashScope === "trash";

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
        type: "async-select",
        id: "membershipId",
        label: "Membership",
        placeholder: "All memberships",
        loader: async () => {
          const res = await plansApi.list();
          return (res.data ?? []).map((p) => ({ value: String(p.id), label: p.name }));
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
          { value: "unlisted", label: "Unlisted" },
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

  const handleDeleteClick = (course: Course) => {
    setDeleteTarget(course);
    setIsDeleteModalOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    try {
      await deleteCourse(deleteTarget.id);
      setDeleteTarget(null);
      setIsDeleteModalOpen(false);
      setTableRefreshKey((k) => k + 1);
    } catch (err) {
      console.error("Failed to delete course", err);
      alert("Failed to move course to trash");
    }
  };

  const handleRestoreClick = (course: Course) => {
    setRestoreTarget(course);
    setIsRestoreModalOpen(true);
  };

  const handleRestoreConfirm = async () => {
    if (!restoreTarget) return;
    setRestoreLoading(true);
    try {
      await restoreCourse(restoreTarget.id);
      setRestoreTarget(null);
      setIsRestoreModalOpen(false);
      setTableRefreshKey((k) => k + 1);
    } catch (err) {
      console.error("Failed to restore course", err);
      alert("Failed to restore course");
    } finally {
      setRestoreLoading(false);
    }
  };

  const handlePermanentDeleteClick = (course: Course) => {
    setPermanentDeleteTarget(course);
    setIsPermanentDeleteModalOpen(true);
  };

  const handlePermanentDeleteConfirm = async () => {
    if (!permanentDeleteTarget) return;
    setPermanentDeleteLoading(true);
    try {
      await deleteCoursePermanently(permanentDeleteTarget.id);
      setPermanentDeleteTarget(null);
      setIsPermanentDeleteModalOpen(false);
      setTableRefreshKey((k) => k + 1);
    } catch (err) {
      console.error("Failed to permanently delete course", err);
      alert("Failed to permanently delete course");
    } finally {
      setPermanentDeleteLoading(false);
    }
  };

  return (
    <>
      <PageMeta title="Courses | StudyCafe Admin" description="Manage courses" />
      <PageBreadcrumb
        pageTitle="Courses"
        actions={
          !isTrash ? (
            <Link
              to="/courses/create"
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-brand-500 px-4 py-3 text-sm font-medium text-white shadow-theme-xs hover:bg-brand-600"
            >
              Create Course
            </Link>
          ) : null
        }
      />
      <div className="space-y-6">
        <TrashScopeTabs value={trashScope} onChange={setTrashScope} />
        <div className="space-y-4">
          <FilterSearchInput
            value={search}
            onChange={setSearch}
            placeholder="Search courses…"
            className="w-full sm:max-w-sm"
          />
          {!isTrash ? (
            <FilterBar
              fields={courseFilterFields}
              values={values}
              onChange={set}
              onReset={handleResetFilters}
              hasActive={hasActive}
              resetKey={dateFilterKey}
            />
          ) : null}
        </div>
        <CoursesTable
          key={`${trashScope}-${tableRefreshKey}`}
          filterCategoryId={values.categoryId ?? ""}
          filterMembershipId={values.membershipId ?? ""}
          filterPriceRange={(values.priceRange ?? "") as PriceRangeFilter}
          filterPublication={(values.publication ?? "") as PublicationFilter}
          filterSortBy={(values.sortBy ?? "") as CourseSortFilter}
          filterStartDateFrom={values.startDateFrom ?? ""}
          filterStartDateTo={values.startDateTo ?? ""}
          filterSearch={search}
          trashScope={trashScope}
          onDeleteClick={handleDeleteClick}
          onRestoreClick={handleRestoreClick}
          onPermanentDeleteClick={handlePermanentDeleteClick}
        />
      </div>

      <ConfirmDeleteModal
        isOpen={isDeleteModalOpen}
        onClose={() => {
          setDeleteTarget(null);
          setIsDeleteModalOpen(false);
        }}
        onConfirm={handleDeleteConfirm}
        title="Move to Trash"
        message={
          deleteTarget
            ? `Move "${deleteTarget.title}" to trash? You can restore it later from the Trash tab.`
            : undefined
        }
        confirmLabel="Move to Trash"
      />

      <ConfirmDeleteModal
        isOpen={isRestoreModalOpen}
        onClose={() => {
          setRestoreTarget(null);
          setIsRestoreModalOpen(false);
        }}
        onConfirm={handleRestoreConfirm}
        title="Restore Course"
        message={
          restoreTarget
            ? `Restore "${restoreTarget.title}"? It will appear again in the Active list.`
            : undefined
        }
        confirmLabel="Restore"
        loadingLabel="Restoring…"
        confirmVariant="brand"
        isLoading={restoreLoading}
      />

      <ConfirmDeleteModal
        isOpen={isPermanentDeleteModalOpen}
        onClose={() => {
          setPermanentDeleteTarget(null);
          setIsPermanentDeleteModalOpen(false);
        }}
        onConfirm={handlePermanentDeleteConfirm}
        title="Delete Permanently"
        message={
          permanentDeleteTarget
            ? `Permanently delete "${permanentDeleteTarget.title}"? This removes the course and all its batches, sessions, materials, enrollments, and reviews forever and cannot be undone.`
            : undefined
        }
        confirmLabel="Delete Permanently"
        loadingLabel="Deleting…"
        isLoading={permanentDeleteLoading}
      />
    </>
  );
}
