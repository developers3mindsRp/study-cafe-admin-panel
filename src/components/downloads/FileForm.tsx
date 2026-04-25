import { useState, useEffect, useRef } from "react";
import { Modal } from "../ui/modal";
import Button from "../ui/button/Button";
import Input from "../form/input/InputField";
import type { DownloadFile, DownloadCategory, CreateFilePayload } from "../../api/downloads";

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^\w-]+/g, "")
    .replace(/--+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function isValidUrl(value: string): boolean {
  try {
    new URL(value);
    return true;
  } catch {
    return false;
  }
}

interface FileFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (payload: CreateFilePayload) => Promise<void>;
  initial?: DownloadFile | null;
  categories: DownloadCategory[];
}

interface FormState {
  title: string;
  slug: string;
  file_url: string;
  category_ids: number[];
  status: "publish" | "draft" | "private";
  meta_title: string;
  meta_description: string;
  meta_keywords: string;
}

interface FormErrors {
  title?: string;
  file_url?: string;
}

export default function FileForm({ isOpen, onClose, onSave, initial, categories }: FileFormProps) {
  const isEditing = !!initial;
  const titleChangedByUser = useRef(false);

  const [form, setForm] = useState<FormState>({
    title: "",
    slug: "",
    file_url: "",
    category_ids: [],
    status: "publish",
    meta_title: "",
    meta_description: "",
    meta_keywords: "",
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [saving, setSaving] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const [catDropdownOpen, setCatDropdownOpen] = useState(false);
  const catDropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      titleChangedByUser.current = false;
      setForm({
        title: initial?.title ?? "",
        slug: initial?.slug ?? "",
        file_url: initial?.file_url ?? "",
        category_ids: initial?.FileCats?.map((c) => c.id) ?? [],
        status: initial?.status ?? "publish",
        meta_title: initial?.meta_title ?? "",
        meta_description: initial?.meta_description ?? "",
        meta_keywords: initial?.meta_keywords ?? "",
      });
      setErrors({});
      setApiError(null);
      setCatDropdownOpen(false);
    }
  }, [isOpen, initial]);

  // Close category dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (catDropdownRef.current && !catDropdownRef.current.contains(e.target as Node)) {
        setCatDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const title = e.target.value;
    titleChangedByUser.current = true;
    setForm((prev) => ({
      ...prev,
      title,
      slug: !isEditing ? slugify(title) : prev.slug,
    }));
    if (errors.title) setErrors((prev) => ({ ...prev, title: undefined }));
  };

  const handleFieldChange =
    <K extends keyof FormState>(key: K) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
      setForm((prev) => ({ ...prev, [key]: e.target.value }));
      if (key === "file_url" && errors.file_url) {
        setErrors((prev) => ({ ...prev, file_url: undefined }));
      }
    };

  const toggleCategory = (id: number) => {
    setForm((prev) => ({
      ...prev,
      category_ids: prev.category_ids.includes(id)
        ? prev.category_ids.filter((c) => c !== id)
        : [...prev.category_ids, id],
    }));
  };

  const validate = (): boolean => {
    const newErrors: FormErrors = {};
    if (!form.title.trim()) newErrors.title = "Title is required";
    if (!form.file_url.trim()) {
      newErrors.file_url = "File URL is required";
    } else if (!isValidUrl(form.file_url.trim())) {
      newErrors.file_url = "Must be a valid URL (e.g. https://...)";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setSaving(true);
    setApiError(null);
    try {
      await onSave({
        title: form.title.trim(),
        slug: form.slug.trim() || undefined,
        file_url: form.file_url.trim(),
        category_ids: form.category_ids,
        status: form.status,
        meta_title: form.meta_title.trim() || undefined,
        meta_description: form.meta_description.trim() || undefined,
        meta_keywords: form.meta_keywords.trim() || undefined,
      });
      onClose();
    } catch (err: unknown) {
      setApiError((err as any)?.response?.data?.message ?? "Failed to save file");
    } finally {
      setSaving(false);
    }
  };

  const selectedCatNames = categories
    .filter((c) => form.category_ids.includes(c.id))
    .map((c) => c.name);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      className="max-w-2xl m-4 max-h-[90vh] overflow-y-auto"
      showCloseButton={!saving}
    >
      <div className="p-6 sm:p-8">
        <h3 className="mb-5 text-lg font-semibold text-gray-800 dark:text-white/90">
          {isEditing ? "Edit File" : "Add File"}
        </h3>

        <form onSubmit={handleSubmit} noValidate>
          <div className="space-y-4">
            {/* Title */}
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
                Title <span className="text-error-500">*</span>
              </label>
              <Input
                type="text"
                placeholder="e.g. RRB NTPC Notes PDF 2024"
                value={form.title}
                onChange={handleTitleChange}
                error={!!errors.title}
                hint={errors.title}
                disabled={saving}
              />
            </div>

            {/* Slug */}
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
                Slug{" "}
                <span className="text-xs font-normal text-gray-400">(auto-generated from title)</span>
              </label>
              <Input
                type="text"
                placeholder="e.g. rrb-ntpc-notes-pdf-2024"
                value={form.slug}
                onChange={handleFieldChange("slug")}
                disabled={saving}
              />
            </div>

            {/* File URL */}
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
                File URL <span className="text-error-500">*</span>
              </label>
              <Input
                type="url"
                placeholder="https://studycafe.in/wp-content/uploads/..."
                value={form.file_url}
                onChange={handleFieldChange("file_url")}
                error={!!errors.file_url}
                hint={errors.file_url}
                disabled={saving}
              />
            </div>

            {/* Categories multi-select */}
            <div ref={catDropdownRef} className="relative">
              <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
                Categories
              </label>
              <button
                type="button"
                onClick={() => setCatDropdownOpen((o) => !o)}
                disabled={saving}
                className="flex min-h-11 w-full items-center justify-between rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm text-gray-800 shadow-theme-xs hover:border-brand-300 focus:border-brand-300 focus:outline-none focus:ring-3 focus:ring-brand-500/20 dark:border-gray-700 dark:text-white/90 disabled:cursor-not-allowed disabled:opacity-40"
              >
                <span className="truncate">
                  {selectedCatNames.length > 0
                    ? selectedCatNames.join(", ")
                    : <span className="text-gray-400">Select categories…</span>}
                </span>
                <svg
                  className={`ml-2 h-4 w-4 shrink-0 text-gray-400 transition-transform ${catDropdownOpen ? "rotate-180" : ""}`}
                  viewBox="0 0 20 20" fill="currentColor"
                >
                  <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </button>

              {catDropdownOpen && (
                <div className="absolute z-50 mt-1 max-h-52 w-full overflow-y-auto rounded-lg border border-gray-200 bg-white py-1 shadow-lg dark:border-gray-700 dark:bg-gray-900">
                  {categories.length === 0 ? (
                    <p className="px-4 py-2 text-sm text-gray-400">No categories found</p>
                  ) : (
                    categories.map((cat) => {
                      const selected = form.category_ids.includes(cat.id);
                      return (
                        <label
                          key={cat.id}
                          className="flex cursor-pointer items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-gray-800"
                        >
                          <input
                            type="checkbox"
                            checked={selected}
                            onChange={() => toggleCategory(cat.id)}
                            className="h-4 w-4 rounded border-gray-300 text-brand-500 focus:ring-brand-500"
                          />
                          {cat.name}
                        </label>
                      );
                    })
                  )}
                </div>
              )}
            </div>

            {/* Status */}
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
                Status
              </label>
              <select
                value={form.status}
                onChange={handleFieldChange("status")}
                disabled={saving}
                className="h-11 w-full rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm text-gray-800 shadow-theme-xs focus:border-brand-300 focus:outline-none focus:ring-3 focus:ring-brand-500/20 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 disabled:cursor-not-allowed disabled:opacity-40"
              >
                <option value="publish">Publish</option>
                <option value="draft">Draft</option>
                <option value="private">Private</option>
              </select>
            </div>

            {/* Meta section */}
            <div className="rounded-xl border border-gray-200 p-4 dark:border-gray-700">
              <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-gray-400">
                SEO / Meta
              </p>
              <div className="space-y-3">
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Meta Title
                  </label>
                  <Input
                    type="text"
                    placeholder="Page title for search engines"
                    value={form.meta_title}
                    onChange={handleFieldChange("meta_title")}
                    disabled={saving}
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Meta Description
                  </label>
                  <textarea
                    rows={3}
                    placeholder="Short description for search engines"
                    value={form.meta_description}
                    onChange={handleFieldChange("meta_description")}
                    disabled={saving}
                    className="w-full rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm text-gray-800 shadow-theme-xs placeholder:text-gray-400 focus:border-brand-300 focus:outline-none focus:ring-3 focus:ring-brand-500/20 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30 disabled:cursor-not-allowed disabled:opacity-40"
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Meta Keywords
                  </label>
                  <Input
                    type="text"
                    placeholder="keyword1, keyword2, keyword3"
                    value={form.meta_keywords}
                    onChange={handleFieldChange("meta_keywords")}
                    disabled={saving}
                  />
                </div>
              </div>
            </div>
          </div>

          {apiError && (
            <p className="mt-4 text-sm text-error-500">{apiError}</p>
          )}

          <div className="mt-6 flex items-center justify-end gap-3">
            <Button variant="outline" size="sm" type="button" onClick={onClose} disabled={saving}>
              Cancel
            </Button>
            <Button size="sm" type="submit" disabled={saving}>
              {saving ? (isEditing ? "Saving…" : "Creating…") : isEditing ? "Save Changes" : "Add File"}
            </Button>
          </div>
        </form>
      </div>
    </Modal>
  );
}
