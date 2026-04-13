import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router";
import PageMeta from "../../components/common/PageMeta";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import ArticleForm, { type ArticleFormData, type ArticleTaxonomyOptions } from "./ArticleForm";
import { articlesApi, fetchArticleCategories, fetchTags, fetchArticleTypes, fetchCourts, type ArticleRecord } from "../../api/articles";
import { decodeSlugForDisplay } from "../../lib/slug";

function statusToForm(s: string): ArticleFormData["status"] {
  if (s === "publish" || s === "published") return "Published";
  if (s === "archived") return "Archived";
  return "Draft";
}

function tierFromApi(t: string | undefined | null): ArticleFormData["blog_access_tier"] {
  return t === "premium" ? "premium" : "free";
}

function statusToBackend(s: ArticleFormData["status"]) {
  if (s === "Published") return "publish";
  if (s === "Archived") return "archived";
  return "draft";
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

  const handleSubmit = async (formData: ArticleFormData) => {
    if (!id) return;
    try {
      setSubmitting(true);
      const payload = {
        title: formData.meta.title,
        slug: formData.meta.slug || undefined,
        excerpt: formData.meta.description || null,
        content: formData.body || null,
        thumbnail_url: formData.featuredImage?.imageUrl || null,
        status: statusToBackend(formData.status),
        meta_title: formData.meta.metaTitle || null,
        meta_description: formData.meta.metaDesc || null,
        category_ids: formData.category_ids ?? [],
        tag_ids: formData.tag_ids ?? [],
        article_type_ids: formData.article_type_ids ?? [],
        court_ids: formData.court_ids ?? [],
        blog_access_tier: formData.blog_access_tier,
        rel_download_url: formData.rel_download_url || null,
      };
      await articlesApi.update(id, payload);
      navigate("/articles");
    } catch (err) {
      console.error("Failed to update article", err);
      alert("Failed to update article");
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
  const defaultValues: ArticleFormData = {
    meta: {
      title: article.title,
      subHeading: article.sub_heading ?? "",
      description: article.excerpt ?? "",
      metaTitle: article.meta_title ?? "",
      metaDesc: article.meta_description ?? "",
      slug: decodeSlugForDisplay(article.slug) ?? "",
    },
    featuredImage: {
      imageUrl: article.thumbnail_url ?? "",
      linkUrl: "",
      alt: "",
      caption: "",
    },
    body: typeof articleContent === "string" ? articleContent : "",
    author: { name: "", role: "", imageUrl: "", bio: "" },
    tags: [],
    shareEnabled: true,
    status: statusToForm(article.status),
    blog_access_tier: tierFromApi(article.blog_access_tier),
    rel_download_url: article.rel_download_url ?? null,
    category_ids: article.category_ids ?? [],
    tag_ids: article.tag_ids ?? [],
    article_type_ids: article.article_type_ids ?? [],
    court_ids: article.court_ids ?? [],
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
