import Label from "../../../components/form/Label";
import Input from "../../../components/form/input/InputField";
import ArticleEditor from "../../../components/article-editor/ArticleEditor";
import type { ArticleSection } from "../ArticleForm";

interface ArticleSectionsEditorProps {
  value: ArticleSection[];
  onChange: (sections: ArticleSection[]) => void;
}

/**
 * Repeatable sections editor for an article: each section has a Title + a rich text editor
 * (the same ArticleEditor used for the article body, so `[related id="..."]` shortcodes work).
 * Sections drive the public Table of Contents and the composed article body on the backend.
 */
export default function ArticleSectionsEditor({
  value,
  onChange,
}: ArticleSectionsEditorProps) {
  const sections = value ?? [];

  const updateSection = (index: number, patch: Partial<ArticleSection>) => {
    onChange(sections.map((s, i) => (i === index ? { ...s, ...patch } : s)));
  };

  const addSection = () => {
    onChange([...sections, { title: "", content: "" }]);
  };

  const removeSection = (index: number) => {
    onChange(sections.filter((_, i) => i !== index));
  };

  const moveSection = (index: number, dir: -1 | 1) => {
    const target = index + dir;
    if (target < 0 || target >= sections.length) return;
    const next = [...sections];
    [next[index], next[target]] = [next[target], next[index]];
    onChange(next);
  };

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] sm:p-6">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">
          Sections
        </h3>
        <button
          type="button"
          onClick={addSection}
          className="inline-flex items-center justify-center gap-1 rounded-lg bg-brand-500 px-3 py-2 text-sm font-medium text-white shadow-theme-xs transition hover:bg-brand-600"
        >
          + Add section
        </button>
      </div>
      <p className="mb-4 text-xs text-gray-500 dark:text-gray-400">
        Each section title appears in the article's Table of Contents and as a heading in the
        published article. Section content supports the same editor and{" "}
        <code>[related id="123"]</code> links as the main content.
      </p>

      {sections.length === 0 ? (
        <p className="rounded-lg border border-dashed border-gray-300 px-4 py-6 text-center text-sm text-gray-500 dark:border-gray-700 dark:text-gray-400">
          No sections yet. Click "Add section" to build the Table of Contents.
        </p>
      ) : (
        <div className="space-y-5">
          {sections.map((section, index) => (
            <div
              key={index}
              className="rounded-xl border border-gray-200 p-4 dark:border-gray-800"
            >
              <div className="mb-3 flex items-center justify-between gap-2">
                <span className="text-xs font-medium text-gray-500 dark:text-gray-400">
                  Section {index + 1}
                </span>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => moveSection(index, -1)}
                    disabled={index === 0}
                    title="Move up"
                    className="rounded p-1.5 text-gray-600 transition hover:bg-gray-200 disabled:opacity-30 dark:text-gray-400 dark:hover:bg-white/10"
                  >
                    <svg className="size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                    </svg>
                  </button>
                  <button
                    type="button"
                    onClick={() => moveSection(index, 1)}
                    disabled={index === sections.length - 1}
                    title="Move down"
                    className="rounded p-1.5 text-gray-600 transition hover:bg-gray-200 disabled:opacity-30 dark:text-gray-400 dark:hover:bg-white/10"
                  >
                    <svg className="size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                  <button
                    type="button"
                    onClick={() => removeSection(index)}
                    title="Delete section"
                    className="rounded p-1.5 text-error-500 transition hover:bg-error-50 dark:hover:bg-error-500/10"
                  >
                    <svg className="size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              </div>
              <div className="space-y-3">
                <div>
                  <Label>Title</Label>
                  <Input
                    value={section.title}
                    onChange={(e) => updateSection(index, { title: e.target.value })}
                    placeholder="Section title (shown in Table of Contents)"
                  />
                </div>
                <div>
                  <Label>Content</Label>
                  <ArticleEditor
                    value={section.content}
                    onChange={(content) => updateSection(index, { content })}
                    placeholder="Write this section… Paste from Word, Google Docs, or any editor."
                    minHeight="240px"
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
