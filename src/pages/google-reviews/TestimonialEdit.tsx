import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router";
import PageMeta from "../../components/common/PageMeta";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import GoogleReviewForm, { type GoogleReviewFormData } from "./TestimonialForm";
import { fetchGoogleReview, updateGoogleReview, GoogleReview } from "../../api/googleReviews";

export default function GoogleReviewEdit() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [data, setData] = useState<GoogleReview | null>(null);

  useEffect(() => {
    if (id) {
      loadTestimonial(Number(id));
    }
  }, [id]);

  const loadTestimonial = async (testimonialId: number) => {
    try {
      setLoading(true);
      const item = await fetchGoogleReview(testimonialId);
      setData(item);
    } catch (err) {
      console.error("Failed to load testimonial", err);
      alert("Failed to load testimonial or it does not exist.");
      navigate("/google-reviews");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (formData: GoogleReviewFormData) => {
    if (!id) return;
    try {
      setSaving(true);
      await updateGoogleReview(Number(id), {
        ...formData,
        rating: formData.rating ? Number(formData.rating) : undefined,
        reviewed_at: formData.reviewed_at || undefined,
        sort_order: formData.sort_order ? Number(formData.sort_order) : 0,
      });
      alert("Google review updated successfully!");
      navigate(`/google-reviews/${id}/edit`);
    } catch (err: any) {
      console.error("Failed to update google review", err);
      alert(err.response?.data?.message || "Failed to update google review");
    } finally {
      setSaving(false);
    }
  };

  if (loading || !data) {
    return (
      <div className="flex items-center justify-center p-20">
        <p className="text-gray-500">Loading google review...</p>
      </div>
    );
  }

  const defaultValues: GoogleReviewFormData = {
    content: data.content,
    author_name: data.author_name,
    author_role: data.author_role || "",
    rating: data.rating ? String(data.rating) : "",
    reviewed_at: data.reviewed_at || "",
    sort_order: String(data.sort_order),
  };

  return (
    <>
      <PageMeta
        title="Edit Google Review | StudyCafe Admin"
        description="Edit Google review for studycafe.in"
      />
      <PageBreadcrumb
        pageTitle="Edit Google Review"
        compact
      />
      <GoogleReviewForm
        mode="edit"
        defaultValues={defaultValues}
        loading={saving}
        onSubmit={handleSubmit}
      />
    </>
  );
}
