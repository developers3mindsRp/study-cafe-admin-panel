import { useState } from "react";
import { Link } from "react-router";
import Label from "../../components/form/Label";
import Input from "../../components/form/input/InputField";
import RichTextEditor from "../../components/form/RichTextEditor";
import Button from "../../components/ui/button/Button";

export interface TemplateFormData {
  name: string;
  subject: string;
  html_content: string;
}

interface TemplateFormProps {
  mode: "create" | "edit";
  defaultValues?: Partial<TemplateFormData>;
  loading?: boolean;
  onSubmit: (data: TemplateFormData) => void;
}

const emptyFormData: TemplateFormData = {
  name: "",
  subject: "",
  html_content: "",
};

export default function TemplateForm({
  mode,
  defaultValues,
  loading = false,
  onSubmit,
}: TemplateFormProps) {
  const [formData, setFormData] = useState<TemplateFormData>({
    ...emptyFormData,
    ...defaultValues,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  const submitLabel = mode === "create" ? "Create Template" : "Update Template";

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] sm:p-6">
        <div className="space-y-4">
          <div>
            <Label>Name <span className="text-error-500">*</span></Label>
            <Input
              value={formData.name}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, name: e.target.value }))
              }
              placeholder="Internal name (e.g. Weekly Digest)"
              required
            />
          </div>
          <div>
            <Label>Subject <span className="text-error-500">*</span></Label>
            <Input
              value={formData.subject}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, subject: e.target.value }))
              }
              placeholder="Email subject line"
              required
            />
          </div>
          <div>
            <Label>HTML Content <span className="text-error-500">*</span></Label>
            <RichTextEditor
              value={formData.html_content}
              onChange={(value) =>
                setFormData((prev) => ({ ...prev, html_content: value }))
              }
              placeholder="Write the email body…"
              minHeight="300px"
            />
            <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
              An unsubscribe footer is appended automatically to every email.
            </p>
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
        <Link to="/newsletter/templates">
          <Button variant="outline" size="sm">
            Cancel
          </Button>
        </Link>
      </div>
    </form>
  );
}
