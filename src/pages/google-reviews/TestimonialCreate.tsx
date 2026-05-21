import { useState } from "react";
import { useNavigate } from "react-router";
import PageMeta from "../../components/common/PageMeta";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import GoogleReviewForm, { type GoogleReviewFormData } from "./TestimonialForm";
import { createGoogleReview } from "../../api/googleReviews";

export default function GoogleReviewCreate() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (formData: GoogleReviewFormData) => {
    try {
      setLoading(true);
      await createGoogleReview({
        ...formData,
        rating: formData.rating ? Number(formData.rating) : undefined,
        reviewed_at: formData.reviewed_at || undefined,
        sort_order: formData.sort_order ? Number(formData.sort_order) : 0,
      });
      navigate("/google-reviews");
    } catch (err: any) {
      console.error("Failed to create google review", err);
      alert(err.response?.data?.message || "Failed to create google review");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <PageMeta
        title="Create Google Review | StudyCafe Admin"
        description="Add new Google review for studycafe.in"
      />
      <PageBreadcrumb
        pageTitle="Create Google Review"
        compact
      />
      <GoogleReviewForm mode="create" onSubmit={handleSubmit} loading={loading} />
    </>
  );
}
