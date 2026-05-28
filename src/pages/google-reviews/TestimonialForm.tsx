import { useState } from "react";
import { Link } from "react-router";
import Label from "../../components/form/Label";
import Input from "../../components/form/input/InputField";
import TextArea from "../../components/form/input/TextArea";
import Button from "../../components/ui/button/Button";

export interface GoogleReviewFormData {
  content: string;
  author_name: string;
  author_role: string;
  rating?: string;
  reviewed_at?: string;
  sort_order?: string;
}

interface GoogleReviewFormProps {
  mode: "create" | "edit";
  defaultValues?: Partial<GoogleReviewFormData>;
  loading?: boolean;
  onSubmit: (data: GoogleReviewFormData) => void;
}

const emptyFormData: GoogleReviewFormData = {
  content: "",
  author_name: "",
  author_role: "",
  rating: "5",
  reviewed_at: "",
  sort_order: "0",
};

export default function GoogleReviewForm({
  mode,
  defaultValues,
  loading = false,
  onSubmit,
}: GoogleReviewFormProps) {
  const [formData, setFormData] = useState<GoogleReviewFormData>({
    ...emptyFormData,
    ...defaultValues,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  const submitLabel = mode === "create" ? "Create Google Review" : "Update Google Review";

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] sm:p-6">
        <div className="space-y-4">
          <div>
            <Label>Quote / Content <span className="text-error-500">*</span></Label>
            <TextArea
              rows={4}
              value={formData.content}
              onChange={(value) =>
                setFormData((prev) => ({ ...prev, content: value }))
              }
              placeholder="Enter review text"
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label>Author Name <span className="text-error-500">*</span></Label>
              <Input
                value={formData.author_name}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, author_name: e.target.value }))
                }
                placeholder="e.g. Priya Sharma"
              />
            </div>
            <div>
              <Label>Author Role / Designation</Label>
              <Input
                value={formData.author_role}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, author_role: e.target.value }))
                }
                placeholder="e.g. CA Final Student"
              />
            </div>
            <div>
              <Label>Rating (1-5)</Label>
              <Input
                type="number"
                min={1}
                max={5}
                value={formData.rating || ''}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, rating: e.target.value }))
                }
                placeholder="5"
              />
            </div>
            <div>
              <Label>Time Ago (optional)</Label>
              <Input
                value={formData.reviewed_at || ''}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, reviewed_at: e.target.value }))
                }
                placeholder="e.g. 2 weeks ago"
              />
            </div>
            <div>
              <Label>Sort Order</Label>
              <Input
                type="number"
                value={formData.sort_order || ''}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, sort_order: e.target.value }))
                }
                placeholder="0"
              />
            </div>
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
        <Link to="/google-reviews">
          <Button variant="outline" size="sm" disabled={loading}>
            Cancel
          </Button>
        </Link>
      </div>
    </form>
  );
}
