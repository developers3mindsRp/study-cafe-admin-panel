import { useNavigate, useParams } from "react-router";
import { useState, useEffect } from "react";
import PageMeta from "../../components/common/PageMeta";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import CourseForm, { type CourseFormData } from "./CourseForm";
import { fetchCourse, updateCourse } from "../../api/courses";

export default function CourseEdit() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [course, setCourse] = useState<Awaited<ReturnType<typeof fetchCourse>>>(null);
  const [loading, setLoading] = useState(false);
  const [loadingPage, setLoadingPage] = useState(true);

  useEffect(() => {
    if (!id) return;
    fetchCourse(id)
      .then(setCourse)
      .finally(() => setLoadingPage(false));
  }, [id]);

  const handleSubmit = async (data: CourseFormData) => {
    if (!id) return;
    try {
      setLoading(true);
      await updateCourse(id, {
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
        course_cat_ids: data.course_cat_ids ?? [],
        affiliate_commission: Math.min(
          100,
          Math.max(0, Number(data.affiliate_commission)) || 0,
        ),
      });
      navigate("/courses");
    } catch (err) {
      console.error("Failed to update course", err);
      alert("Failed to update course");
    } finally {
      setLoading(false);
    }
  };

  if (loadingPage) return <div className="py-12 text-center text-gray-500">Loading...</div>;
  if (!course) return <div className="py-12 text-center text-gray-500">Course not found.</div>;

  return (
    <>
      <PageMeta title={`Edit ${course.title} | StudyCafe Admin`} description="Edit course" />
      <PageBreadcrumb pageTitle="Edit Course" />
      <CourseForm initial={course} onSubmit={handleSubmit} loading={loading} />
    </>
  );
}
