import { useState, useRef, useCallback } from "react";
import PageMeta from "../../components/common/PageMeta";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import { ConfirmDeleteModal } from "../../components/ui/modal/ConfirmDeleteModal";
import { DataTable, type DataTableRef } from "../../components/tables/data-table/DataTable";
import { PencilIcon, TrashBinIcon } from "../../icons";
import { useModal } from "../../hooks/useModal";
import { RequirePermission } from "../../components/auth/RequirePermission";
import {
  PERM_COURSE_REVIEWS_VIEW,
  PERM_COURSE_REVIEWS_EDIT,
  PERM_COURSE_REVIEWS_DELETE,
  PERM_COURSES_VIEW,
} from "../../constants/permissions";
import {
  fetchCourseReviewsTable,
  deleteCourseReview,
  updateCourseReview,
  type CourseReviewAdmin,
} from "../../api/courseReviews";

function formatWhen(iso?: string): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function CourseReviewList() {
  const [deleteTarget, setDeleteTarget] = useState<CourseReviewAdmin | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [editRow, setEditRow] = useState<CourseReviewAdmin | null>(null);
  const [editRating, setEditRating] = useState(5);
  const [editBody, setEditBody] = useState("");
  const [saving, setSaving] = useState(false);
  const { isOpen: isDeleteModalOpen, openModal: openDeleteModal, closeModal: closeDeleteModal } = useModal();
  const dataTableRef = useRef<DataTableRef>(null);

  const handleDeleteClick = useCallback(
    (row: CourseReviewAdmin) => {
      setDeleteTarget(row);
      openDeleteModal();
    },
    [openDeleteModal]
  );

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await deleteCourseReview(deleteTarget.id);
      dataTableRef.current?.refetch();
      setDeleteTarget(null);
      closeDeleteModal();
    } catch (err: unknown) {
      console.error(err);
      alert((err as { message?: string })?.message || "Failed to delete review");
    } finally {
      setDeleting(false);
    }
  };

  const openEdit = (row: CourseReviewAdmin) => {
    setEditRow(row);
    setEditRating(row.rating);
    setEditBody(row.body || "");
  };

  const saveEdit = async () => {
    if (!editRow) return;
    setSaving(true);
    try {
      await updateCourseReview(editRow.id, { rating: editRating, body: editBody || null });
      setEditRow(null);
      dataTableRef.current?.refetch();
    } catch (err: unknown) {
      console.error(err);
      alert((err as { message?: string })?.message || "Failed to update");
    } finally {
      setSaving(false);
    }
  };

  const columns = [
    {
      key: "course_title",
      header: "Course",
      sortable: false,
      render: (row: CourseReviewAdmin) => (
        <span className="font-medium text-gray-800 text-theme-sm dark:text-white/90">
          {row.course_title || `Course #${row.course_id}`}
        </span>
      ),
    },
    {
      key: "user_name",
      header: "Learner",
      sortable: false,
      render: (row: CourseReviewAdmin) => (
        <div>
          <span className="block text-gray-800 text-theme-sm dark:text-white/90">{row.user_name || "—"}</span>
          <span className="block text-gray-500 text-theme-xs dark:text-gray-400">{row.user_email || ""}</span>
        </div>
      ),
    },
    {
      key: "rating",
      header: "Rating",
      sortable: true,
      render: (row: CourseReviewAdmin) => <span>{row.rating} / 5</span>,
    },
    {
      key: "body",
      header: "Review",
      sortable: false,
      render: (row: CourseReviewAdmin) => (
        <div className="max-w-md text-gray-600 text-theme-sm dark:text-gray-400">
          <span className="line-clamp-3">{row.body || "—"}</span>
        </div>
      ),
    },
    {
      key: "created_at",
      header: "Submitted",
      sortable: true,
      render: (row: CourseReviewAdmin) => (
        <span className="text-gray-500 text-theme-sm dark:text-gray-400">{formatWhen(row.created_at)}</span>
      ),
    },
    {
      key: "actions",
      header: "Actions",
      align: "end" as const,
      sortable: false,
      render: (row: CourseReviewAdmin) => (
        <div className="flex items-center justify-end gap-2">
          <RequirePermission permissions={[PERM_COURSE_REVIEWS_EDIT]} fallback={null}>
            <button
              type="button"
              onClick={() => openEdit(row)}
              className="inline-flex items-center justify-center gap-1.5 rounded-lg px-2.5 py-2 text-sm text-gray-600 transition hover:bg-gray-100 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-white"
              title="Edit"
            >
              <PencilIcon className="size-4 shrink-0 fill-current" />
              Edit
            </button>
          </RequirePermission>
          <RequirePermission permissions={[PERM_COURSE_REVIEWS_DELETE]} fallback={null}>
            <button
              type="button"
              onClick={() => handleDeleteClick(row)}
              className="inline-flex items-center justify-center gap-1.5 rounded-lg px-2.5 py-2 text-sm text-gray-600 transition hover:bg-error-50 hover:text-error-500 dark:text-gray-400 dark:hover:bg-error-500/10 dark:hover:text-error-400"
              title="Delete"
            >
              <TrashBinIcon className="size-4 shrink-0 fill-current" />
              Delete
            </button>
          </RequirePermission>
        </div>
      ),
    },
  ];

  return (
    <>
      <PageMeta title="Course reviews | StudyCafe Admin" description="Learner ratings and feedback" />
      <RequirePermission permissions={[PERM_COURSE_REVIEWS_VIEW, PERM_COURSES_VIEW]} fallback={<p className="p-6 text-gray-600">Access denied.</p>}>
        <PageBreadcrumb pageTitle="Course reviews" />

        <div className="space-y-6">
          <DataTable<CourseReviewAdmin>
            ref={dataTableRef}
            columns={columns}
            fetchData={fetchCourseReviewsTable}
            initialPageSize={20}
            initialSortBy="created_at"
            initialSortOrder="DESC"
            pageSizeOptions={[10, 20, 50]}
            enableSearch={false}
            enableSorting
            enablePagination
            emptyMessage="No reviews yet."
          />
        </div>
      </RequirePermission>

      <ConfirmDeleteModal
        isOpen={isDeleteModalOpen && !!deleteTarget}
        title="Delete this review?"
        message="This permanently removes the learner’s feedback for this course."
        isLoading={deleting}
        onConfirm={handleDeleteConfirm}
        onClose={() => {
          setDeleteTarget(null);
          closeDeleteModal();
        }}
      />

      {editRow ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-lg max-h-[90vh] overflow-auto rounded-xl bg-white p-6 shadow-lg dark:bg-gray-900">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Edit review</h2>
            <p className="mt-1 text-sm text-gray-500">
              {editRow.course_title || `Course #${editRow.course_id}`} — {editRow.user_name || editRow.user_email || "Learner"}
            </p>
            <div className="mt-4 space-y-3">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Rating (1–5)
                <input
                  type="number"
                  min={1}
                  max={5}
                  className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 dark:border-gray-600 dark:bg-gray-800"
                  value={editRating}
                  onChange={(e) => setEditRating(Number(e.target.value))}
                />
              </label>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Review text
                <textarea
                  className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 dark:border-gray-600 dark:bg-gray-800"
                  rows={5}
                  value={editBody}
                  onChange={(e) => setEditBody(e.target.value)}
                />
              </label>
            </div>
            <div className="mt-6 flex justify-end gap-2">
              <button
                type="button"
                className="rounded-lg border border-gray-300 px-4 py-2 text-sm dark:border-gray-600"
                onClick={() => setEditRow(null)}
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={saving}
                className="rounded-lg bg-brand-500 px-4 py-2 text-sm font-medium text-white hover:bg-brand-600 disabled:opacity-60"
                onClick={() => void saveEdit()}
              >
                {saving ? "Saving…" : "Save"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
