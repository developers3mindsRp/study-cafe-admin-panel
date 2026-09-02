import { useNavigate, useSearchParams } from "react-router";
import { useState, useEffect } from "react";
import PageMeta from "../../components/common/PageMeta";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import CourseForm, { type CourseFormData } from "./CourseForm";
import {
  serializePostPurchaseDelay,
  serializePostPurchaseLinks,
} from "./components/postPurchase";
import { createCourse, createBatch, fetchCourse, type Course } from "../../api/courses";
import { updateCoursePlans } from "../../api/plans";
import { getApiErrorMessage } from "../../lib/apiError";
import { buildCourseDuplicateInitial } from "../../lib/courseDuplicate";
import { toast } from "react-toastify";

export default function CourseCreate() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const duplicateFrom = searchParams.get("duplicateFrom")?.trim() || "";
  const [loading, setLoading] = useState(false);
  const [duplicateInitial, setDuplicateInitial] = useState<Course | null>(null);
  const [duplicateLoadError, setDuplicateLoadError] = useState<string | null>(null);
  const [duplicateLoading, setDuplicateLoading] = useState(Boolean(duplicateFrom));

  useEffect(() => {
    if (!duplicateFrom) {
      setDuplicateInitial(null);
      setDuplicateLoadError(null);
      setDuplicateLoading(false);
      return;
    }
    let cancelled = false;
    setDuplicateLoading(true);
    setDuplicateLoadError(null);
    fetchCourse(duplicateFrom)
      .then((c) => {
        if (cancelled) return;
        if (!c) {
          setDuplicateLoadError("Course not found.");
          setDuplicateInitial(null);
          return;
        }
        setDuplicateInitial(buildCourseDuplicateInitial(c));
      })
      .catch(() => {
        if (!cancelled) {
          setDuplicateLoadError("Could not load course to duplicate.");
          setDuplicateInitial(null);
        }
      })
      .finally(() => {
        if (!cancelled) setDuplicateLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [duplicateFrom]);

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
        enrolled_count: Math.max(0, parseInt(String(data.enrolled_count), 10) || 0),
        ratings: (() => {
          const t = String(data.ratings ?? "").trim();
          if (!t) return null;
          const n = Number(t);
          return Number.isFinite(n) ? n : null;
        })(),
        rating_users: Math.max(0, parseInt(String(data.rating_users), 10) || 0),
        course_type: data.course_type || null,
        taxable: data.taxable,
        keywords: data.keywords || null,
        meta_title: data.meta_title || null,
        meta_description: data.meta_description || null,
        meta_keywords: data.meta_keywords || null,
        canonical_url: data.canonical_url?.trim() || null,
        robots: data.robots?.trim() || null,
        og_title: data.og_title?.trim() || null,
        og_description: data.og_description?.trim() || null,
        og_image_url: data.og_image_url?.trim() || null,
        faqs: data.faqs?.length ? JSON.stringify(data.faqs) : null,
        includes_info: data.includes_info?.length ? JSON.stringify(data.includes_info) : null,
        course_includes: data.course_includes?.length ? JSON.stringify(data.course_includes) : null,
        feedback: data.feedback?.length ? JSON.stringify(data.feedback) : null,
        certifications: data.certifications || null,
        gateway: data.gateway || null,
        is_published: data.is_published,
        hide_from_public: data.hide_from_public,
        certificate_enabled: data.certificate_enabled,
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
        validity: data.validity ?? '1year',
        detail_sections: data.detail_sections?.length ? JSON.stringify(data.detail_sections) : null,
        post_purchase_links: serializePostPurchaseLinks(data.post_purchase_links),
        post_purchase_redirect_url: data.post_purchase_redirect_url?.trim() || null,
        post_purchase_redirect_delay: serializePostPurchaseDelay(data.post_purchase_redirect_delay),
      });

      // Link the new course to the selected memberships (plan_courses).
      if (course?.id && data.plan_ids?.length) {
        try {
          await updateCoursePlans(Number(course.id), data.plan_ids);
        } catch (planErr) {
          console.error("Course created but membership links failed", planErr);
          toast.warning("Course created, but membership links could not be saved. You can set them from the course.");
        }
      }

      // Auto-create the default batch from curriculum if curriculum was provided
      if (data.curriculum?.length && course?.id) {
        try {
          await createBatch(String(course.id), {
            start_date: data.default_batch_start_date || null,
            meet_link: data.default_batch_meet_link || null,
          });
          toast.success("Course created successfully!");
        } catch (batchErr) {
          console.error("Course created but default batch creation failed", batchErr);
          toast.warning("Course created, but the default batch could not be set up. You can add batches manually from the course.");
        }
      } else {
        toast.success("Course created successfully!");
      }

      navigate("/courses");
    } catch (err: unknown) {
      console.error("Failed to create course", err);
      toast.error(getApiErrorMessage(err, "Failed to create course. Please try again."));
    } finally {
      setLoading(false);
    }
  };

  if (duplicateFrom && duplicateLoading) {
    return (
      <>
        <PageMeta title="Duplicate Course | StudyCafe Admin" description="Create a course from an existing one" />
        <PageBreadcrumb pageTitle="Duplicate Course" />
        <div className="py-12 text-center text-gray-500 dark:text-gray-400">Loading course…</div>
      </>
    );
  }

  if (duplicateFrom && duplicateLoadError) {
    return (
      <>
        <PageMeta title="Duplicate Course | StudyCafe Admin" description="Create a course from an existing one" />
        <PageBreadcrumb pageTitle="Duplicate Course" />
        <div className="rounded-xl border border-error-200 bg-error-50 px-4 py-6 text-center text-error-800 dark:border-error-900/50 dark:bg-error-950/30 dark:text-error-200">
          <p className="mb-4">{duplicateLoadError}</p>
          <button
            type="button"
            className="rounded-lg bg-brand-500 px-4 py-2 text-sm font-medium text-white hover:bg-brand-600"
            onClick={() => navigate("/courses/create", { replace: true })}
          >
            Start blank course instead
          </button>
        </div>
      </>
    );
  }

  const isDuplicate = Boolean(duplicateFrom && duplicateInitial);

  return (
    <>
      <PageMeta
        title={isDuplicate ? "Duplicate Course | StudyCafe Admin" : "Create Course | StudyCafe Admin"}
        description={isDuplicate ? "Review cloned fields and save as a new course" : "Create a new course"}
      />
      <PageBreadcrumb pageTitle={isDuplicate ? "Duplicate course" : "Create Course"} />
      <CourseForm
        key={duplicateFrom || "new"}
        initial={duplicateInitial ?? undefined}
        onSubmit={handleSubmit}
        loading={loading}
      />
    </>
  );
}
