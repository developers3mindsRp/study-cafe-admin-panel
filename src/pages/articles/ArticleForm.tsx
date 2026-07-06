import { useState, useRef, useEffect, type FormEvent } from "react";
import { formatDateTime } from "../../utils/formatDate";
import { Link, useLocation, useBlocker, useBeforeUnload } from "react-router";
import { RESTORE_STATE_KEY } from "./ArticlePreview";
import Label from "../../components/form/Label";
import Input from "../../components/form/input/InputField";
import TextArea from "../../components/form/input/TextArea";
import ImageUpload from "../../components/form/ImageUpload";
import MetaFieldsForm, { type SEOMetaFields } from "../../components/form/MetaFieldsForm";
import { ChipMultiSelect } from "../../components/form/ChipMultiSelect";
import Button from "../../components/ui/button/Button";
import ArticleEditor from "../../components/article-editor/ArticleEditor";
import { Modal } from "../../components/ui/modal";
import type {
  ArticleMeta,
  FeaturedImage,
  AuthorBio,
} from "../../components/blocks/types";
import { slugifyForSeo, shouldResyncSlugFromSource } from "../../lib/slug";
import { generateArticlePreviewLink } from "../../api/articles";
import DatePicker from "../../components/form/date-picker";
import { ARTICLE_TAX_TYPE_OPTIONS } from "../../constants/articleTaxTypes";
import ArticleSectionsEditor from "./components/ArticleSectionsEditor";

/** One article section: a title (TOC entry) + rich HTML content. */
export interface ArticleSection {
  id?: number;
  title: string;
  content: string;
}

export interface CaseCitationData {
  case_citation?: string;
  case_name?: string;
  appeal_number?: string;
  judgement_date?: string;
  assessment_year?: string;
  court?: string;
  link_to_case_law?: string;
}

export interface ArticleNotificationData {
  noti_no?: string;
  type_of_tax?: string;
  noti_date?: string;
}

export interface ArticleFormData {
  meta: ArticleMeta;
  featuredImage: FeaturedImage;
  /** Article body (TipTap JSON string). Single-document editor for articles. */
  body: string;
  /** Ordered sections; titles drive the public Table of Contents. */
  sections: ArticleSection[];
  author: AuthorBio;
  shareEnabled: boolean;
  status: "Draft" | "Published" | "Archived" | "Scheduled";
  /** ISO time from API when editing (hydrates datetime-local). */
  scheduled_publish_at?: string | null;
  /** Local datetime string for `<input type="datetime-local" />` (schedule publish). */
  scheduled_publish_at_local: string;
  /** Who can read full HTML on the public blog (cafestudy-fe). */
  blog_access_tier: "free" | "premium";
  /** Downloadable asset URL (PDF / judgment) shown on the article page. */
  rel_download_url?: string | null;
  /** Taxonomy IDs for backend */
  category_ids?: number[];
  tag_ids?: number[];
  article_type_ids?: number[];
  court_ids?: number[];
  citation: CaseCitationData | null;
  notification: ArticleNotificationData | null;
}

export type ArticleSubmitAction =
  | { type: "draft" }
  | { type: "publish_now" }
  | { type: "schedule" }
  | { type: "archive" };

/** Passed to parent `onSubmit` (schedule includes resolved ISO instant). */
export type ArticleFormSubmitMeta =
  | { type: "draft" }
  | { type: "publish_now" }
  | { type: "schedule"; scheduledAtIso: string }
  | { type: "archive" };

export interface ArticleTaxonomyOptions {
  categories: { id: number; name: string; slug: string | null }[];
  tags: { id: number; name: string; slug: string | null }[];
  articleTypes: { id: number; name: string; slug: string | null }[];
  courts: { id: number; name: string; slug: string | null }[];
}

interface ArticleFormProps {
  mode: "create" | "edit";
  defaultValues?: Partial<ArticleFormData>;
  onSubmit: (data: ArticleFormData, meta: ArticleFormSubmitMeta) => void;
  articleId?: string | number;
  loading?: boolean;
  taxonomyOptions?: ArticleTaxonomyOptions;
}

const emptyMeta: ArticleMeta = {
  title: "",
  subHeading: "",
  description: "",
  metaTitle: "",
  metaDesc: "",
  slug: "",
};

const emptyFeaturedImage: FeaturedImage = {
  imageUrl: "",
  linkUrl: "",
  alt: "",
  caption: "",
};

const emptyAuthor: AuthorBio = {
  name: "",
  role: "",
  imageUrl: "",
  bio: "",
};

function mergeArticleMetaPatch(meta: ArticleMeta, patch: Partial<SEOMetaFields>): ArticleMeta {
  return {
    ...meta,
    ...(patch.metaTitle !== undefined ? { metaTitle: patch.metaTitle } : {}),
    ...(patch.metaDescription !== undefined ? { metaDesc: patch.metaDescription } : {}),
    ...(patch.metaKeywords !== undefined ? { metaKeywords: patch.metaKeywords } : {}),
    ...(patch.canonicalUrl !== undefined ? { canonicalUrl: patch.canonicalUrl } : {}),
    ...(patch.robots !== undefined ? { robots: patch.robots } : {}),
    ...(patch.ogTitle !== undefined ? { ogTitle: patch.ogTitle } : {}),
    ...(patch.ogDescription !== undefined ? { ogDescription: patch.ogDescription } : {}),
    ...(patch.ogImageUrl !== undefined ? { ogImageUrl: patch.ogImageUrl } : {}),
  };
}

const emptyFormData: ArticleFormData = {
  meta: emptyMeta,
  featuredImage: emptyFeaturedImage,
  body: "",
  sections: [],
  author: emptyAuthor,
  shareEnabled: true,
  status: "Draft",
  scheduled_publish_at_local: "",
  blog_access_tier: "free",
  rel_download_url: null,
  category_ids: [],
  tag_ids: [],
  article_type_ids: [],
  court_ids: [],
  citation: null,
  notification: null,
};

function isoToDatetimeLocalValue(iso: string | null | undefined): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function minDatetimeLocalValue(minutesAhead = 1): string {
  const d = new Date();
  d.setSeconds(0, 0);
  d.setMinutes(d.getMinutes() + minutesAhead);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function sidebarBadgeLabel(status: ArticleFormData["status"]): string {
  switch (status) {
    case "Published":
      return "Published";
    case "Scheduled":
      return "Scheduled";
    case "Archived":
      return "Archived";
    default:
      return "Draft";
  }
}

function sidebarBadgeClass(status: ArticleFormData["status"]): string {
  switch (status) {
    case "Published":
      return "bg-success-50 text-success-700 ring-success-500/20 dark:bg-success-500/10 dark:text-success-400";
    case "Scheduled":
      return "bg-brand-50 text-brand-700 ring-brand-500/20 dark:bg-brand-500/10 dark:text-brand-300";
    case "Archived":
      return "bg-error-50 text-error-700 ring-error-500/20 dark:bg-error-500/10 dark:text-error-400";
    default:
      return "bg-warning-50 text-warning-800 ring-warning-500/20 dark:bg-warning-500/10 dark:text-warning-300";
  }
}

/** Preview/back-navigation state may include legacy `tags: string[]` — ignored. */
type ArticleFormSeed = Partial<ArticleFormData> & { tags?: string[] };

function buildArticleFormState(seed: ArticleFormSeed): ArticleFormData {
  const { tags: _legacyTags, ...rest } = seed;
  return {
    ...emptyFormData,
    ...rest,
    blog_access_tier: seed.blog_access_tier === "premium" ? "premium" : "free",
    // Hydrate the datetime-local input from the ISO string when not already set
    scheduled_publish_at_local:
      rest.scheduled_publish_at_local != null &&
      String(rest.scheduled_publish_at_local).trim() !== ""
        ? String(rest.scheduled_publish_at_local)
        : isoToDatetimeLocalValue(
            typeof seed.scheduled_publish_at === "string"
              ? seed.scheduled_publish_at
              : undefined,
          ),
  };
}

export default function ArticleForm({
  mode,
  defaultValues,
  onSubmit,
  articleId,
  loading = false,
  taxonomyOptions,
}: ArticleFormProps) {
  const location = useLocation();

  // Check if we're returning from preview with restored data (must preserve when Back to Editor)
  const restoredData = location.state?.[RESTORE_STATE_KEY] as ArticleFormSeed | undefined;

  const initialDataRef = useRef<ArticleFormData | null>(null);
  const submittedRef = useRef(false);
  const restoreAppliedRef = useRef(false);

  const [formData, setFormData] = useState<ArticleFormData>(() => {
    const seed = restoredData ?? { ...emptyFormData, ...defaultValues };
    const init = buildArticleFormState(seed);
    initialDataRef.current = init;
    if (restoredData) restoreAppliedRef.current = true;
    return init;
  });

  // When returning from preview, ensure restored data is applied (e.g. if form mounted with defaultValues first)
  useEffect(() => {
    if (restoredData && !restoreAppliedRef.current) {
      restoreAppliedRef.current = true;
      const init = buildArticleFormState(restoredData);
      setFormData(init);
      initialDataRef.current = init;
    }
  }, [restoredData]);

  const isDirty =
    initialDataRef.current !== null &&
    JSON.stringify(formData) !== JSON.stringify(initialDataRef.current);
  const isDirtyRef = useRef(isDirty);
  isDirtyRef.current = isDirty;

  const blocker = useBlocker(
    ({ nextLocation }) =>
      !submittedRef.current &&
      isDirtyRef.current &&
      nextLocation.pathname !== "/articles/preview"
  );

  useBeforeUnload(
    (e) => {
      if (isDirtyRef.current) {
        e.preventDefault();
        e.returnValue = "";
      }
    },
    { capture: true }
  );

  useEffect(() => {
    if (blocker.state === "blocked" && !isDirtyRef.current) {
      blocker.reset?.();
    }
  }, [blocker, blocker.state]);



  const [livePreviewLoading, setLivePreviewLoading] = useState(false);

  const handleLivePreview = async () => {
    if (!articleId) return;
    setLivePreviewLoading(true);
    try {
      const { previewUrl } = await generateArticlePreviewLink(Number(articleId));
      window.open(previewUrl, "_blank", "noopener,noreferrer");
    } catch {
      alert("Could not generate preview link. Please try again.");
    } finally {
      setLivePreviewLoading(false);
    }
  };

  const runSubmit = (action: ArticleSubmitAction) => {
    // Guard against double-submit. The Save buttons are disabled while `loading`,
    // but the Enter-key form-submit path is not — without this an in-flight save
    // could be fired again and create a duplicate article.
    if (loading) return;

    if (!formData.meta.title?.trim()) {
      alert("Please enter a title.");
      return;
    }

    if (action.type === "draft") {
      const ok = window.confirm(
        "This article will be saved as a DRAFT and will stay hidden from the public site.\n\nUse \"Publish now\" or \"Schedule publish\" to make it live.\n\nSave as draft?"
      );
      if (!ok) return;
    }

    if (action.type === "schedule") {
      const local = formData.scheduled_publish_at_local?.trim();
      if (!local) {
        alert("Please choose a date and time to schedule.");
        return;
      }
      const when = new Date(local);
      if (Number.isNaN(when.getTime())) {
        alert("Invalid schedule date.");
        return;
      }
      if (when.getTime() <= Date.now()) {
        alert("Schedule time must be in the future.");
        return;
      }
    }

    submittedRef.current = true;
    const slug =
      slugifyForSeo(formData.meta.slug) ||
      slugifyForSeo(formData.meta.title);

    let nextStatus: ArticleFormData["status"] = formData.status;
    if (action.type === "draft") nextStatus = "Draft";
    else if (action.type === "publish_now") nextStatus = "Published";
    else if (action.type === "schedule") nextStatus = "Scheduled";
    else if (action.type === "archive") nextStatus = "Archived";

    const isSchedule = action.type === "schedule";
    const payload: ArticleFormData = {
      ...formData,
      meta: { ...formData.meta, slug },
      status: nextStatus,
      scheduled_publish_at_local: isSchedule ? formData.scheduled_publish_at_local : "",
    };

    if (isSchedule) {
      onSubmit(payload, {
        type: "schedule",
        scheduledAtIso: new Date(formData.scheduled_publish_at_local.trim()).toISOString(),
      });
      return;
    }

    onSubmit(payload, action);
  };

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    runSubmit({ type: "draft" });
  };

  return (
    <>
      <form onSubmit={handleSubmit}>
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
          <div className="space-y-6">
        {/* Title + Meta (Fixed Top) */}
        <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] sm:p-6">
          <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">
            Title &amp; Meta
          </h3>
          <div className="mt-4 space-y-4">
            <div>
              <Label>
                Title <span className="text-error-500">*</span>
              </Label>
              <Input
                value={formData.meta.title}
                onChange={(e) => {
                  const title = e.target.value;
                  setFormData((prev) => {
                    const keepSync = shouldResyncSlugFromSource(
                      prev.meta.slug,
                      prev.meta.title,
                      (t) => slugifyForSeo(t),
                    );
                    return {
                      ...prev,
                      meta: {
                        ...prev.meta,
                        title,
                        slug: keepSync ? slugifyForSeo(title) : prev.meta.slug,
                      },
                    };
                  });
                }}
                placeholder="Article title"
              />
            </div>
            <div>
              <Label>Sub heading</Label>
              <Input
                value={formData.meta.subHeading ?? ""}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    meta: { ...prev.meta, subHeading: e.target.value },
                  }))
                }
                placeholder="Optional subheading below the title"
              />
            </div>
            <div>
              <Label>Short Description</Label>
              <TextArea
                value={formData.meta.description ?? ""}
                onChange={(value) =>
                  setFormData((prev) => ({
                    ...prev,
                    meta: { ...prev.meta, description: value },
                  }))
                }
                placeholder="Short description or excerpt for the article"
                rows={3}
              />
            </div>
            <div>
              <Label>Slug</Label>
              <Input
                value={formData.meta.slug}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    meta: { ...prev.meta, slug: e.target.value },
                  }))
                }
                onBlur={() =>
                  setFormData((prev) => ({
                    ...prev,
                    meta: { ...prev.meta, slug: slugifyForSeo(prev.meta.slug) },
                  }))
                }
                placeholder="Auto from title when empty; SEO format on blur"
              />
            </div>
          </div>
        </div>

        {/* Featured Image (Fixed Top) */}
        <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] sm:p-6">
          <h3 className="mb-4 text-lg font-semibold text-gray-800 dark:text-white/90">
            Featured Image
          </h3>
          <div className="space-y-4">
            <div>
              <ImageUpload
                label="Featured Image"
                value={formData.featuredImage.imageUrl}
                minWidth={1280}
                minHeight={720}
                onChange={(imageUrl) =>
                  setFormData((prev) => ({
                    ...prev,
                    featuredImage: {
                      ...prev.featuredImage,
                      imageUrl,
                    },
                  }))
                }
                placeholder="Drop or select featured image"
              />
              <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                Recommended image size: 1280x720 px (minimum required).
              </p>
            </div>
            <div>
              <Label>Link URL (optional)</Label>
              <Input
                value={formData.featuredImage.linkUrl ?? ""}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    featuredImage: {
                      ...prev.featuredImage,
                      linkUrl: e.target.value,
                    },
                  }))
                }
                placeholder="https://..."
              />
            </div>
            <div>
              <Label>Alt text (optional)</Label>
              <Input
                value={formData.featuredImage.alt ?? ""}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    featuredImage: {
                      ...prev.featuredImage,
                      alt: e.target.value,
                    },
                  }))
                }
                placeholder="Describe the image"
              />
            </div>
            <div>
              <Label>Caption (optional)</Label>
              <TextArea
                rows={2}
                value={formData.featuredImage.caption ?? ""}
                onChange={(value) =>
                  setFormData((prev) => ({
                    ...prev,
                    featuredImage: {
                      ...prev.featuredImage,
                      caption: value,
                    },
                  }))
                }
                placeholder="Image caption"
              />
            </div>
          </div>
        </div>

        {/* Article Body (single-document editor; paste-friendly) */}
        <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] sm:p-6">
          <h3 className="mb-4 text-lg font-semibold text-gray-800 dark:text-white/90">
            Content
          </h3>
          <ArticleEditor
            value={formData.body}
            onChange={(body) => setFormData((prev) => ({ ...prev, body }))}
            placeholder="Write your article… Paste from Word, Google Docs, or any editor."
            minHeight="400px"
          />
        </div>

        {/* Sections — repeatable; titles drive the Table of Contents */}
        <ArticleSectionsEditor
          value={formData.sections}
          onChange={(sections) => setFormData((prev) => ({ ...prev, sections }))}
        />
      {/* Share & access */}
      <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] sm:p-6">
        <h3 className="mb-4 text-lg font-semibold text-gray-800 dark:text-white/90">
          Share &amp; Access
        </h3>
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="shareEnabled"
              checked={formData.shareEnabled}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  shareEnabled: e.target.checked,
                }))
              }
              className="rounded border-gray-300 text-brand-500 focus:ring-brand-500"
            />
            <Label htmlFor="shareEnabled" className="cursor-pointer">
              Enable share buttons
            </Label>
          </div>
          <div>
            <Label>Blog access</Label>
            <p className="mb-2 text-xs text-gray-500 dark:text-gray-400">
              Premium: full article on the public site is for logged-in members (preview for others). Free: everyone
              sees the full article.
            </p>
            <select
              value={formData.blog_access_tier}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  blog_access_tier: e.target.value as ArticleFormData["blog_access_tier"],
                }))
              }
              className="w-full rounded-lg border border-gray-200 bg-white px-4 py-3 text-sm text-gray-800 dark:border-gray-800 dark:bg-white/[0.03] dark:text-white/90"
            >
              <option value="free">Free (public)</option>
              <option value="premium">Premium (members)</option>
            </select>
          </div>
          <div>
            <Label>Download URL (PDF / Judgment)</Label>
            <p className="mb-2 text-xs text-gray-500 dark:text-gray-400">
              Paste the full URL or upload path to the PDF. A "Download PDF" button will appear on the article page.
              Premium articles: only paid members can download; others see the upgrade prompt.
            </p>
            <Input
              value={formData.rel_download_url ?? ""}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  rel_download_url: e.target.value || null,
                }))
              }
              placeholder="https://... or /api/uploads/..."
            />
          </div>
        </div>
      </div>

      <div className="">
        <div className="mt-4 bg-white">
          <MetaFieldsForm
            value={{
              metaTitle: formData.meta.metaTitle ?? "",
              metaDescription: formData.meta.metaDesc ?? "",
              metaKeywords: formData.meta.metaKeywords ?? "",
              canonicalUrl: formData.meta.canonicalUrl ?? "",
              robots: formData.meta.robots ?? "index, follow",
              ogTitle: formData.meta.ogTitle ?? "",
              ogDescription: formData.meta.ogDescription ?? "",
              ogImageUrl:
                formData.meta.ogImageUrl ??
                formData.featuredImage.imageUrl ??
                "",
            }}
            onChange={(patch) =>
              setFormData((prev) => ({
                ...prev,
                meta: mergeArticleMetaPatch(prev.meta, patch),
              }))
            }
            collapsible
            defaultOpen={false}
          />
        </div>
      </div>

        {/* Notification */}
        <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] sm:p-6">
          <h3 className="mb-4 text-lg font-semibold text-gray-800 dark:text-white/90">
            Notification
          </h3>
          <div className="space-y-4">
            <div>
              <Label>Notification Number</Label>
              <Input
                value={formData.notification?.noti_no ?? ""}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    notification: { ...(prev.notification || {}), noti_no: e.target.value },
                  }))
                }
                placeholder="e.g. 12/2024"
              />
            </div>
            <div>
              <Label>Type of Tax</Label>
              <select
                value={formData.notification?.type_of_tax ?? ""}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    notification: { ...(prev.notification || {}), type_of_tax: e.target.value },
                  }))
                }
                className="w-full rounded-lg border border-gray-200 bg-white px-4 py-3 text-sm text-gray-800 dark:border-gray-800 dark:bg-white/[0.03] dark:text-white/90"
              >
                {ARTICLE_TAX_TYPE_OPTIONS.map((opt) => (
                  <option key={opt.value || "empty"} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <DatePicker
                id="article-notification-date"
                label="Notification Date"
                placeholder="Select notification date"
                value={formData.notification?.noti_date ?? ""}
                onChange={(_, dateStr) =>
                  setFormData((prev) => ({
                    ...prev,
                    notification: { ...(prev.notification || {}), noti_date: dateStr },
                  }))
                }
              />
            </div>
          </div>
        </div>

        {/* Case Citation */}
        <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] sm:p-6">
          <h3 className="mb-4 text-lg font-semibold text-gray-800 dark:text-white/90">
            Case Citation
          </h3>
          <div className="space-y-4">
            <div>
              <Label>Case Citation</Label>
              <p className="mb-2 text-xs text-gray-500 dark:text-gray-400">
                Case Name, Appeal Number, Date of Decision, Assessment Year.
              </p>
              <Input
                value={formData.citation?.case_citation ?? ""}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    citation: { ...(prev.citation || {}), case_citation: e.target.value },
                  }))
                }
              />
            </div>
            <div>
              <Label>Case Name</Label>
              <Input
                value={formData.citation?.case_name ?? ""}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    citation: { ...(prev.citation || {}), case_name: e.target.value },
                  }))
                }
              />
            </div>
            <div className="grid gap-6 sm:grid-cols-2">
              <div>
                <Label>Appeal Number</Label>
                <Input
                  value={formData.citation?.appeal_number ?? ""}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      citation: { ...(prev.citation || {}), appeal_number: e.target.value },
                    }))
                  }
                />
              </div>
              <div>
                <Label>Date of Judgement/Order</Label>
                <Input
                  value={formData.citation?.judgement_date ?? ""}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      citation: { ...(prev.citation || {}), judgement_date: e.target.value },
                    }))
                  }
                />
              </div>
            </div>
            <div className="grid gap-6 sm:grid-cols-2">
              <div>
                <Label>Related Assessment Year</Label>
                <Input
                  value={formData.citation?.assessment_year ?? ""}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      citation: { ...(prev.citation || {}), assessment_year: e.target.value },
                    }))
                  }
                />
              </div>
              <div>
                {taxonomyOptions?.courts && taxonomyOptions.courts.length > 0 ? (
                  <>
                    <Label>Court</Label>
                    <select
                      value={formData.citation?.court ?? ""}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          citation: { ...(prev.citation || {}), court: e.target.value },
                        }))
                      }
                      className="w-full rounded-lg border border-gray-200 bg-white px-4 py-3 text-sm text-gray-800 dark:border-gray-800 dark:bg-white/[0.03] dark:text-white/90"
                    >
                      <option value="">Select Court...</option>
                      {taxonomyOptions.courts.map((c) => (
                        <option key={c.id} value={c.name}>
                          {c.name}
                        </option>
                      ))}
                    </select>
                  </>
                ) : (
                  <>
                    <Label>Court</Label>
                    <Input
                      value={formData.citation?.court ?? ""}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          citation: { ...(prev.citation || {}), court: e.target.value },
                        }))
                      }
                    />
                  </>
                )}
              </div>
            </div>
            <div>
              <Label>Link To Case Law</Label>
              <Input
                value={formData.citation?.link_to_case_law ?? ""}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    citation: { ...(prev.citation || {}), link_to_case_law: e.target.value },
                  }))
                }
              />
            </div>
          </div>
        </div>

        {/* Author Bio — create only; author is locked after first save */}
        {mode === "create" ? (
        <div className="rounded-2xl hidden border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] sm:p-6">
          <h3 className="mb-4 text-lg font-semibold text-gray-800 dark:text-white/90">
            Author Bio
          </h3>
          <div className="space-y-4">
            <div>
              <Label>Name</Label>
              <Input
                value={formData.author.name}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    author: { ...prev.author, name: e.target.value },
                  }))
                }
                placeholder="Author name"
              />
            </div>
            <div>
              <Label>Role (optional)</Label>
              <Input
                value={formData.author.role ?? ""}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    author: { ...prev.author, role: e.target.value },
                  }))
                }
                placeholder="e.g. CA, CFA"
              />
            </div>
            <div>
              <ImageUpload
                label="Author photo (optional)"
                value={formData.author.imageUrl ?? ""}
                onChange={(imageUrl) =>
                  setFormData((prev) => ({
                    ...prev,
                    author: { ...prev.author, imageUrl },
                  }))
                }
                placeholder="Drop or select author photo"
              />
            </div>
            <div>
              <Label>Bio (optional)</Label>
              <TextArea
                rows={3}
                value={formData.author.bio ?? ""}
                onChange={(value) =>
                  setFormData((prev) => ({
                    ...prev,
                    author: { ...prev.author, bio: value },
                  }))
                }
                placeholder="Brief author bio"
              />
            </div>
          </div>
        </div>
        ) : null}

        {/* Taxonomies (Categories, Tags, Article Types, Courts) — chip-style multi-select */}
        {taxonomyOptions && (
          <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] sm:p-6">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
              <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">
                Categories &amp; Tags
              </h3>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Manage{" "}
                <Link to="/article-masters/tags" className="text-brand-500 hover:text-brand-600">
                  tags
                </Link>
                {", "}
                <Link to="/article-masters/article-types" className="text-brand-500 hover:text-brand-600">
                  article types
                </Link>
                {", and "}
                <Link to="/article-masters/courts" className="text-brand-500 hover:text-brand-600">
                  courts
                </Link>
              </p>
            </div>
            <div className="grid gap-6 sm:grid-cols-2">
              {taxonomyOptions.categories.length > 0 && (
                <ChipMultiSelect
                  label="Categories"
                  options={taxonomyOptions.categories}
                  value={formData.category_ids ?? []}
                  onChange={(v) => setFormData((prev) => ({ ...prev, category_ids: v }))}
                  placeholder="Search categories…"
                />
              )}
              <ChipMultiSelect
                label="Tags"
                options={taxonomyOptions.tags}
                value={formData.tag_ids ?? []}
                onChange={(v) => setFormData((prev) => ({ ...prev, tag_ids: v }))}
                placeholder="Search tags…"
              />
              <ChipMultiSelect
                label="Article types"
                options={taxonomyOptions.articleTypes}
                value={formData.article_type_ids ?? []}
                onChange={(v) => setFormData((prev) => ({ ...prev, article_type_ids: v }))}
                placeholder="Search article types…"
              />
              <ChipMultiSelect
                label="Courts"
                options={taxonomyOptions.courts}
                value={formData.court_ids ?? []}
                onChange={(v) => setFormData((prev) => ({ ...prev, court_ids: v }))}
                placeholder="Search courts…"
              />
            </div>
          </div>
        )}

      <div className="flex flex-wrap gap-3 pt-2">
        <Link to="/articles">
          <Button variant="outline" size="sm">
            Back to list
          </Button>
        </Link>
        <p className="w-full text-xs text-gray-500 dark:text-gray-400 lg:w-auto lg:py-2">
          Tip: press Enter in a field to save as draft. Use the panel on the right to publish or schedule.
        </p>
      </div>
          </div>

        <aside className="space-y-4 lg:sticky lg:top-6 lg:self-start">
          <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-theme-xs dark:border-gray-800 dark:bg-white/[0.03]">
            <h3 className="text-base font-semibold text-gray-800 dark:text-white/90">
              Publish
            </h3>
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              Choose how this article should go live. Drafts stay private until you publish or schedule.
            </p>

            <div className={`mt-4 inline-flex rounded-full px-3 py-1 text-xs font-medium ring-1 ring-inset ${sidebarBadgeClass(formData.status)}`}>
              {sidebarBadgeLabel(formData.status)}
            </div>

            {formData.status === "Scheduled" && formData.scheduled_publish_at_local ? (
              <p className="mt-2 text-xs text-gray-600 dark:text-gray-300">
                Goes live{" "}
                <span className="font-medium">
                  {formatDateTime(formData.scheduled_publish_at_local)}
                </span>
              </p>
            ) : null}

            {mode === "edit" ? (
              <div className="mt-4 border-t border-gray-200 pt-4 dark:border-gray-800">
                <Label>Author</Label>
                <p className="mt-1 text-sm font-medium text-gray-800 dark:text-white/90">
                  {formData.author.name?.trim() || "—"}
                </p>
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  Original author is preserved when editing.
                </p>
              </div>
            ) : null}

            <div className="mt-5 flex flex-col gap-2">
              <button
                type="button"
                disabled={loading}
                onClick={() => runSubmit({ type: "draft" })}
                className="inline-flex w-full items-center justify-center rounded-lg px-4 py-2.5 text-sm font-medium ring-1 ring-inset ring-gray-300 bg-white text-gray-800 hover:bg-gray-50 disabled:opacity-50 dark:bg-gray-900 dark:text-white dark:ring-gray-700 dark:hover:bg-white/[0.06]"
              >
                {loading ? "Saving…" : "Save draft"}
              </button>
              <button
                type="button"
                disabled={loading}
                onClick={() => runSubmit({ type: "publish_now" })}
                className="inline-flex w-full items-center justify-center rounded-lg px-4 py-2.5 text-sm font-medium text-white bg-brand-500 shadow-theme-xs hover:bg-brand-600 disabled:opacity-50"
              >
                {loading ? "Saving…" : "Publish now"}
              </button>
              {/* Preview button hidden — use Live Preview instead
              <button
                type="button"
                disabled={loading}
                onClick={handlePreview}
                className="inline-flex w-full items-center justify-center rounded-lg px-4 py-2.5 text-sm font-medium ring-1 ring-inset ring-gray-300 bg-white text-gray-800 hover:bg-gray-50 dark:bg-gray-900 dark:text-white dark:ring-gray-700 dark:hover:bg-white/[0.06]"
              >
                Preview
              </button>
              */}
              {mode === "edit" && articleId && (
                <button
                  type="button"
                  disabled={livePreviewLoading}
                  onClick={handleLivePreview}
                  className="inline-flex w-full items-center justify-center rounded-lg px-4 py-2.5 text-sm font-medium ring-1 ring-inset ring-brand-300 bg-brand-50 text-brand-700 hover:bg-brand-100 disabled:opacity-50 dark:bg-brand-500/10 dark:text-brand-300 dark:ring-brand-500/30"
                >
                  {livePreviewLoading ? "Generating…" : "Live Preview ↗"}
                </button>
              )}
            </div>

            <div className="mt-6 border-t border-gray-200 pt-5 dark:border-gray-800">
              <Label>Schedule for later</Label>
              <p className="mb-2 text-xs text-gray-500 dark:text-gray-400">
                Article will appear on the public site at the time you pick (your local timezone).
              </p>
              <input
                type="datetime-local"
                min={minDatetimeLocalValue(1)}
                value={formData.scheduled_publish_at_local}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    scheduled_publish_at_local: e.target.value,
                  }))
                }
                className="mt-1 w-full rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-sm text-gray-800 dark:border-gray-800 dark:bg-white/[0.03] dark:text-white/90"
              />
              <button
                type="button"
                disabled={loading}
                onClick={() => runSubmit({ type: "schedule" })}
                className="mt-3 inline-flex w-full items-center justify-center rounded-lg px-4 py-2.5 text-sm font-medium text-brand-700 ring-1 ring-inset ring-brand-200 bg-brand-50 hover:bg-brand-100 disabled:opacity-50 dark:bg-brand-500/10 dark:text-brand-300 dark:ring-brand-500/30"
              >
                {loading ? "Saving…" : "Schedule publish"}
              </button>
            </div>

            {mode === "edit" ? (
              <div className="mt-4 border-t border-gray-200 pt-4 dark:border-gray-800">
                <button
                  type="button"
                  disabled={loading}
                  onClick={() => {
                    if (!window.confirm("Archive this article? It will be hidden from the public blog.")) return;
                    runSubmit({ type: "archive" });
                  }}
                  className="inline-flex w-full items-center justify-center rounded-lg px-4 py-2.5 text-sm font-medium text-error-600 ring-1 ring-inset ring-error-200 hover:bg-error-50 disabled:opacity-50 dark:text-error-400 dark:ring-error-500/30 dark:hover:bg-error-500/10"
                >
                  Archive article
                </button>
              </div>
            ) : null}
          </div>
        </aside>
        </div>
      </form>

      <Modal
        isOpen={blocker.state === "blocked"}
        onClose={() => blocker.reset?.()}
        className="max-w-[425px] m-4"
        showCloseButton={true}
      >
        <div className="p-6 sm:p-8">
          <h3 className="mb-2 text-lg font-semibold text-gray-800 dark:text-white/90">
            Unsaved changes
          </h3>
          <p className="mb-6 text-sm text-gray-500 dark:text-gray-400">
            You have unsaved changes. If you leave now, your progress may be lost. Are you sure you want to leave?
          </p>
          <div className="flex flex-wrap items-center justify-end gap-3">
            <Button variant="outline" size="sm" onClick={() => blocker.reset?.()}>
              Stay
            </Button>
            <button
              type="button"
              onClick={() => blocker.proceed?.()}
              className="inline-flex items-center justify-center gap-2 rounded-lg px-4 py-3 text-sm font-medium text-white transition bg-brand-500 shadow-theme-xs hover:bg-brand-600"
            >
              Leave
            </button>
          </div>
        </div>
      </Modal>
    </>
  );
}
