import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import PageMeta from "../../components/common/PageMeta";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import ArticleForm, { type ArticleFormData, type ArticleTaxonomyOptions } from "./ArticleForm";
import { articlesApi, fetchArticleCategories, fetchTags, fetchArticleTypes, fetchCourts } from "../../api/articles";

function statusToBackend(s: ArticleFormData["status"]) {
  if (s === "Published") return "publish";
  if (s === "Archived") return "archived";
  return "draft";
}

export default function ArticleCreate() {
  const navigate = useNavigate();
  const [submitting, setSubmitting] = useState(false);
  const [taxonomyOptions, setTaxonomyOptions] = useState<ArticleTaxonomyOptions>({
    categories: [],
    tags: [],
    articleTypes: [],
    courts: [],
  });

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
        citation: formData.citation || null,
      };
      await articlesApi.create(payload);
      navigate("/articles");
    } catch (err) {
      console.error("Failed to create article", err);
      alert("Failed to create article");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <PageMeta
        title="Create Article | StudyCafe Admin"
        description="Add new article for studycafe.in"
      />
      <PageBreadcrumb
        pageTitle="Create"
        items={[{ label: "Articles", path: "/articles" }]}
      />
      <ArticleForm mode="create" onSubmit={handleSubmit} loading={submitting} taxonomyOptions={taxonomyOptions} />
    </>
  );
}
