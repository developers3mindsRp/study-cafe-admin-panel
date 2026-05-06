import { useState, useEffect } from "react";
import { Modal } from "../ui/modal";
import Button from "../ui/button/Button";
import Input from "../form/input/InputField";
import type { DownloadCategory, CreateCategoryPayload } from "../../api/downloads";
import { slugifyForSeo, shouldResyncSlugFromSource } from "../../lib/slug";

interface CategoryFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (payload: CreateCategoryPayload) => Promise<void>;
  initial?: DownloadCategory | null;
}

interface FormState {
  name: string;
  slug: string;
}

interface FormErrors {
  name?: string;
}

export default function CategoryForm({ isOpen, onClose, onSave, initial }: CategoryFormProps) {
  const isEditing = !!initial;

  const [form, setForm] = useState<FormState>({ name: "", slug: "" });
  const [errors, setErrors] = useState<FormErrors>({});
  const [saving, setSaving] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setForm({
        name: initial?.name ?? "",
        slug: initial?.slug ?? "",
      });
      setErrors({});
      setApiError(null);
    }
  }, [isOpen, initial]);

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const name = e.target.value;
    setForm((prev) => {
      const keepSync = shouldResyncSlugFromSource(
        prev.slug,
        prev.name,
        (t) => slugifyForSeo(t),
      );
      return {
        ...prev,
        name,
        slug: keepSync ? slugifyForSeo(name) : prev.slug,
      };
    });
    if (errors.name) setErrors((prev) => ({ ...prev, name: undefined }));
  };

  const handleSlugChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm((prev) => ({ ...prev, slug: e.target.value }));
  };

  const handleSlugBlur = () => {
    setForm((prev) => ({ ...prev, slug: slugifyForSeo(prev.slug) }));
  };

  const validate = (): boolean => {
    const newErrors: FormErrors = {};
    if (!form.name.trim()) newErrors.name = "Name is required";
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
        name: form.name.trim(),
        slug: slugifyForSeo(form.slug).trim() || undefined,
      });
      onClose();
    } catch (err: unknown) {
      setApiError((err as any)?.response?.data?.message ?? "Failed to save category");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      className="max-w-md m-4"
      showCloseButton={!saving}
    >
      <div className="p-6 sm:p-8">
        <h3 className="mb-5 text-lg font-semibold text-gray-800 dark:text-white/90">
          {isEditing ? "Edit Category" : "Add Category"}
        </h3>

        <form onSubmit={handleSubmit} noValidate>
          <div className="space-y-4">
            {/* Name */}
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
                Name <span className="text-error-500">*</span>
              </label>
              <Input
                type="text"
                placeholder="e.g. Banking"
                value={form.name}
                onChange={handleNameChange}
                error={!!errors.name}
                hint={errors.name}
                disabled={saving}
              />
            </div>

            {/* Slug */}
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
                Slug{" "}
                <span className="text-xs font-normal text-gray-400">(auto-generated)</span>
              </label>
              <Input
                type="text"
                placeholder="e.g. banking"
                value={form.slug}
                onChange={handleSlugChange}
                onBlur={handleSlugBlur}
                disabled={saving}
              />
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
              {saving ? (isEditing ? "Saving…" : "Creating…") : isEditing ? "Save Changes" : "Create Category"}
            </Button>
          </div>
        </form>
      </div>
    </Modal>
  );
}
