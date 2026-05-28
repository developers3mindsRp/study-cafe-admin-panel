import { useState, useEffect } from "react";
import { Link, useNavigate, useParams } from "react-router";
import PageMeta from "../../components/common/PageMeta";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import { ConfirmDeleteModal } from "../../components/ui/modal/ConfirmDeleteModal";
import { useModal } from "../../hooks/useModal";
import { RequirePermission } from "../../components/auth/RequirePermission";
import { PERM_GOOGLE_REVIEWS_EDIT, PERM_GOOGLE_REVIEWS_DELETE } from "../../constants/permissions";
import { fetchGoogleReview, deleteGoogleReview, GoogleReview } from "../../api/googleReviews";

export default function GoogleReviewView() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [review, setReview] = useState<GoogleReview | null>(null);
  const [loading, setLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState(false);

  const {
    isOpen: isDeleteModalOpen,
    openModal: openDeleteModal,
    closeModal: closeDeleteModal,
  } = useModal();

  useEffect(() => {
    if (id) {
      loadTestimonial(Number(id));
    }
  }, [id]);

  const loadTestimonial = async (testimonialId: number) => {
    try {
      setLoading(true);
      const data = await fetchGoogleReview(testimonialId);
      setReview(data);
    } catch (err) {
      console.error("Failed to load testimonial", err);
      alert("Failed to load testimonial or it does not exist.");
      navigate("/google-reviews");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!id) return;
    try {
      setIsDeleting(true);
      await deleteGoogleReview(Number(id));
      closeDeleteModal();
      navigate("/google-reviews");
    } catch (err: any) {
      console.error("Failed to delete testimonial", err);
      alert(err.response?.data?.message || "Failed to delete testimonial");
    } finally {
      setIsDeleting(false);
    }
  };

  if (loading || !review) {
    return (
      <div className="flex items-center justify-center p-20">
        <p className="text-gray-500">Loading testimonial...</p>
      </div>
    );
  }

  return (
    <>
      <PageMeta
        title={`${review.author_name} | StudyCafe Admin`}
        description="View Google review for studycafe.in"
      />
      <PageBreadcrumb
        pageTitle={review.author_name}
        compact
        actions={
          <div className="flex items-center gap-2">
            <RequirePermission permissions={[PERM_GOOGLE_REVIEWS_EDIT]} fallback={null}>
              <Link
                to={`/google-reviews/${id}/edit`}
                className="inline-flex items-center justify-center gap-2 rounded-lg px-4 py-3 text-sm font-medium text-white transition bg-brand-500 shadow-theme-xs hover:bg-brand-600"
              >
                Edit
              </Link>
            </RequirePermission>
            <RequirePermission permissions={[PERM_GOOGLE_REVIEWS_DELETE]} fallback={null}>
              <button
                type="button"
                onClick={openDeleteModal}
                disabled={isDeleting}
                className="inline-flex items-center justify-center gap-2 rounded-lg px-4 py-3 text-sm font-medium text-white transition bg-error-500 shadow-theme-xs hover:bg-error-600 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isDeleting ? "Deleting..." : "Delete"}
              </button>
            </RequirePermission>
          </div>
        }
      />

      <div className="space-y-6">
        <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] sm:p-6">
          <div className="space-y-4">
            <div>
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                Quote / Content
              </p>
              <p className="mt-1 text-gray-800 dark:text-white/90 italic">
                "{review.content}"
              </p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                Author
              </p>
              <p className="text-gray-800 dark:text-white/90">
                {review.author_name}
              </p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                Role / Designation
              </p>
              <p className="text-gray-800 dark:text-white/90">
                {review.author_role}
              </p>
            </div>
            <div className="flex gap-10">
              <div>
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                  Rating
                </p>
                <p className="text-gray-800 dark:text-white/90">
                  {review.rating || "-"}
                </p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                  Time Ago
                </p>
                <p className="text-gray-800 dark:text-white/90">
                  {review.reviewed_at || "—"}
                </p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                  Sort Order
                </p>
                <p className="text-gray-800 dark:text-white/90">
                  {review.sort_order}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <ConfirmDeleteModal
        isOpen={isDeleteModalOpen}
        onClose={closeDeleteModal}
        onConfirm={handleDeleteConfirm}
        title="Delete Google Review"
        itemName={review.author_name}
      />
    </>
  );
}
