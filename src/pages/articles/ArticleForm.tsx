import { useState, useRef, useEffect } from "react";
import { Link, useNavigate, useLocation, useBlocker, useBeforeUnload } from "react-router";
import { PREVIEW_STATE_KEY, RESTORE_STATE_KEY } from "./ArticlePreview";
import Label from "../../components/form/Label";
import Input from "../../components/form/input/InputField";
import TextArea from "../../components/form/input/TextArea";
import ImageUpload from "../../components/form/ImageUpload";
import MetaFieldsForm from "../../components/form/MetaFieldsForm";
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

export interface ArticleFormData {
  meta: ArticleMeta;
  featuredImage: FeaturedImage;
  /** Article body (TipTap JSON string). Single-document editor for articles. */
  body: string;
  author: AuthorBio;
  tags: string[];
  shareEnabled: boolean;
  status: "Draft" | "Published" | "Archived";
  /** Who can read full HTML on the public blog (cafestudy-fe). */
  blog_access_tier: "free" | "premium";
  /** Downloadable asset URL (PDF / judgment) shown on the article page. */
  rel_download_url?: string | null;
  /** Taxonomy IDs for backend */
  category_ids?: number[];
  tag_ids?: number[];
  article_type_ids?: number[];
  court_ids?: number[];
}

export interface ArticleTaxonomyOptions {
  categories: { id: number; name: string; slug: string | null }[];
  tags: { id: number; name: string; slug: string | null }[];
  articleTypes: { id: number; name: string; slug: string | null }[];
  courts: { id: number; name: string; slug: string | null }[];
}

interface ArticleFormProps {
  mode: "create" | "edit";
  defaultValues?: Partial<ArticleFormData>;
  onSubmit: (data: ArticleFormData) => void;
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

const emptyFormData: ArticleFormData = {
  meta: emptyMeta,
  featuredImage: emptyFeaturedImage,
  body: "",
  author: emptyAuthor,
  tags: [],
  shareEnabled: true,
  status: "Draft",
  blog_access_tier: "free",
  rel_download_url: null,
  category_ids: [],
  tag_ids: [],
  article_type_ids: [],
  court_ids: [],
};

export default function ArticleForm({
  mode,
  defaultValues,
  onSubmit,
  articleId,
  loading = false,
  taxonomyOptions,
}: ArticleFormProps) {
  const navigate = useNavigate();
  const location = useLocation();

  // Check if we're returning from preview with restored data (must preserve when Back to Editor)
  const restoredData = location.state?.[RESTORE_STATE_KEY] as ArticleFormData | undefined;

  const initialDataRef = useRef<ArticleFormData | null>(null);
  const submittedRef = useRef(false);
  const restoreAppliedRef = useRef(false);

  const [formData, setFormData] = useState<ArticleFormData>(() => {
    const raw = restoredData ?? { ...emptyFormData, ...defaultValues };
    const init: ArticleFormData = {
      ...emptyFormData,
      ...raw,
      blog_access_tier: raw.blog_access_tier === "premium" ? "premium" : "free",
    };
    initialDataRef.current = init;
    if (restoredData) restoreAppliedRef.current = true;
    return init;
  });

  // When returning from preview, ensure restored data is applied (e.g. if form mounted with defaultValues first)
  useEffect(() => {
    if (restoredData && !restoreAppliedRef.current) {
      restoreAppliedRef.current = true;
      const init: ArticleFormData = {
        ...emptyFormData,
        ...restoredData,
        blog_access_tier: restoredData.blog_access_tier === "premium" ? "premium" : "free",
      };
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

  const handlePreview = () => {
    const returnPath = mode === "edit" && articleId
      ? `/articles/${articleId}/edit`
      : "/articles/create";
    navigate("/articles/preview", {
      state: {
        [PREVIEW_STATE_KEY]: formData,
        returnPath,
        taxonomyOptions: taxonomyOptions ?? undefined,
      },
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    submittedRef.current = true;
    const slug =
      slugifyForSeo(formData.meta.slug) ||
      slugifyForSeo(formData.meta.title);
    onSubmit({
      ...formData,
      meta: { ...formData.meta, slug },
    });
  };

  const submitLabel = mode === "create" ? "Create Article" : "Update Article";

  return (
    <>
    <form onSubmit={handleSubmit} className="space-y-6">
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
            <Label>Description</Label>
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

      {/* Author Bio (Fixed Bottom) */}
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

      {/* Taxonomies (Categories, Tags, Article Types, Courts) — chip-style multi-select */}
      {taxonomyOptions && (
        <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] sm:p-6">
          <h3 className="mb-4 text-lg font-semibold text-gray-800 dark:text-white/90">
            Categories &amp; Tags
          </h3>
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
            {taxonomyOptions.tags.length > 0 && (
              <ChipMultiSelect
                label="Tags"
                options={taxonomyOptions.tags}
                value={formData.tag_ids ?? []}
                onChange={(v) => setFormData((prev) => ({ ...prev, tag_ids: v }))}
                placeholder="Search tags…"
              />
            )}
            {taxonomyOptions.articleTypes.length > 0 && (
              <ChipMultiSelect
                label="Article types"
                options={taxonomyOptions.articleTypes}
                value={formData.article_type_ids ?? []}
                onChange={(v) => setFormData((prev) => ({ ...prev, article_type_ids: v }))}
                placeholder="Search article types…"
              />
            )}
            {taxonomyOptions.courts.length > 0 && (
              <ChipMultiSelect
                label="Courts"
                options={taxonomyOptions.courts}
                value={formData.court_ids ?? []}
                onChange={(v) => setFormData((prev) => ({ ...prev, court_ids: v }))}
                placeholder="Search courts…"
              />
            )}
          </div>
        </div>
      )}

      {/* Tags + Share (Fixed Bottom) */}
      <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] sm:p-6">
        <h3 className="mb-4 text-lg font-semibold text-gray-800 dark:text-white/90">
          Tags &amp; Share
        </h3>
        <div className="space-y-4">
          <div>
            <Label>Tags (comma-separated, optional)</Label>
            <Input
              value={formData.tags.join(", ")}
              onChange={(e) => {
                const tags = e.target.value
                  .split(",")
                  .map((s) => s.trim())
                  .filter(Boolean);
                setFormData((prev) => ({ ...prev, tags }));
              }}
              placeholder="GST, Tax, Finance"
            />
          </div>
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
            <Label>Status</Label>
            <select
              value={formData.status}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  status: e.target.value as ArticleFormData["status"],
                }))
              }
              className="w-full rounded-lg border border-gray-200 bg-white px-4 py-3 text-sm text-gray-800 dark:border-gray-800 dark:bg-white/[0.03] dark:text-white/90"
            >
              <option value="Draft">Draft</option>
              <option value="Published">Published</option>
              <option value="Archived">Archived</option>
            </select>
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
                meta: {
                  ...prev.meta,
                  metaTitle: patch.metaTitle ?? prev.meta.metaTitle,
                  metaDesc: patch.metaDescription ?? prev.meta.metaDesc,
                  metaKeywords: patch.metaKeywords ?? prev.meta.metaKeywords,
                  canonicalUrl: patch.canonicalUrl ?? prev.meta.canonicalUrl,
                  robots: patch.robots ?? prev.meta.robots,
                  ogTitle: patch.ogTitle ?? prev.meta.ogTitle,
                  ogDescription: patch.ogDescription ?? prev.meta.ogDescription,
                  ogImageUrl: patch.ogImageUrl ?? prev.meta.ogImageUrl,
                },
              }))
            }
            collapsible
            defaultOpen={false}
          />
        </div>
      </div>
      <div className="flex flex-wrap gap-3">
        <button
          type="submit"
          disabled={loading}
          className="inline-flex items-center justify-center gap-2 rounded-lg px-4 py-3 text-sm font-medium text-white transition bg-brand-500 shadow-theme-xs hover:bg-brand-600 disabled:opacity-50"
        >
          {loading ? "Saving…" : submitLabel}
        </button>
        <button
          type="button"
          onClick={handlePreview}
          className="inline-flex items-center justify-center gap-2 rounded-lg px-4 py-3 text-sm bg-white text-gray-700 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 dark:bg-gray-800 dark:text-gray-400 dark:ring-gray-700 dark:hover:bg-white/[0.03] dark:hover:text-gray-300"
        >
          Preview
        </button>
        <Link to="/articles">
          <Button variant="outline" size="sm">
            Cancel
          </Button>
        </Link>
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
