import { useState } from "react";
import { useNavigate } from "react-router";
import PageMeta from "../../components/common/PageMeta";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import TestimonialForm, { type TestimonialFormData } from "./TestimonialForm";
import { createTestimonial } from "../../api/testimonials";

export default function TestimonialCreate() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (formData: TestimonialFormData) => {
    try {
      setLoading(true);
      await createTestimonial({
        title: formData.title || undefined,
        media_type: formData.media_type,
        media_url: formData.media_url,
        video_url:
          formData.media_type === "video" ? formData.video_url || undefined : undefined,
        sort_order: formData.sort_order ? Number(formData.sort_order) : 0,
      });
      navigate("/testimonials");
    } catch (err: any) {
      console.error("Failed to create testimonial", err);
      alert(err.response?.data?.message || "Failed to create testimonial");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <PageMeta
        title="Create Testimonial | StudyCafe Admin"
        description="Add video or image testimonial"
      />
      <PageBreadcrumb pageTitle="Create Testimonial" compact />
      <TestimonialForm mode="create" onSubmit={handleSubmit} loading={loading} />
    </>
  );
}
