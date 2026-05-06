import { Link, useLocation, useNavigate } from "react-router";
import PageMeta from "../../components/common/PageMeta";
import ArticleContentRenderer from "../../components/article-editor/ArticleContentRenderer";
import type { ArticleFormData, ArticleTaxonomyOptions } from "./ArticleForm";
import { parseCommaSeparatedLabels } from "./articlePayload";

const PREVIEW_STATE_KEY = "previewArticle";
const RESTORE_STATE_KEY = "restoreFormData";

function resolveNames(
  ids: number[] | undefined,
  options: { id: number; name: string; slug: string | null }[]
): string[] {
  if (!ids?.length || !options?.length) return [];
  const byId = new Map(options.map((o) => [o.id, o.name]));
  return ids.map((id) => byId.get(id) ?? String(id)).filter(Boolean);
}

export default function ArticlePreview() {
  const location = useLocation();
  const navigate = useNavigate();
  const previewData = location.state?.[PREVIEW_STATE_KEY] as
    | ArticleFormData
    | undefined;
  const taxonomyOptions = location.state?.taxonomyOptions as ArticleTaxonomyOptions | undefined;
  const returnPath = (location.state?.returnPath as string) || "/articles/create";

  const handleBack = () => {
    if (previewData) {
      // Navigate back with form data to restore it
      navigate(returnPath, {
        state: { [RESTORE_STATE_KEY]: previewData },
        replace: true
      });
    } else {
      navigate("/articles");
    }
  };

  if (!previewData) {
    return (
      <>
        <PageMeta title="Preview | StudyCafe Admin" description="Article preview" />
        <div className="flex min-h-screen flex-col items-center justify-center bg-gray-900 p-8">
          <div className="rounded-2xl bg-gray-800 p-8 text-center">
            <p className="text-gray-400">
              No preview data. Create or edit an article and click Preview.
            </p>
            <Link
              to="/articles"
              className="mt-4 inline-block text-blue-400 hover:underline"
            >
              Back to Articles
            </Link>
          </div>
        </div>
      </>
    );
  }

  const { meta, featuredImage, body, author, tagsCommaRaw, category_ids, tag_ids, article_type_ids, court_ids } =
    previewData;
  const previewLegacy = previewData as ArticleFormData & { tags?: string[] };
  const commaRaw =
    typeof tagsCommaRaw === "string"
      ? tagsCommaRaw
      : Array.isArray(previewLegacy.tags) && previewLegacy.tags.length > 0
        ? previewLegacy.tags.join(", ")
        : "";
  const commaTagLabels = parseCommaSeparatedLabels(commaRaw);
  const hasBody = Boolean(body?.trim());
  const currentDate = new Date().toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
  const opts = taxonomyOptions ?? { categories: [], tags: [], articleTypes: [], courts: [] };
  const categoryNames = resolveNames(category_ids, opts.categories);
  const tagNames = resolveNames(tag_ids, opts.tags);
  const articleTypeNames = resolveNames(article_type_ids, opts.articleTypes);
  const courtNames = resolveNames(court_ids, opts.courts);
  const hasTaxonomies =
    categoryNames.length > 0 ||
    tagNames.length > 0 ||
    articleTypeNames.length > 0 ||
    courtNames.length > 0 ||
    commaTagLabels.length > 0;

  return (
    <>
      <PageMeta
        title={`Preview: ${meta.title || "Untitled"} | StudyCafe Admin`}
        description={meta.metaDesc ?? "Article preview"}
      />

      {/* Dark themed article preview - matches real site */}
      <div className="min-h-screen ">
        {/* Fixed preview banner */}
        <div className="sticky top-0 z-50 border-b border-gray-700  backdrop-blur">
          <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3">
            <div className="flex items-center gap-3">
              <span className="rounded-full bg-amber-500/20 px-3 py-1 text-xs font-medium text-amber-600">
                Preview Mode
              </span>
              <span className="text-sm ">Changes not saved</span>
            </div>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={handleBack}
                className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-700"
              >
                Back to Editor
              </button>
              <Link
                to="/articles"
                className="rounded-lg bg-gray-700 px-4 py-2 text-sm font-medium text-white transition hover:bg-gray-600"
              >
                All Articles
              </Link>
            </div>
          </div>
        </div>
        {/* Main content */}
        <main className="mx-auto max-w-7xl px-4 py-8">
          <div className="flex flex-col gap-8 lg:flex-row">
            {/* Article content */}
            <article className="flex-1 lg:max-w-3xl">
              {/* Title */}
              <h1 className="mb-2 text-2xl font-bold leading-tight md:text-3xl lg:text-4xl">
                {meta.title || "Untitled Article"}
              </h1>

              {/* Sub heading */}
              {(meta.subHeading ?? "").trim() && (
                <p className="mb-2 text-xl text-gray-600 dark:text-gray-400">
                  {meta.subHeading}
                </p>
              )}

              {/* Description / excerpt */}
              {(meta.description ?? meta.metaDesc ?? "").trim() && (
                <p className="mb-2 text-lg text-gray-600 dark:text-gray-400">
                  {meta.description || meta.metaDesc}
                </p>
              )}

              {/* Author & Date */}
              <div className="mb-6 flex items-center gap-3 text-sm text-gray-500">
                {author.imageUrl && (
                  <img
                    src={author.imageUrl}
                    alt={author.name}
                    className="h-8 w-8 rounded-full object-cover"
                    referrerPolicy="no-referrer"
                    loading="lazy"
                  />
                )}
                {author.name && (
                  <span className="text-blue-400">{author.name}</span>
                )}
                <span>•</span>
                <span>{currentDate}</span>
              </div>

              {/* Featured Image */}
              {featuredImage.imageUrl && (
                <figure className="mb-8">
                  <img
                    src={featuredImage.imageUrl}
                    alt={featuredImage.alt ?? meta.title}
                    className="w-full rounded-xl object-cover"
                    referrerPolicy="no-referrer"
                    loading="lazy"
                  />
                  {featuredImage.caption && (
                    <figcaption className="mt-2 text-center text-sm text-gray-500">
                      {featuredImage.caption}
                    </figcaption>
                  )}
                </figure>
              )}

              {/* Article Body */}
              {hasBody ? (
                <ArticleContentRenderer content={body} />
              ) : (
                <div className="rounded-xl border-2 border-dashed border-gray-700  py-16 text-center">
                  <p className="text-gray-500">
                    No content yet. Add content in the editor and preview again.
                  </p>
                </div>
              )}

              {/* Categories, Tags, Article types, Courts (from IDs) */}
              {hasTaxonomies && (
                <div className="mt-8 space-y-4 border-t border-gray-800 pt-6 flex flex-wrap gap-2">
                  {categoryNames.length > 0 && (
                    <div>
                      <p className="mb-2 text-sm font-medium text-gray-500">Categories</p>
                      <div className="flex flex-wrap gap-2">
                        {categoryNames.map((name, i) => (
                          <span key={`cat-${i}-${name}`} className="rounded-full border border-gray-700  px-3 py-1 text-sm text-black">
                            {name}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                  {(tagNames.length > 0 || commaTagLabels.length > 0) && (
                    <div>
                      <p className="mb-2 text-sm font-medium text-gray-500">Tags</p>
                      <div className="flex flex-wrap gap-2">
                        {tagNames.map((name, i) => (
                          <span key={`tag-${i}-${name}`} className="rounded-full border border-gray-700  px-3 py-1 text-sm text-black">
                            {name}
                          </span>
                        ))}
                        {commaTagLabels.map((tag, i) => (
                          <span key={`t-${i}-${tag}`} className="rounded-full border border-gray-700  px-3 py-1 text-sm text-black">
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                  {articleTypeNames.length > 0 && (
                    <div>
                      <p className="mb-2 text-sm font-medium text-gray-500">Article types</p>
                      <div className="flex flex-wrap gap-2">
                        {articleTypeNames.map((name, i) => (
                          <span key={`type-${i}-${name}`} className="rounded-full border border-gray-700  px-3 py-1 text-sm text-black">
                            {name}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                  {courtNames.length > 0 && (
                    <div>
                      <p className="mb-2 text-sm font-medium text-gray-500">Courts</p>
                      <div className="flex flex-wrap gap-2">
                        {courtNames.map((name, i) => (
                          <span key={`court-${i}-${name}`} className="rounded-full border border-gray-700  px-3 py-1 text-sm text-black">
                            {name}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

            </article>

            {/* Sidebar */}
            <aside className="w-full lg:w-80">
              {/* Latest Posts mockup */}
              <div className="rounded-xl border border-gray-800 p-4">
                <h3 className="mb-4 text-lg font-semibold">Latest Post</h3>
                <div className="space-y-4">
                  {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="flex gap-3">
                      <div className="h-16 w-20 shrink-0 rounded-lg bg-gray-300" />
                      <div>
                        <p className="text-sm font-medium text-gray-600 line-clamp-2">
                          Trending Article Title #{i}
                        </p>
                        <p className="mt-1 text-xs text-gray-500">Jan {i}, 2026</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Ad placeholder */}
              <div className="mt-6 flex h-64 items-center justify-center rounded-xl border-2 border-dashed border-gray-700 bg-gray-800/30">
                <span className="text-sm text-gray-600">Sidebar Ad</span>
              </div>
            </aside>
          </div>
        </main>
      </div>
    </>
  );
}

export { PREVIEW_STATE_KEY, RESTORE_STATE_KEY };
