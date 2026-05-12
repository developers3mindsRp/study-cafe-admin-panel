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
      navigate("/articles");
    } catch (err: unknown) {
      console.error("Failed to update article", err);
      alert(getApiErrorMessage(err, "Failed to update article"));
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
    author: { name: "", role: "", imageUrl: "", bio: "" },
    tagsCommaRaw: article.tags?.map((t) => t.name.trim()).filter(Boolean).join(", ") ?? "",
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
      <ArticleForm
        key={id}
        mode="edit"
        defaultValues={defaultValues}
        onSubmit={handleSubmit}
        articleId={id}
        loading={submitting}
        taxonomyOptions={taxonomyOptions}
      />
    </>
  );
}
