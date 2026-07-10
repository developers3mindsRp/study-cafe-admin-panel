import { useState } from "react";
import { Link } from "react-router";
import Label from "../../components/form/Label";
import Input from "../../components/form/input/InputField";
import Button from "../../components/ui/button/Button";

export interface ProductFormData {
  title: string;
  redirect_url: string;
  sort_order: string;
  is_active: boolean;
}

interface ProductFormProps {
  mode: "create" | "edit";
  defaultValues?: Partial<ProductFormData>;
  loading?: boolean;
  onSubmit: (data: ProductFormData) => void;
}

const emptyFormData: ProductFormData = {
  title: "",
  redirect_url: "",
  sort_order: "0",
  is_active: true,
};

export default function ProductForm({
  mode,
  defaultValues,
  loading = false,
  onSubmit,
}: ProductFormProps) {
  const [formData, setFormData] = useState<ProductFormData>({
    ...emptyFormData,
    ...defaultValues,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  const submitLabel = mode === "create" ? "Create Product" : "Update Product";
  const canSubmit = formData.title.trim() !== "" && formData.redirect_url.trim() !== "";

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] sm:p-6">
        <div className="space-y-4">
          <div>
            <Label>Title <span className="text-error-500">*</span></Label>
            <Input
              value={formData.title}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, title: e.target.value }))
              }
              placeholder="e.g. CA Foundation Course"
            />
          </div>

          <div>
            <Label>Redirect URL <span className="text-error-500">*</span></Label>
            <p className="mb-2 text-xs text-gray-500">
              Where visitors are taken when they click this product.
            </p>
            <Input
              value={formData.redirect_url}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, redirect_url: e.target.value }))
              }
              placeholder="https://example.com/page"
            />
          </div>

          <div>
            <Label>Sort Order</Label>
            <Input
              type="number"
              value={formData.sort_order || ""}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, sort_order: e.target.value }))
              }
              placeholder="0"
            />
          </div>

          <div>
            <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
              <input
                type="checkbox"
                checked={formData.is_active}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, is_active: e.target.checked }))
                }
                className="size-4 rounded border-gray-300 text-brand-500 focus:ring-brand-500"
              />
              Active (visible on the website)
            </label>
          </div>
        </div>
      </div>

      <div className="flex gap-3">
        <button
          type="submit"
          disabled={loading || !canSubmit}
          className="inline-flex items-center justify-center gap-2 rounded-lg px-4 py-3 text-sm font-medium text-white transition bg-brand-500 shadow-theme-xs hover:bg-brand-600 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? "Saving..." : submitLabel}
        </button>
        <Link to="/products">
          <Button variant="outline" size="sm" disabled={loading}>
            Cancel
          </Button>
        </Link>
      </div>
    </form>
  );
}
