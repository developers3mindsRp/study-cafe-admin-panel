import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router";
import PageMeta from "../../components/common/PageMeta";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import ArticleForm, {
  type ArticleFormData,
  type ArticleFormSubmitMeta,
  type ArticleTaxonomyOptions,
} from "./ArticleForm";
import { articleFormToApiPayload } from "./articlePayload";
import { articlesApi, fetchArticleCategories, fetchTags, fetchArticleTypes, fetchCourts, type ArticleRecord } from "../../api/articles";
import { decodeSlugForDisplay } from "../../lib/slug";
import { getApiErrorMessage } from "../../lib/apiError";
import { useArticleEditLock } from "../../hooks/useArticleEditLock";
import { Modal } from "../../components/ui/modal";
import Button from "../../components/ui/button/Button";
import { toast } from "react-toastify";

function statusToForm(s: string): ArticleFormData["status"] {
  if (s === "publish" || s === "published") return "Published";
  if (s === "archived") return "Archived";
  if (s === "scheduled") return "Scheduled";
  return "Draft";
}

function tierFromApi(t: string | undefined | null): ArticleFormData["blog_access_tier"] {
  return t === "premium" ? "premium" : "free";
}

function statusToBackend(s: ArticleFormData["status"]) {
  if (s === "Published") return "publish";
  if (s === "Archived") return "archived";
  if (s === "Scheduled") return "scheduled";
  return "draft";
}

/** Prefer snake_case API keys; accept camelCase if any proxy transforms responses. */
function pickArticleStr(record: Record<string, unknown>, snake: string, camel: string): string {
  const a = record[snake];
  const b = record[camel];
  if (typeof a === "string") return a;
  if (typeof b === "string") return b;
  return "";
}

export default function ArticleEdit() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [article, setArticle] = useState<ArticleRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [taxonomyOptions, setTaxonomyOptions] = useState<ArticleTaxonomyOptions>({
    categories: [],
    tags: [],
    articleTypes: [],
    courts: [],
  });
  const editLock = useArticleEditLock(id);
  const [lockWarningDismissed, setLockWarningDismissed] = useState(false);

  // Reset the dismissal when we (re)gain the lock so a fresh takeover by
  // someone else warns again instead of silently reusing the old dismissal.
  useEffect(() => {
    if (editLock.status === "acquired") setLockWarningDismissed(false);
  }, [editLock.status]);

  const lockedByName =
    editLock.status === "locked" ? editLock.lockedBy.user_name || "Another user" : null;

  useEffect(() => {
    if (id) {
      articlesApi
        .get(id)
        .then(setArticle)
        .catch(() => navigate("/articles"))
        .finally(() => setLoading(false));
    }
  }, [id, navigate]);

  useEffect(() => {
    Promise.all([
      fetchArticleCategories(),
      fetchTags(),
      fetchArticleTypes(),
      fetchCourts(),
    ]).then(([categories, tags, articleTypes, courts]) => {
      setTaxonomyOptions({ categories, tags, articleTypes, courts });
    }).catch(console.error);
  }, []);

  const handleSubmit = async (formData: ArticleFormData, meta: ArticleFormSubmitMeta) => {
    if (!id) return;
    try {
      setSubmitting(true);
      const scheduled_publish_at =
        meta.type === "schedule" ? meta.scheduledAtIso : null;
      const payload = {
        ...articleFormToApiPayload(formData),
        status: statusToBackend(formData.status),
        scheduled_publish_at,
        meta_title: formData.meta.metaTitle || null,
        meta_description: formData.meta.metaDesc || null,
        meta_keywords: formData.meta.metaKeywords || null,
        category_ids: formData.category_ids ?? [],
        tag_ids: formData.tag_ids ?? [],
        article_type_ids: formData.article_type_ids ?? [],
        court_ids: formData.court_ids ?? [],
        blog_access_tier: formData.blog_access_tier,
        rel_download_url: formData.rel_download_url || null,
        citation: formData.citation || null,
      };
      await articlesApi.update(id, payload);
      toast.success("Article updated successfully!");
    } catch (err: unknown) {
      console.error("Failed to update article", err);
      toast.error(getApiErrorMessage(err, "Failed to update article"));
    } finally {
      setSubmitting(false);
    }
  };

  if (loading || !article) return <div className="p-6 text-center">Loading…</div>;

  const articleContent =
    article.content ??
    (article as unknown as Record<string, unknown>).content ??
    (article as unknown as Record<string, unknown>).body ??
    "";
  const raw = article as unknown as Record<string, unknown>;
  const defaultValues: ArticleFormData = {
    meta: {
      title: article.title,
      subHeading: pickArticleStr(raw, "sub_heading", "subHeading"),
      description: article.excerpt ?? "",
      metaTitle: pickArticleStr(raw, "meta_title", "metaTitle"),
      metaDesc: pickArticleStr(raw, "meta_description", "metaDescription"),
      metaKeywords: pickArticleStr(raw, "meta_keywords", "metaKeywords"),
      slug: decodeSlugForDisplay(article.slug) ?? "",
      canonicalUrl: pickArticleStr(raw, "canonical_url", "canonicalUrl"),
      robots: (typeof raw.robots === "string" && raw.robots
        ? raw.robots
        : "index, follow") as ArticleFormData["meta"]["robots"],
      ogTitle: pickArticleStr(raw, "og_title", "ogTitle"),
      ogDescription: pickArticleStr(raw, "og_description", "ogDescription"),
      ogImageUrl: pickArticleStr(raw, "og_image_url", "ogImageUrl"),
    },
    featuredImage: {
      imageUrl: article.thumbnail_url ?? "",
      linkUrl: pickArticleStr(raw, "thumbnail_link_url", "thumbnailLinkUrl"),
      alt: pickArticleStr(raw, "thumbnail_alt", "thumbnailAlt"),
      caption: pickArticleStr(raw, "thumbnail_caption", "thumbnailCaption"),
    },
    body: typeof articleContent === "string" ? articleContent : "",
    sections: (article.sections ?? []).map((s) => ({
      id: s.id,
      title: s.title ?? "",
      content: s.content ?? "",
    })),
    author: { name: article.author_name ?? "", role: "", imageUrl: "", bio: "" },
    shareEnabled: true,
    status: statusToForm(article.status),
    scheduled_publish_at: article.scheduled_publish_at ?? null,
    scheduled_publish_at_local: "", // hydrated by buildArticleFormState from scheduled_publish_at
    blog_access_tier: tierFromApi(article.blog_access_tier),
    rel_download_url: article.rel_download_url ?? null,
    category_ids: article.category_ids ?? [],
    tag_ids: article.tag_ids ?? [],
    article_type_ids: article.article_type_ids ?? [],
    court_ids: article.court_ids ?? [],
    citation: article.citation ?? null,
    notification: {
      noti_no: pickArticleStr(raw, "noti_no", "notiNo"),
      noti_date: pickArticleStr(raw, "noti_date", "notiDate"),
      type_of_tax: pickArticleStr(raw, "type_of_tax", "typeOfTax"),
    },
  };

  return (
    <>
      <PageMeta title="Edit Article | StudyCafe Admin" description="Edit article for studycafe.in" />
      <PageBreadcrumb
        pageTitle="Edit"
        items={[
          { label: "Articles", path: "/articles" },
          { label: article.title || `Article ${id}`, path: `/articles/${id}` },
        ]}
      />
      {editLock.status === "locked" && lockWarningDismissed && (
        <div className="mb-4 rounded-lg border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-800 dark:border-amber-500/40 dark:bg-amber-500/10 dark:text-amber-300">
          <strong>{lockedByName}</strong> is currently editing this article. Saving your changes may
          overwrite their work.
        </div>
      )}
      <ArticleForm
        key={id}
        mode="edit"
        defaultValues={defaultValues}
        onSubmit={handleSubmit}
        articleId={id}
        loading={submitting}
        taxonomyOptions={taxonomyOptions}
      />

      <Modal
        isOpen={editLock.status === "locked" && !lockWarningDismissed}
        onClose={() => setLockWarningDismissed(true)}
        className="max-w-[425px] m-4"
        showCloseButton={true}
      >
        <div className="p-6 sm:p-8">
          <h3 className="mb-2 text-lg font-semibold text-gray-800 dark:text-white/90">
            Article is being edited
          </h3>
          <p className="mb-6 text-sm text-gray-500 dark:text-gray-400">
            <strong>{lockedByName}</strong> is currently editing this article. You can view it, but
            any changes you save may overwrite their work. You will get edit access automatically
            once they leave.
          </p>
          <div className="flex flex-wrap items-center justify-end gap-3">
            <Button variant="outline" size="sm" onClick={() => navigate("/articles")}>
              Go back
            </Button>
            <button
              type="button"
              onClick={() => setLockWarningDismissed(true)}
              className="inline-flex items-center justify-center gap-2 rounded-lg px-4 py-3 text-sm font-medium text-white transition bg-warning-500 shadow-theme-xs hover:bg-warning-600"
            >
              Edit anyway
            </button>
          </div>
        </div>
      </Modal>
    </>
  );
}
