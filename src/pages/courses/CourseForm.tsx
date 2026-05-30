import { useState, useEffect, useCallback, useMemo } from "react";
import { useNavigate, useLocation } from "react-router";
import Label from "../../components/form/Label";
import Input from "../../components/form/input/InputField";
import TextArea from "../../components/form/input/TextArea";
import ImageUpload from "../../components/form/ImageUpload";
import Button from "../../components/ui/button/Button";
import ArticleEditor from "../../components/article-editor/ArticleEditor";
import RichTextEditor from "../../components/form/RichTextEditor";
import { ArrayEditor } from "./components/ArrayEditor";
import IncludesInfoEditor, { type IncludesInfoItem } from "./components/IncludesInfoEditor";
import CourseIncludesEditor, { type CourseIncludeItem } from "./components/CourseIncludesEditor";
import { COURSE_PREVIEW_STATE_KEY, COURSE_RESTORE_STATE_KEY } from "./CoursePreview";
import { fetchCourseCats, generateCoursePreviewLink, type Course, type CourseCat } from "../../api/courses";
import { usersApi, fetchAdminPanelUsers, type User } from "../../api/users";
import { CourseCatMultiSelect } from "./components/CourseCatMultiSelect";
import { AuthorUserSelect } from "./components/AuthorUserSelect";
import MetaFieldsForm, { type SEOMetaFields } from "../../components/form/MetaFieldsForm";
import { slugifyForSeo, shouldResyncSlugFromSource } from "../../lib/slug";

export interface CourseFormData {
  title: string;
  short_title: string;
  slug: string;
  brief_description: string;
  description: string;
  curriculum: any[];
  learn_outcomes: string[];
  requirements: string;
  terms_conditions: any[];
  price: string;
  sale_price: string;
  thumbnail_url: string;
  youtube_url: string;
  language: string;
  /** Shown on public course page banner ("N students"). */
  enrolled_count: string;
  /** Banner average rating (e.g. 4.8); leave empty if none. */
  ratings: string;
  /** Banner copy: "rating by N users". */
  rating_users: string;
  course_type: string;
  taxable: boolean;
  keywords: string;
  faqs: any[];
  includes_info: IncludesInfoItem[];
  course_includes: CourseIncludeItem[];
  feedback: any[];
  certifications: string;
  gateway: string;
  is_published: boolean;
  hide_from_public: boolean;
  author_user_id: string;
  author_name: string;
  author_role: string;
  author_bio: string;
  author_image: string;
  course_cat_ids: number[];
  default_batch_start_date: string;
  default_batch_meet_link: string;
  meta_title: string;
  meta_description: string;
  meta_keywords: string;
  canonical_url: string;
  /** Robots directive (must match MetaFieldsForm options). */
  robots: string;
  og_title: string;
  og_description: string;
  og_image_url: string;
  /** Percent of order amount paid to referrer (0–100). */
  affiliate_commission: string;
  /** '1year' (default) or 'lifetime' — determines enrolled access duration. */
  validity: 'lifetime' | '1year';
  /** JSON-schema driven dynamic description sections for the course detail page.
   *  Each item: { type: 'text'|'cards', title: string, content?: string, items?: {icon?:string, title:string, content:string}[] }
   */
  detail_sections: DetailSection[];
}

export type DetailSectionType = 'text' | 'cards';

export interface DetailSectionCard {
  icon: string;
  title: string;
  content: string;
}

export interface DetailSection {
  type: DetailSectionType;
  title: string;
  /** Used when type === 'text' */
  content: string;
  /** Used when type === 'cards' */
  items: DetailSectionCard[];
}

const safeJsonParse = (str: string | null | undefined, fallback: any = []) => {
  if (!str) return fallback;
  try { return JSON.parse(str); } catch { return fallback; }
};

const DEFAULT_DETAIL_SECTIONS: DetailSection[] = [
  {
    type: "text",
    title: "How I will get the course:",
    content: "This is an online Certification course so there will not be any physical delivery of the lectures. After the purchase of this Certification course, you can see this course under my account option under purchased courses. All the videos, study materials, PDF files and PPTs, will be uploaded there for quick access by participants. This Certification Course's Recording is valid for 1 Year.",
    items: [],
  },
  {
    type: "text",
    title: "Who is Eligible to Join this Certification Course:",
    content: "<p>There is no bound on the eligibility from our side for this Certification Course. Any person who wants to learn and master in Taxation can join this course. However, it will be more beneficial for the below-mentioned persons:</p><ul><li><p>Commerce Graduates/CA/CS/CMA/Law students</p></li><li><p>Tax professionals whether in JOB or Practice</p></li><li><p>Qualified CA/CS/CMA/LLB</p></li><li><p>Semi-qualified CA/CS/CMA working in CA Firms or in Industry</p></li><li><p>Any other person not covered above can join the course if interested.</p></li></ul>",
    items: [],
  },
  {
    type: "cards",
    title: "Cards",
    content: "",
    items: [
      { icon: "", title: "Course Duration", content: "The course duration is 2 Days and around 4+ hours." },
      { icon: "", title: "Views Limitation", content: "This is a fully online course with 1-year unlimited access, available anytime and anywhere." },
      { icon: "", title: "Course Timing", content: "Timing: 6:00 pm to 8:00 pm" },
    ],
  },
];

type TabKey = "basic" | "content" | "curriculum" | "faqs" | "author" | "seo";

const TABS: { key: TabKey; label: string }[] = [
  { key: "basic", label: "Basic Info" },
  { key: "content", label: "Content" },
  { key: "curriculum", label: "Curriculum" },
  { key: "faqs", label: "FAQs & Terms" },
  { key: "author", label: "Author & Settings" },
  { key: "seo", label: "SEO & Meta" },
];

export default function CourseForm({ initial, onSubmit, loading = false }: { initial?: Course | null, onSubmit: (data: CourseFormData) => Promise<void>, loading?: boolean }) {
  const navigate = useNavigate();
  const location = useLocation();
  const restoredData = location.state?.[COURSE_RESTORE_STATE_KEY] as CourseFormData | undefined;

  const [activeTab, setActiveTab] = useState<TabKey>("basic");

  const [form, setForm] = useState<CourseFormData>(() => {
    const primaryAuthor = initial?.authors?.[0];
    if (restoredData) {
      return {
        ...restoredData,
        hide_from_public: restoredData.hide_from_public ?? false,
        course_includes: Array.isArray(restoredData.course_includes)
          ? restoredData.course_includes
          : [],
        course_cat_ids: Array.isArray(restoredData.course_cat_ids) ? restoredData.course_cat_ids : [],
        affiliate_commission:
          restoredData.affiliate_commission != null && restoredData.affiliate_commission !== ""
            ? String(restoredData.affiliate_commission)
            : "0",
        enrolled_count:
          restoredData.enrolled_count != null && restoredData.enrolled_count !== ""
            ? String(restoredData.enrolled_count)
            : "0",
        ratings: restoredData.ratings != null ? String(restoredData.ratings) : "",
        rating_users:
          restoredData.rating_users != null && restoredData.rating_users !== ""
            ? String(restoredData.rating_users)
            : "0",
        canonical_url: restoredData.canonical_url ?? "",
        robots: restoredData.robots ?? "index, follow",
        og_title: restoredData.og_title ?? "",
        og_description: restoredData.og_description ?? "",
        og_image_url: restoredData.og_image_url ?? "",
        validity: restoredData.validity ?? '1year',
        detail_sections: Array.isArray(restoredData.detail_sections) ? restoredData.detail_sections : [],
      };
    }
    return {
      title: initial?.title ?? "",
      short_title: initial?.short_title ?? "",
      slug: initial?.slug ?? "",
      brief_description: initial?.brief_description ?? "",
      description: initial?.description ?? "",
      curriculum: safeJsonParse(initial?.curriculum, []).map((day: any) => {
        if (!Array.isArray(day.sections) || day.sections.length === 0) {
          return {
            title: day.title || "",
            sections: [{
              title: day.title || "",
              description: day.description || "",
              videoId: day.video || "",
              duration: day.minutes || "",
            }],
            files: Array.isArray(day.files) ? day.files : [],
          };
        }
        return day;
      }),
      learn_outcomes: safeJsonParse(initial?.learn_outcomes, []),
      requirements: initial?.requirements ?? "",
      terms_conditions: safeJsonParse(initial?.terms_conditions, []),
      price: initial?.price != null ? String(initial.price) : "0",
      sale_price: initial?.sale_price != null ? String(initial.sale_price) : "",
      thumbnail_url: initial?.thumbnail_url ?? "",
      youtube_url: initial?.youtube_url ?? "",
      language: initial?.language ?? "",
      enrolled_count:
        initial?.enrolled_count != null
          ? String(initial.enrolled_count)
          : "0",
      ratings:
        initial?.ratings != null && initial.ratings !== ""
          ? String(initial.ratings)
          : "",
      rating_users:
        initial?.rating_users != null
          ? String(initial.rating_users)
          : "0",
      course_type: initial?.course_type ?? "",
      taxable: initial?.taxable ?? false,
      keywords: initial?.keywords ?? "",
      faqs: safeJsonParse(initial?.faqs, []),
      includes_info: (safeJsonParse(initial?.includes_info, []) as any[]).map((item: any) => ({
        image: item.image ?? item.icon ?? "",
        title: item.title ?? "",
        worth: item.worth ?? "",
      })),
      course_includes: (safeJsonParse(initial?.course_includes, []) as any[]).map((item: any) => ({
        image: item.image ?? item.icon ?? "",
        title: item.title ?? "",
      })),
      feedback: safeJsonParse(initial?.feedback, []),
      certifications: initial?.certifications ?? "",
      gateway: initial?.gateway ?? "",
      is_published: initial?.is_published ?? false,
      hide_from_public: initial?.hide_from_public ?? false,
      author_user_id: initial?.author_user_id != null
        ? String(initial.author_user_id)
        : primaryAuthor?.user_id != null
          ? String(primaryAuthor.user_id)
          : "",
      author_name: initial?.author_name ?? primaryAuthor?.name ?? "",
      author_role: initial?.author_role ?? primaryAuthor?.role ?? "",
      author_bio: initial?.author_bio ?? primaryAuthor?.bio ?? "",
      author_image: initial?.author_image ?? primaryAuthor?.image_url ?? "",
      course_cat_ids:
        initial?.course_cat_ids ??
        (Array.isArray(initial?.categories) ? initial.categories.map((c) => c.id) : []),
      default_batch_start_date: "",
      default_batch_meet_link: "",
      meta_title: initial?.meta_title ?? "",
      meta_description: initial?.meta_description ?? "",
      meta_keywords: initial?.meta_keywords ?? "",
      canonical_url: initial?.canonical_url ?? "",
      robots:
        initial?.robots &&
        ["index, follow", "noindex, nofollow", "index, nofollow", "noindex, follow"].includes(
          initial.robots,
        )
          ? initial.robots
          : "index, follow",
      og_title: initial?.og_title ?? "",
      og_description: initial?.og_description ?? "",
      og_image_url: initial?.og_image_url ?? "",
      affiliate_commission:
        initial?.affiliate_commission != null && initial.affiliate_commission !== ""
          ? String(initial.affiliate_commission)
          : "0",
      validity: (initial?.validity === 'lifetime' ? 'lifetime' : '1year') as 'lifetime' | '1year',
      detail_sections: (safeJsonParse((initial as any)?.detail_sections, null) as DetailSection[] | null) ?? DEFAULT_DETAIL_SECTIONS,
    };
  });

  useEffect(() => {
    if (restoredData) {
      window.history.replaceState({}, '');
    }
  }, [restoredData]);

  const [adminUsers, setAdminUsers] = useState<User[]>([]);
  const [courseCats, setCourseCats] = useState<CourseCat[]>([]);

  // Fetch admin panel users once — they are few and always relevant as authors.
  useEffect(() => {
    fetchAdminPanelUsers().then(setAdminUsers).catch(() => {});
  }, []);

  /**
   * On-demand search for the AuthorUserSelect dropdown.
   * Fetches up to 10 matching users from the API and merges in any admin users
   * that also match the query, so instructors/editors always appear.
   */
  const fetchAuthorUsers = useCallback(async (search: string): Promise<User[]> => {
    try {
      const res = await usersApi.list({
        page: 1,
        limit: 10,
        sortBy: "name",
        sortOrder: "ASC",
        lean: true,
        ...(search.trim() ? { search: search.trim() } : {}),
      });
      const regular = res.data ?? [];

      if (adminUsers.length === 0) return regular;

      const q = search.trim().toLowerCase();
      const matchingAdmins = adminUsers.filter((u) => {
        if (!q) return true;
        return (
          (u.name || "").toLowerCase().includes(q) ||
          (u.display_name || "").toLowerCase().includes(q) ||
          (u.email || "").toLowerCase().includes(q) ||
          (u.role || "").toLowerCase().includes(q) ||
          (u.designation || "").toLowerCase().includes(q)
        );
      });

      const seen = new Set(regular.map((u) => String(u.id)));
      const merged = [...regular];
      for (const au of matchingAdmins) {
        if (!seen.has(String(au.id))) merged.push(au);
      }
      merged.sort((a, b) => {
        const nameA = (a.name || a.display_name || a.email || "").toLowerCase();
        const nameB = (b.name || b.display_name || b.email || "").toLowerCase();
        return nameA.localeCompare(nameB);
      });
      return merged;
    } catch {
      return [];
    }
  }, [adminUsers]);

  useEffect(() => {
    fetchCourseCats().then(setCourseCats).catch(() => {});
  }, []);

  const handleAuthorSelect = (userId: string, user?: User) => {
    updateField('author_user_id', userId);
    if (user) {
      updateField(
        'author_name',
        user.name?.trim() ||
          user.display_name?.trim() ||
          user.email?.trim() ||
          '',
      );
      updateField(
        'author_role',
        user.role?.trim() || user.designation?.trim() || user.profession?.trim() || '',
      );
    }
  };

  // A minimal User object built from the existing course data so the dropdown
  // can show the selected author label even before any search has been run.
  const initialAuthorUser = useMemo<User | undefined>(() => {
    const id = initial?.author_user_id;
    if (!id) return undefined;
    return {
      id: String(id),
      name: initial?.author_name ?? "",
      email: "",
      role: initial?.author_role ?? "",
    } as User;
  }, [initial?.author_user_id]); // eslint-disable-line react-hooks/exhaustive-deps

  const handlePreview = () => {
    const returnPath = location.pathname;
    navigate('/courses/preview', {
      state: {
        [COURSE_PREVIEW_STATE_KEY]: form,
        returnPath,
      },
    });
  };

  const [livePreviewLoading, setLivePreviewLoading] = useState(false);

  const handleLivePreview = async () => {
    if (!initial?.id) return;
    setLivePreviewLoading(true);
    try {
      const { previewUrl } = await generateCoursePreviewLink(initial.id);
      window.open(previewUrl, '_blank', 'noopener,noreferrer');
    } catch {
      alert('Could not generate preview link. Please try again.');
    } finally {
      setLivePreviewLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const slug =
      slugifyForSeo(form.slug) ||
      slugifyForSeo(form.title);
    onSubmit({ ...form, slug });
  };

  const updateField = (field: keyof CourseFormData, value: any) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-0">
      {/* Sticky action bar */}
      <div className="sticky top-0 z-20 mb-4 flex items-center justify-between rounded-2xl border border-gray-200 bg-white px-5 py-3 shadow-sm dark:border-gray-800 dark:bg-gray-900">
        <span className="text-sm font-medium text-gray-500 dark:text-gray-400">
          {initial ? `Editing: ${initial.title || "Course"}` : "New Course"}
        </span>
        <div className="flex items-center gap-2">
          <Button type="button" variant="outline" size="sm" onClick={handlePreview}>
            Preview
          </Button>
          {initial?.id && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleLivePreview}
              disabled={livePreviewLoading}
            >
              {livePreviewLoading ? "Generating…" : "Live Preview ↗"}
            </Button>
          )}
          <Button type="submit" size="sm" disabled={loading}>
            {loading ? "Saving…" : "Save Course"}
          </Button>
        </div>
      </div>

      {/* Tab bar */}
      <div className="mb-4 flex gap-1 overflow-x-auto rounded-xl border border-gray-200 bg-gray-50 p-1 dark:border-gray-800 dark:bg-gray-900/50">
        {TABS.map((tab) => (
          <button
            key={tab.key}
            type="button"
            onClick={() => setActiveTab(tab.key)}
            className={`whitespace-nowrap rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
              activeTab === tab.key
                ? "bg-white text-brand-600 shadow-sm dark:bg-gray-800 dark:text-brand-400"
                : "text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab: Basic Info */}
      {activeTab === "basic" && (
        <div className="space-y-4">
          <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] sm:p-6">
            <h3 className="mb-4 text-lg font-semibold text-gray-800 dark:text-white/90">General Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <Label>Title <span className="text-error-500">*</span></Label>
                <Input
                  value={form.title}
                  onChange={(e) => {
                    const title = e.target.value;
                    setForm((prev) => {
                      const keepSync = shouldResyncSlugFromSource(
                        prev.slug,
                        prev.title,
                        (t) => slugifyForSeo(t),
                      );
                      return {
                        ...prev,
                        title,
                        slug: keepSync ? slugifyForSeo(title) : prev.slug,
                      };
                    });
                  }}
                  required
                />
              </div>
              <div>
                <Label>Short Title</Label>
                <Input value={form.short_title} onChange={(e) => updateField('short_title', e.target.value)} />
              </div>
              <div>
                <Label>Slug</Label>
                <Input
                  value={form.slug}
                  onChange={(e) => updateField("slug", e.target.value)}
                  onBlur={() =>
                    setForm((prev) => ({
                      ...prev,
                      slug: slugifyForSeo(prev.slug),
                    }))
                  }
                  placeholder="Auto from title when empty; edit freely, SEO format on blur"
                />
              </div>
              <div className="md:col-span-2">
                <Label>Categories</Label>
                <CourseCatMultiSelect
                  categories={courseCats}
                  value={form.course_cat_ids}
                  onChange={(ids) => updateField("course_cat_ids", ids)}
                  placeholder="Select categories…"
                />
              </div>
              <div className="md:col-span-2">
                <Label>Brief Description</Label>
                <TextArea rows={3} value={form.brief_description} onChange={(v) => updateField('brief_description', v)} />
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] sm:p-6">
            <h3 className="mb-4 text-lg font-semibold text-gray-800 dark:text-white/90">Pricing & Media</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label>Regular Price (₹) <span className="text-error-500">*</span></Label>
                <Input type="number" min={0} step={0.01} value={form.price} onChange={(e) => updateField('price', e.target.value)} required />
              </div>
              <div>
                <Label>Sale Price (₹)</Label>
                <Input type="number" min={0} step={0.01} value={form.sale_price} onChange={(e) => updateField('sale_price', e.target.value)} />
              </div>
              <div>
                <Label>Affiliate Commission (%)</Label>
                <Input
                  type="number"
                  min={0}
                  max={100}
                  step={0.01}
                  value={form.affiliate_commission}
                  onChange={(e) => updateField("affiliate_commission", e.target.value)}
                />
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  Percent of each paid order attributed to the referrer. Use 0 to disable.
                </p>
              </div>
              <p className="md:col-span-2 text-xs text-gray-500 dark:text-gray-400">
                Set <strong>Regular Price</strong> to 0 for a <strong>free</strong> course. Leave <strong>Sale Price</strong> empty unless running a time-bound discount.
              </p>
              <div className="md:col-span-2">
                <ImageUpload
                  label="Thumbnail URL"
                  value={form.thumbnail_url}
                  onChange={(url) => updateField('thumbnail_url', url)}
                  placeholder="Drop or select image"
                />
              </div>
              <div className="md:col-span-2">
                <Label>Promo Video URL (Youtube)</Label>
                <Input value={form.youtube_url} onChange={(e) => updateField('youtube_url', e.target.value)} />
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] sm:p-6">
            <h3 className="mb-4 text-lg font-semibold text-gray-800 dark:text-white/90">Settings</h3>
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-6">
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="is_published"
                  checked={form.is_published}
                  onChange={(e) => updateField('is_published', e.target.checked)}
                  className="h-4 w-4 rounded border-gray-300 text-brand-500 focus:ring-brand-500"
                />
                <Label htmlFor="is_published" className="!mb-0 cursor-pointer">Published</Label>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="hide_from_public"
                  checked={form.hide_from_public}
                  onChange={(e) => updateField('hide_from_public', e.target.checked)}
                  className="h-4 w-4 rounded border-gray-300 text-brand-500 focus:ring-brand-500"
                />
                <Label htmlFor="hide_from_public" className="!mb-0 cursor-pointer">Hide from Public</Label>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="taxable"
                  checked={form.taxable}
                  onChange={(e) => updateField('taxable', e.target.checked)}
                  className="h-4 w-4 rounded border-gray-300 text-brand-500 focus:ring-brand-500"
                />
                <Label htmlFor="taxable" className="!mb-0 cursor-pointer">Taxable</Label>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="validity_lifetime"
                  checked={form.validity === 'lifetime'}
                  onChange={(e) => updateField('validity', e.target.checked ? 'lifetime' : '1year')}
                  className="h-4 w-4 rounded border-gray-300 text-brand-500 focus:ring-brand-500"
                />
                <Label htmlFor="validity_lifetime" className="!mb-0 cursor-pointer">Lifetime Access</Label>
                <span className="text-xs text-gray-400">(By default, access is 1 year from purchase)</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab: Content */}
      {activeTab === "content" && (
        <div className="space-y-4">
          <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] sm:p-6">
            <h3 className="mb-4 text-lg font-semibold text-gray-800 dark:text-white/90">Full Description</h3>
            <ArticleEditor
              value={form.description}
              onChange={(html) => updateField('description', html)}
              placeholder="Course full description..."
              minHeight="300px"
            />
          </div>

          <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] sm:p-6">
            <h3 className="mb-4 text-lg font-semibold text-gray-800 dark:text-white/90">Key Features (Learn Outcomes)</h3>
            <ArrayEditor
              value={form.learn_outcomes}
              onChange={(v) => updateField('learn_outcomes', v)}
              defaultItem=""
              addButtonLabel="Add Feature"
              renderItem={(item, index) => (
                <Input value={item} onChange={(e) => {
                  const val = e.target.value;
                  const newVal = [...form.learn_outcomes];
                  newVal[index] = val;
                  updateField('learn_outcomes', newVal);
                }} placeholder="Feature text (HTML supported)" />
              )}
            />
          </div>

          <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] sm:p-6">
            <h3 className="mb-4 text-lg font-semibold text-gray-800 dark:text-white/90">Exclusive Bonuses</h3>
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">
              Course page &quot;Exclusive bonuses&quot; block (icon, title, worth).
            </p>
            <IncludesInfoEditor
              value={form.includes_info}
              onChange={(v) => updateField('includes_info', v)}
            />
          </div>

          <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] sm:p-6">
            <h3 className="mb-4 text-lg font-semibold text-gray-800 dark:text-white/90">This Course Includes (Banner)</h3>
            <CourseIncludesEditor
              value={form.course_includes}
              onChange={(v) => updateField('course_includes', v)}
            />
          </div>

          <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] sm:p-6">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">Course Detail Sections</h3>
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  Dynamic sections shown on the course detail page (How to get, Eligibility, Views Limitation, etc.). Each section is either a rich-text block or a card grid.
                </p>
              </div>
              <button
                type="button"
                onClick={() => updateField('detail_sections', [...form.detail_sections, { type: 'text', title: '', content: '', items: [] }])}
                className="inline-flex items-center gap-1 rounded-lg bg-brand-50 px-3 py-1.5 text-xs font-medium text-brand-600 transition hover:bg-brand-100 dark:bg-brand-500/10 dark:text-brand-400 dark:hover:bg-brand-500/20"
              >
                + Add Section
              </button>
            </div>
            <div className="space-y-4">
              {form.detail_sections.map((sec, idx) => (
                <div key={idx} className="rounded-xl border border-gray-200 bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-900/50 space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div className="sm:col-span-2">
                        <Label>Section Title</Label>
                        <Input
                          value={sec.title}
                          onChange={(e) => {
                            const next = [...form.detail_sections];
                            next[idx] = { ...next[idx], title: e.target.value };
                            updateField('detail_sections', next);
                          }}
                          placeholder="e.g. How I will get the course"
                        />
                      </div>
                      <div>
                        <Label>Type</Label>
                        <select
                          value={sec.type}
                          onChange={(e) => {
                            const next = [...form.detail_sections];
                            next[idx] = { ...next[idx], type: e.target.value as DetailSectionType };
                            updateField('detail_sections', next);
                          }}
                          className="h-11 w-full rounded-lg border border-gray-300 bg-white px-3 text-sm text-gray-700 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200"
                        >
                          <option value="text">Text block</option>
                          <option value="cards">Cards grid</option>
                        </select>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => updateField('detail_sections', form.detail_sections.filter((_, i) => i !== idx))}
                      className="mt-6 rounded-lg p-1.5 text-gray-400 hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-500/10"
                      title="Remove section"
                    >
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                  </div>

                  {sec.type === 'text' && (
                    <div>
                      <Label>Content</Label>
                      <RichTextEditor
                        value={sec.content}
                        onChange={(html) => {
                          const next = [...form.detail_sections];
                          next[idx] = { ...next[idx], content: html };
                          updateField('detail_sections', next);
                        }}
                        placeholder="Section content…"
                        minHeight="150px"
                      />
                    </div>
                  )}

                  {sec.type === 'cards' && (
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">Cards ({sec.items.length})</span>
                        <button
                          type="button"
                          onClick={() => {
                            const next = [...form.detail_sections];
                            next[idx] = { ...next[idx], items: [...next[idx].items, { icon: '', title: '', content: '' }] };
                            updateField('detail_sections', next);
                          }}
                          className="inline-flex items-center gap-1 rounded-md bg-brand-50 px-2 py-1 text-xs font-medium text-brand-600 transition hover:bg-brand-100 dark:bg-brand-500/10 dark:text-brand-400 dark:hover:bg-brand-500/20"
                        >
                          + Add Card
                        </button>
                      </div>
                      {sec.items.map((card, cIdx) => (
                        <div key={cIdx} className="rounded-lg border border-gray-200 bg-white p-3 dark:border-gray-700 dark:bg-gray-900 grid grid-cols-1 sm:grid-cols-3 gap-3 items-start">
                          <div>
                            <Label>Icon (URL or emoji)</Label>
                            <Input
                              value={card.icon}
                              onChange={(e) => {
                                const next = [...form.detail_sections];
                                const items = [...next[idx].items];
                                items[cIdx] = { ...items[cIdx], icon: e.target.value };
                                next[idx] = { ...next[idx], items };
                                updateField('detail_sections', next);
                              }}
                              placeholder="⏳ or https://…"
                            />
                          </div>
                          <div>
                            <Label>Card Title</Label>
                            <Input
                              value={card.title}
                              onChange={(e) => {
                                const next = [...form.detail_sections];
                                const items = [...next[idx].items];
                                items[cIdx] = { ...items[cIdx], title: e.target.value };
                                next[idx] = { ...next[idx], items };
                                updateField('detail_sections', next);
                              }}
                              placeholder="Course Duration"
                            />
                          </div>
                          <div className="flex items-start gap-2">
                            <div className="flex-1">
                              <Label>Card Content</Label>
                              <Input
                                value={card.content}
                                onChange={(e) => {
                                  const next = [...form.detail_sections];
                                  const items = [...next[idx].items];
                                  items[cIdx] = { ...items[cIdx], content: e.target.value };
                                  next[idx] = { ...next[idx], items };
                                  updateField('detail_sections', next);
                                }}
                                placeholder="2 Days and 4+ hours"
                              />
                            </div>
                            <button
                              type="button"
                              onClick={() => {
                                const next = [...form.detail_sections];
                                next[idx] = { ...next[idx], items: next[idx].items.filter((_, ci) => ci !== cIdx) };
                                updateField('detail_sections', next);
                              }}
                              className="mt-6 rounded-lg p-1.5 text-gray-400 hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-500/10"
                              title="Remove card"
                            >
                              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                            </button>
                          </div>
                        </div>
                      ))}
                      {sec.items.length === 0 && (
                        <p className="text-xs text-gray-400 italic">No cards yet. Click &quot;+ Add Card&quot; to begin.</p>
                      )}
                    </div>
                  )}
                </div>
              ))}
              {form.detail_sections.length === 0 && (
                <p className="text-sm text-gray-400 italic text-center py-4">No sections yet. Click &quot;+ Add Section&quot; to begin.</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Tab: Curriculum */}
      {activeTab === "curriculum" && (
        <div className="space-y-4">
          {!initial && (
            <div className="rounded-xl border border-brand-200 bg-brand-50 p-4 dark:border-brand-800 dark:bg-brand-500/[0.05]">
              <h4 className="mb-1 text-sm font-semibold text-brand-700 dark:text-brand-400">Default Batch</h4>
              <p className="mb-3 text-xs text-brand-600 dark:text-brand-400/80">
                A default batch will be auto-created from the curriculum when the course is saved. Optionally set a start date and meet link below.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>Batch Start Date</Label>
                  <Input
                    type="date"
                    value={form.default_batch_start_date}
                    onChange={(e) => updateField('default_batch_start_date', e.target.value)}
                  />
                </div>
                <div>
                  <Label>Meet Link</Label>
                  <Input
                    value={form.default_batch_meet_link}
                    onChange={(e) => updateField('default_batch_meet_link', e.target.value)}
                    placeholder="https://meet.google.com/..."
                  />
                </div>
              </div>
            </div>
          )}

          <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] sm:p-6">
            <h3 className="mb-4 text-lg font-semibold text-gray-800 dark:text-white/90">Curriculum</h3>
            <ArrayEditor
              value={form.curriculum}
              onChange={(v) => updateField('curriculum', v)}
              defaultItem={{ title: "", sections: [{ title: "", description: "", videoId: "", duration: "" }], files: [] }}
              addButtonLabel="Add Day"
              renderItem={(day: any, dayIndex, updateDay) => {
                const sections: { title: string; description: string; videoId: string; duration: string }[] =
                  Array.isArray(day.sections) && day.sections.length > 0
                    ? day.sections
                    : [{ title: "", description: "", videoId: "", duration: "" }];

                const totalDuration = sections.reduce((sum: number, s: any) => sum + (Number(s.duration) || 0), 0);

                const updateSections = (newSections: typeof sections) => {
                  updateDay(dayIndex, { sections: newSections });
                };

                const updateSection = (sIdx: number, patch: Partial<typeof sections[0]>) => {
                  const next = [...sections];
                  next[sIdx] = { ...next[sIdx], ...patch };
                  updateSections(next);
                };

                const addSection = () => {
                  updateSections([...sections, { title: "", description: "", videoId: "", duration: "" }]);
                };

                const removeSection = (sIdx: number) => {
                  if (sections.length <= 1) return;
                  updateSections(sections.filter((_: any, i: number) => i !== sIdx));
                };

                return (
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                      <div className="sm:col-span-3">
                        <Label>Day {dayIndex + 1} — Title</Label>
                        <Input value={day.title || ''} onChange={e => updateDay(dayIndex, { title: e.target.value })} placeholder={`Day ${dayIndex + 1} title`} />
                      </div>
                      <div>
                        <Label>Total Duration</Label>
                        <div className="flex h-11 items-center rounded-lg border border-gray-300 bg-gray-100 px-3 text-sm text-gray-600 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300">
                          {totalDuration > 0 ? `${totalDuration} min` : "0 min"}
                        </div>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">Sections ({sections.length})</span>
                        <button
                          type="button"
                          onClick={addSection}
                          className="inline-flex items-center gap-1 rounded-md bg-brand-50 px-2.5 py-1 text-xs font-medium text-brand-600 transition hover:bg-brand-100 dark:bg-brand-500/10 dark:text-brand-400 dark:hover:bg-brand-500/20"
                        >
                          + Add Section
                        </button>
                      </div>
                      {sections.map((sec: any, sIdx: number) => (
                        <div key={sIdx} className="rounded-lg border border-gray-100 bg-white p-4 dark:border-gray-700 dark:bg-gray-900/50 space-y-3">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-medium text-gray-500 dark:text-gray-400">Section {sIdx + 1}</span>
                            {sections.length > 1 && (
                              <button
                                type="button"
                                onClick={() => removeSection(sIdx)}
                                className="p-1 text-gray-400 transition hover:text-error-500"
                                title="Remove section"
                              >
                                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                              </button>
                            )}
                          </div>
                          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                            <div className="sm:col-span-3">
                              <Input
                                value={sec.title || ''}
                                onChange={e => updateSection(sIdx, { title: e.target.value })}
                                placeholder="Section title"
                              />
                            </div>
                            <div>
                              <Input
                                type="number"
                                min={0}
                                value={sec.duration || ''}
                                onChange={e => updateSection(sIdx, { duration: e.target.value })}
                                placeholder="Minutes"
                              />
                            </div>
                          </div>
                          <div>
                            <TextArea rows={2} value={sec.description || ''} onChange={v => updateSection(sIdx, { description: v })} placeholder="Section description" />
                          </div>
                        </div>
                      ))}
                    </div>

                    <div>
                      <Label>File IDs (comma-separated)</Label>
                      <Input value={Array.isArray(day.files) ? day.files.join(', ') : (day.files || '')} onChange={e => {
                        const val = e.target.value;
                        const filesArr = val ? val.split(',').map((f: string) => f.trim()).filter(Boolean) : [];
                        updateDay(dayIndex, { files: filesArr });
                      }} placeholder="e.g. 96620, 96621" />
                    </div>
                  </div>
                );
              }}
            />
          </div>

        </div>
      )}

      {/* Tab: FAQs & Terms */}
      {activeTab === "faqs" && (
        <div className="space-y-4">
          <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] sm:p-6">
            <h3 className="mb-4 text-lg font-semibold text-gray-800 dark:text-white/90">FAQs</h3>
            <ArrayEditor
              value={form.faqs}
              onChange={(v) => updateField('faqs', v)}
              defaultItem={{ question: "", answer: "" }}
              addButtonLabel="Add FAQ"
              renderItem={(item: any, index, update) => (
                <div className="space-y-4">
                  <div>
                    <Label>Question</Label>
                    <Input value={item.question || ''} onChange={e => update(index, { question: e.target.value })} />
                  </div>
                  <div>
                    <Label>Answer</Label>
                    <TextArea rows={2} value={item.answer || ''} onChange={v => update(index, { answer: v })} />
                  </div>
                </div>
              )}
            />
          </div>

          <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] sm:p-6">
            <h3 className="mb-4 text-lg font-semibold text-gray-800 dark:text-white/90">Terms & Conditions</h3>
            <ArrayEditor
              value={form.terms_conditions}
              onChange={(v) => updateField('terms_conditions', v)}
              defaultItem={{ title: "" }}
              addButtonLabel="Add Term"
              renderItem={(item: any, index, update) => (
                <div>
                  <Input value={item.title || ''} onChange={e => update(index, { title: e.target.value })} placeholder="Term / condition text" />
                </div>
              )}
            />
          </div>
        </div>
      )}

      {/* Tab: Author & Settings */}
      {activeTab === "author" && (
        <div className="space-y-4">
          <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] sm:p-6">
            <h3 className="mb-4 text-lg font-semibold text-gray-800 dark:text-white/90">Author</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label>Author</Label>
                <AuthorUserSelect
                  value={form.author_user_id}
                  onChange={handleAuthorSelect}
                  disabled={loading}
                  placeholder="Select an author"
                  fetchUsers={fetchAuthorUsers}
                  initialUser={initialAuthorUser}
                />
              </div>
              <div>
                <Label>Author Name</Label>
                <Input
                  value={form.author_name}
                  onChange={(e) => updateField('author_name', e.target.value)}
                />
              </div>
              <div>
                <Label>Author Role</Label>
                <Input
                  value={form.author_role}
                  onChange={(e) => updateField('author_role', e.target.value)}
                  placeholder="e.g. CA, Tax Consultant"
                />
              </div>
              <div>
                <Label>Author Image URL</Label>
                <Input
                  value={form.author_image}
                  onChange={(e) => updateField('author_image', e.target.value)}
                />
              </div>
              <div className="md:col-span-2">
                <Label>Author Bio</Label>
                <TextArea
                  rows={3}
                  value={form.author_bio}
                  onChange={(v) => updateField('author_bio', v)}
                />
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] sm:p-6">
            <h3 className="mb-4 text-lg font-semibold text-gray-800 dark:text-white/90">Course Feedback / Reviews</h3>
            <ArrayEditor
              value={form.feedback}
              onChange={(v) => updateField('feedback', v)}
              defaultItem={{ name: "", designation: "Course Attendee", review: "" }}
              addButtonLabel="Add Review"
              renderItem={(item: any, index, update) => (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <Label>Reviewer Name</Label>
                      <Input value={item.name || ''} onChange={e => update(index, { name: e.target.value })} />
                    </div>
                    <div>
                      <Label>Designation</Label>
                      <Input value={item.designation || ''} onChange={e => update(index, { designation: e.target.value })} />
                    </div>
                  </div>
                  <div>
                    <Label>Review</Label>
                    <TextArea rows={3} value={item.review || ''} onChange={v => update(index, { review: v })} />
                  </div>
                </div>
              )}
            />
          </div>

          <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] sm:p-6">
            <h3 className="mb-4 text-lg font-semibold text-gray-800 dark:text-white/90">Additional Info</h3>
            <div className="space-y-4">
              <div>
                <Label>Requirements</Label>
                <TextArea rows={3} value={form.requirements} onChange={(v) => updateField('requirements', v)} />
              </div>
              <div>
                <Label>Certifications</Label>
                <TextArea rows={2} value={form.certifications} onChange={(v) => updateField('certifications', v)} />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>Language</Label>
                  <Input value={form.language} onChange={(e) => updateField('language', e.target.value)} />
                </div>
                <div>
                  <Label>Course Type</Label>
                  <Input value={form.course_type} onChange={(e) => updateField('course_type', e.target.value)} />
                </div>
                <div>
                  <Label>Students (public banner)</Label>
                  <Input
                    type="number"
                    min={0}
                    step={1}
                    value={form.enrolled_count}
                    onChange={(e) => updateField('enrolled_count', e.target.value)}
                    placeholder="e.g. 120"
                  />
                </div>
                <div>
                  <Label>Average Rating (banner)</Label>
                  <Input
                    type="number"
                    min={0}
                    max={5}
                    step={0.1}
                    value={form.ratings}
                    onChange={(e) => updateField('ratings', e.target.value)}
                    placeholder="e.g. 4.8 — leave empty for none"
                  />
                </div>
                <div>
                  <Label>Rating User Count (banner)</Label>
                  <Input
                    type="number"
                    min={0}
                    step={1}
                    value={form.rating_users}
                    onChange={(e) => updateField('rating_users', e.target.value)}
                    placeholder="e.g. 50"
                  />
                </div>
                <div>
                  <Label>Keywords</Label>
                  <Input value={form.keywords} onChange={(e) => updateField('keywords', e.target.value)} placeholder="Comma-separated keywords" />
                </div>
                <div>
                  <Label>Gateway</Label>
                  <Input value={form.gateway} onChange={(e) => updateField('gateway', e.target.value)} />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab: SEO & Meta */}
      {activeTab === "seo" && (
        <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] sm:p-6">
          <h3 className="mb-4 text-lg font-semibold text-gray-800 dark:text-white/90">SEO &amp; Meta</h3>
          <MetaFieldsForm
            value={{
              metaTitle: form.meta_title,
              metaDescription: form.meta_description,
              metaKeywords: form.meta_keywords,
              canonicalUrl: form.canonical_url,
              robots: form.robots as SEOMetaFields["robots"],
              ogTitle: form.og_title,
              ogDescription: form.og_description,
              ogImageUrl: form.og_image_url,
            }}
            onChange={(patch: Partial<SEOMetaFields>) => {
              if (patch.metaTitle !== undefined) updateField("meta_title", patch.metaTitle);
              if (patch.metaDescription !== undefined) updateField("meta_description", patch.metaDescription);
              if (patch.metaKeywords !== undefined) updateField("meta_keywords", patch.metaKeywords);
              if (patch.canonicalUrl !== undefined) updateField("canonical_url", patch.canonicalUrl);
              if (patch.robots !== undefined) updateField("robots", patch.robots);
              if (patch.ogTitle !== undefined) updateField("og_title", patch.ogTitle);
              if (patch.ogDescription !== undefined) updateField("og_description", patch.ogDescription);
              if (patch.ogImageUrl !== undefined) updateField("og_image_url", patch.ogImageUrl);
            }}
          />
        </div>
      )}
    </form>
  );
}
