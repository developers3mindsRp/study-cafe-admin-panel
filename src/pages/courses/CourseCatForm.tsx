import { useState } from "react";
import { Link } from "react-router";
import Label from "../../components/form/Label";
import Input from "../../components/form/input/InputField";
import Button from "../../components/ui/button/Button";

export interface CourseCatFormData {
  name: string;
  slug: string;
  is_featured: boolean;
}

interface CourseCatFormProps {
  mode: "create" | "edit";
  defaultValues?: Partial<CourseCatFormData>;
  loading?: boolean;
  onSubmit: (data: CourseCatFormData) => void;
}

const empty: CourseCatFormData = { name: "", slug: "", is_featured: false };

function toSlug(name: string) {
  return name.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
}

export default function CourseCatForm({ mode, defaultValues, loading = false, onSubmit }: CourseCatFormProps) {
  const [form, setForm] = useState<CourseCatFormData>({ ...empty, ...defaultValues });
  const [slugTouched, setSlugTouched] = useState(!!defaultValues?.slug);

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const name = e.target.value;
    setForm((prev) => ({
      ...prev,
      name,
      slug: slugTouched ? prev.slug : toSlug(name),
    }));
  };

  const handleSlugChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSlugTouched(true);
    setForm((prev) => ({ ...prev, slug: e.target.value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(form);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] sm:p-6">
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <Label>Name <span className="text-error-500">*</span></Label>
            <Input
              value={form.name}
              onChange={handleNameChange}
              placeholder="e.g. GST Course"
              required
            />
          </div>
          <div>
            <Label>Slug</Label>
            <Input
              value={form.slug}
              onChange={handleSlugChange}
              placeholder="e.g. gst-course"
            />
            <p className="mt-1 text-xs text-gray-400">Auto-generated from name. Used in URL filters.</p>
          </div>
          <div className="col-span-2 flex items-center gap-3">
            <input
              id="is_featured"
              type="checkbox"
              checked={form.is_featured}
              onChange={(e) => setForm((prev) => ({ ...prev, is_featured: e.target.checked }))}
              className="h-4 w-4 rounded border-gray-300 text-brand-500 focus:ring-brand-500"
            />
            <label htmlFor="is_featured" className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Show in Home Page category tabs (Featured)
            </label>
          </div>
        </div>
      </div>

      <div className="flex gap-3">
        <button
          type="submit"
          disabled={loading}
          className="inline-flex items-center justify-center gap-2 rounded-lg px-4 py-3 text-sm font-medium text-white transition bg-brand-500 shadow-theme-xs hover:bg-brand-600 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? "Saving…" : mode === "create" ? "Create Category" : "Update Category"}
        </button>
        <Link to="/courses/categories">
          <Button variant="outline" size="sm" disabled={loading}>Cancel</Button>
        </Link>
      </div>
    </form>
  );
}
