import { useState, useEffect } from "react";
import { Link, useNavigate, useParams } from "react-router";
import PageMeta from "../../components/common/PageMeta";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import Badge from "../../components/ui/badge/Badge";
import { ConfirmDeleteModal } from "../../components/ui/modal/ConfirmDeleteModal";
import { useModal } from "../../hooks/useModal";
import ArticleContentRenderer from "../../components/article-editor/ArticleContentRenderer";
// import type { ContentBlock } from "../../components/blocks/types";
import { RequirePermission } from "../../components/auth/RequirePermission";
import { PERM_ARTICLES_EDIT, PERM_ARTICLES_DELETE } from "../../constants/permissions";
import { articlesApi, type ArticleRecord } from "../../api/articles";
import { decodeSlugForDisplay } from "../../lib/slug";

export default function ArticleView() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [article, setArticle] = useState<ArticleRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const { isOpen: isDeleteModalOpen, openModal: openDeleteModal, closeModal: closeDeleteModal } = useModal();

  useEffect(() => {
    if (id) {
      articlesApi
        .get(id)
        .then(setArticle)
        .catch(() => navigate("/articles"))
        .finally(() => setLoading(false));
    }
  }, [id, navigate]);

  const handleDeleteConfirm = async () => {
    if (!id) return;
    try {
      await articlesApi.delete(id);
      closeDeleteModal();
      navigate("/articles");
    } catch (err) {
      console.error("Failed to delete article", err);
      alert("Failed to delete article");
    }
  };

  const statusColor = (status: string) =>
    status === "publish" || status === "published"
      ? "success"
      : status === "draft"
        ? "warning"
        : "error";

  const rawContent = article?.content ?? (article as unknown as Record<string, unknown>)?.content ?? (article as unknown as Record<string, unknown>)?.body;
  const content = typeof rawContent === "string" ? rawContent : "";
  const hasBody = Boolean(content?.trim());

  if (loading) return <div className="p-6 text-center">Loading…</div>;
  if (!article) return null;

  return (
    <>
      <PageMeta
        title={`${article.title} | StudyCafe Admin`}
        description={article.meta_description ?? "View article for studycafe.in"}
      />
      <PageBreadcrumb
        pageTitle={article.title}
        items={[
          { label: "Articles", path: "/articles" },
        ]}
        actions={
          <div className="flex items-center gap-2">
            <RequirePermission permissions={[PERM_ARTICLES_EDIT]} fallback={null}>
              <Link
                to={`/articles/${id}/edit`}
                className="inline-flex items-center justify-center gap-2 rounded-lg px-4 py-3 text-sm font-medium text-white transition bg-brand-500 shadow-theme-xs hover:bg-brand-600"
              >
                Edit
              </Link>
            </RequirePermission>
            <RequirePermission permissions={[PERM_ARTICLES_DELETE]} fallback={null}>
              <button
                type="button"
                onClick={openDeleteModal}
                className="inline-flex items-center justify-center gap-2 rounded-lg px-4 py-3 text-sm font-medium text-white transition bg-error-500 shadow-theme-xs hover:bg-error-600"
              >
                Delete
              </button>
            </RequirePermission>
          </div>
        }
      />

      <div className="space-y-6">
        <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] sm:p-6">
          <div className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">
                Article Details
              </h3>
              <div className="flex flex-wrap items-center gap-2">
                <Badge size="sm" color={statusColor(article.status)}>
                  {article.status}
                </Badge>
                {article.blog_access_tier === "premium" ? (
                  <Badge size="sm" color="warning">
                    Premium blog
                  </Badge>
                ) : (
                  <Badge size="sm" color="light">
                    Free blog
                  </Badge>
                )}
              </div>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Title</p>
              <p className="text-gray-800 dark:text-white/90">{article.title}</p>
              <p className="text-sm text-gray-500 dark:text-gray-400">/{decodeSlugForDisplay(article.slug) || article.id}</p>
            </div>
            {article.excerpt && (
              <div>
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Excerpt</p>
                <p className="text-gray-800 dark:text-white/90">{article.excerpt}</p>
              </div>
            )}
            {article.author_id != null && (
              <div>
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Author</p>
                <p className="text-gray-800 dark:text-white/90">{article.author_name}</p>
              </div>
            )}
            {article.meta_description && (
              <div>
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Meta description</p>
                <p className="text-gray-800 dark:text-white/90">{article.meta_description}</p>
              </div>
            )}
            {(article.tags?.length ?? article.tag_ids?.length ?? 0) > 0 && (
              <div>
                <p className="mb-2 text-sm font-medium text-gray-500 dark:text-gray-400">Tags</p>
                <div className="flex flex-wrap gap-2">
                  {(article.tags?.length
                    ? article.tags.map((t) => (
                        <span key={t.id} className="rounded-full bg-gray-100 px-2.5 py-1 text-sm dark:bg-gray-800">
                          {t.name || t.id}
                        </span>
                      ))
                    : article.tag_ids!.map((tid) => (
                        <span key={tid} className="rounded-full bg-gray-100 px-2.5 py-1 text-sm dark:bg-gray-800">
                          {tid}
                        </span>
                      ))
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
        {article.thumbnail_url && (
          <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] sm:p-6">
            <h3 className="mb-4 text-lg font-semibold text-gray-800 dark:text-white/90">
              Featured Image
            </h3>

            <img
              src={article.thumbnail_url}
              alt="Featured"
              className="max-w-full rounded-lg"
              referrerPolicy="no-referrer"
              loading="lazy"
            />
          </div>
        )}
        {(article as any).citation && Object.keys((article as any).citation).length > 0 && (
          <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] sm:p-6">
            <h3 className="mb-4 text-lg font-semibold text-gray-800 dark:text-white/90">
              Case Citation
            </h3>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {Object.entries((article as any).citation).map(([key, value]) => {
                if (!value) return null;
                const label = key.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
                return (
                  <div key={key}>
                    <p className="text-sm font-medium text-gray-500 dark:text-gray-400">{label}</p>
                    <p className="text-gray-800 break-words dark:text-white/90">{String(value)}</p>
                  </div>
                );
              })}
            </div>
          </div>
        )}
        {hasBody && (
          <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] sm:p-6">
            <h3 className="mb-4 text-lg font-semibold text-gray-800 dark:text-white/90">Content</h3>
            <ArticleContentRenderer
              content={content}
              relatedArticles={article.related_articles}
              showTableOfContents={true}
            />
          </div>
        )}
      </div>

      <ConfirmDeleteModal
        isOpen={isDeleteModalOpen}
        onClose={closeDeleteModal}
        onConfirm={handleDeleteConfirm}
        title="Delete Article"
        itemName={article.title}
      />
    </>
  );
}

// function BlockView({ block }: { block: ContentBlock }) {
//   const { type, data } = block;

//   if (type === "rich_text" && "html" in data) {
//     return (
//       <div
//         className="prose prose-sm dark:prose-invert max-w-none text-gray-800 dark:text-white/90"
//         dangerouslySetInnerHTML={{ __html: (data as { html: string }).html }}
//       />
//     );
//   }
//   if (type === "heading" && "level" in data && "text" in data) {
//     const { level, text } = data as { level: 1 | 2 | 3; text: string };
//     const className = "font-semibold text-gray-800 dark:text-white/90";
//     if (level === 1) return <h1 className={className}>{text}</h1>;
//     if (level === 2) return <h2 className={className}>{text}</h2>;
//     return <h3 className={className}>{text}</h3>;
//   }
//   if (type === "ad_slot") {
//     return (
//       <div className="rounded-lg border border-dashed border-gray-300 p-4 text-center text-sm text-gray-500 dark:border-gray-700 dark:text-gray-400">
//         [Ad slot: {(data as { adUnitId: string }).adUnitId || "Configured"}]
//       </div>
//     );
//   }
//   if (type === "cta") {
//     const d = data as { title?: string; buttonText?: string; buttonUrl?: string };
//     return (
//       <div className="rounded-lg border border-gray-200 bg-gray-50 p-4 dark:border-gray-800 dark:bg-gray-900">
//         {d.title && <p className="font-medium text-gray-800 dark:text-white/90">{d.title}</p>}
//         <a
//           href={d.buttonUrl}
//           className="mt-2 inline-block rounded-lg bg-brand-500 px-4 py-2 text-sm text-white hover:bg-brand-600"
//         >
//           {d.buttonText ?? "Learn more"}
//         </a>
//       </div>
//     );
//   }
//   if (type === "image_with_link" && "imageUrl" in data) {
//     const d = data as { imageUrl: string; linkUrl?: string; alt?: string; caption?: string };
//     const img = <img src={d.imageUrl} alt={d.alt ?? ""} className="max-w-full rounded-lg" />;
//     return (
//       <figure>
//         {d.linkUrl ? <a href={d.linkUrl}>{img}</a> : img}
//         {d.caption && (
//           <figcaption className="mt-2 text-sm text-gray-500 dark:text-gray-400">
//             {d.caption}
//           </figcaption>
//         )}
//       </figure>
//     );
//   }
//   if (type === "download_button" && "label" in data && "fileUrl" in data) {
//     const d = data as { label: string; fileUrl: string };
//     return (
//       <a
//         href={d.fileUrl}
//         download
//         className="inline-flex items-center gap-2 rounded-lg bg-brand-500 px-4 py-2 text-sm text-white hover:bg-brand-600"
//       >
//         <svg className="size-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//           <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
//         </svg>
//         {d.label}
//       </a>
//     );
//   }
//   if (type === "also_read") {
//     return (
//       <div className="rounded-lg border border-gray-200 p-4 dark:border-gray-800">
//         <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
//           Also read: {(data as { articleIds: number[] }).articleIds.length} article(s) recommended
//         </p>
//       </div>
//     );
//   }
//   if (type === "membership_cta" && "heading" in data) {
//     const d = data as { heading: string; buttonText: string; buttonUrl: string };
//     return (
//       <div className="rounded-lg border-2 border-brand-200 bg-brand-50 p-4 dark:border-brand-800 dark:bg-brand-500/10">
//         <p className="font-medium text-gray-800 dark:text-white/90">{d.heading}</p>
//         <a
//           href={d.buttonUrl}
//           className="mt-2 inline-block rounded-lg bg-brand-500 px-4 py-2 text-sm text-white hover:bg-brand-600"
//         >
//           {d.buttonText}
//         </a>
//       </div>
//     );
//   }

//   return null;
// }
