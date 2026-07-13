import { useState } from "react";
import { Link } from "react-router";
import Label from "../../components/form/Label";
import Input from "../../components/form/input/InputField";
import Button from "../../components/ui/button/Button";

export interface ProfessionFormData {
  title: string;
  status: "active" | "inactive";
}

interface ProfessionFormProps {
  mode: "create" | "edit";
  defaultValues?: Partial<ProfessionFormData>;
  loading?: boolean;
  onSubmit: (data: ProfessionFormData) => void;
}

const emptyFormData: ProfessionFormData = {
  title: "",
  status: "active",
};

export default function ProfessionForm({
  mode,
  defaultValues,
  loading = false,
  onSubmit,
}: ProfessionFormProps) {
  const [formData, setFormData] = useState<ProfessionFormData>({
    ...emptyFormData,
    ...defaultValues,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  const submitLabel = mode === "create" ? "Create Profession" : "Update Profession";

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] sm:p-6">
        <div className="space-y-4">
          <div>
            <Label>
              Title <span className="text-error-500">*</span>
            </Label>
            <Input
              value={formData.title}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, title: e.target.value }))
              }
              placeholder="e.g. Chartered Accountant"
              required
            />
          </div>
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="profession-active"
              checked={formData.status === "active"}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  status: e.target.checked ? "active" : "inactive",
                }))
              }
              className="h-4 w-4 rounded border-gray-300 text-brand-500 focus:ring-brand-500"
            />
            <Label htmlFor="profession-active" className="!mb-0 cursor-pointer">
              Active (shown in the profession dropdown)
            </Label>
          </div>
        </div>
      </div>

      <div className="flex gap-3">
        <button
          type="submit"
          disabled={loading}
          className="inline-flex items-center justify-center gap-2 rounded-lg px-4 py-3 text-sm font-medium text-white transition bg-brand-500 shadow-theme-xs hover:bg-brand-600 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? "Saving..." : submitLabel}
        </button>
        <Link to="/professions">
          <Button variant="outline" size="sm">
            Cancel
          </Button>
        </Link>
      </div>
    </form>
  );
}
