import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import { toast } from "react-toastify";
import PageMeta from "../../components/common/PageMeta";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import ArticleForm, {
  type ArticleFormData,
  type ArticleFormSubmitMeta,
  type ArticleTaxonomyOptions,
} from "./ArticleForm";
import { articleFormToApiPayload } from "./articlePayload";
import { articlesApi, fetchArticleCategories, fetchTags, fetchArticleTypes, fetchCourts } from "../../api/articles";

function statusToBackend(s: ArticleFormData["status"]) {
  if (s === "Published") return "publish";
  if (s === "Archived") return "archived";
  if (s === "Scheduled") return "scheduled";
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

  const handleSubmit = async (formData: ArticleFormData, meta: ArticleFormSubmitMeta) => {
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
        category_ids: formData.category_ids ?? [],
        tag_ids: formData.tag_ids ?? [],
        article_type_ids: formData.article_type_ids ?? [],
        court_ids: formData.court_ids ?? [],
        blog_access_tier: formData.blog_access_tier,
      };
      await articlesApi.create(payload);
      toast.success("Article created successfully!");
      navigate("/articles");
    } catch (err: unknown) {
      console.error("Failed to create article", err);
      const axiosErr = err as { response?: { data?: { error?: string; message?: string } } };
      const msg =
        axiosErr?.response?.data?.error ||
        axiosErr?.response?.data?.message ||
        "Failed to create article";
      toast.error(msg);
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
