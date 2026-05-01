import { useNavigate } from "react-router";
import PageMeta from "../../components/common/PageMeta";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import CourseForm, { type CourseFormData } from "./CourseForm";
import { createCourse, createBatch } from "../../api/courses";
import { useState } from "react";

export default function CourseCreate() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (data: CourseFormData) => {
    try {
      setLoading(true);
      const course = await createCourse({
        title: data.title,
        short_title: data.short_title || null,
        slug: data.slug || null,
        brief_description: data.brief_description || null,
        description: data.description || null,
        curriculum: data.curriculum?.length ? JSON.stringify(data.curriculum) : null,
        learn_outcomes: data.learn_outcomes?.length ? JSON.stringify(data.learn_outcomes) : null,
        requirements: data.requirements || null,
        terms_conditions: data.terms_conditions?.length ? JSON.stringify(data.terms_conditions) : null,
        price: Number(data.price) || 0,
        sale_price: data.sale_price ? Number(data.sale_price) : null,
        thumbnail_url: data.thumbnail_url || null,
        youtube_url: data.youtube_url || null,
        language: data.language || null,
        course_type: data.course_type || null,
        taxable: data.taxable,
        keywords: data.keywords || null,
        meta_title: data.meta_title || null,
        meta_description: data.meta_description || null,
        meta_keywords: data.meta_keywords || null,
        faqs: data.faqs?.length ? JSON.stringify(data.faqs) : null,
        includes_info: data.includes_info?.length ? JSON.stringify(data.includes_info) : null,
        course_includes: data.course_includes?.length ? JSON.stringify(data.course_includes) : null,
        feedback: data.feedback?.length ? JSON.stringify(data.feedback) : null,
        certifications: data.certifications || null,
        gateway: data.gateway || null,
        is_published: data.is_published,
        author_user_id: data.author_user_id ? Number(data.author_user_id) : null,
        author_name: data.author_name || null,
        author_role: data.author_role || null,
        author_bio: data.author_bio || null,
        author_image: data.author_image || null,
        course_cat_ids: data.course_cat_ids?.length ? data.course_cat_ids : [],
        affiliate_commission: Math.min(
          100,
          Math.max(0, Number(data.affiliate_commission)) || 0,
        ),
      });

      // Auto-create the default batch from curriculum if curriculum was provided
      if (data.curriculum?.length && course?.id) {
        try {
          await createBatch(String(course.id), {
            start_date: data.default_batch_start_date || null,
            meet_link: data.default_batch_meet_link || null,
          });
        } catch (batchErr) {
          console.error("Course created but default batch creation failed", batchErr);
        }
      }

      navigate("/courses");
    } catch (err) {
      console.error("Failed to create course", err);
      alert("Failed to create course");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <PageMeta title="Create Course | StudyCafe Admin" description="Create a new course" />
      <PageBreadcrumb pageTitle="Create Course" />
      <CourseForm onSubmit={handleSubmit} loading={loading} />
    </>
  );
}
