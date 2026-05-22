import { useState } from "react";
import { Link } from "react-router";
import Label from "../../components/form/Label";
import Input from "../../components/form/input/InputField";
import Button from "../../components/ui/button/Button";
import ImageUpload from "../../components/form/ImageUpload";

export interface TestimonialFormData {
  title: string;
  media_type: "video" | "image";
  media_url: string;
  video_url: string;
  sort_order: string;
}

interface TestimonialFormProps {
  mode: "create" | "edit";
  defaultValues?: Partial<TestimonialFormData>;
  loading?: boolean;
  onSubmit: (data: TestimonialFormData) => void;
}

const emptyFormData: TestimonialFormData = {
  title: "",
  media_type: "video",
  media_url: "",
  video_url: "",
  sort_order: "0",
};

export default function TestimonialForm({
  mode,
  defaultValues,
  loading = false,
  onSubmit,
}: TestimonialFormProps) {
  const [formData, setFormData] = useState<TestimonialFormData>({
    ...emptyFormData,
    ...defaultValues,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  const submitLabel = mode === "create" ? "Create Testimonial" : "Update Testimonial";
  const isVideo = formData.media_type === "video";

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] sm:p-6">
        <div className="space-y-4">
          <div>
            <Label>Title (optional)</Label>
            <Input
              value={formData.title}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, title: e.target.value }))
              }
              placeholder="e.g. CA Student Success Story"
            />
          </div>

          <div>
            <Label>Media Type <span className="text-error-500">*</span></Label>
            <select
              value={formData.media_type}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  media_type: e.target.value as "video" | "image",
                  video_url: e.target.value === "image" ? "" : prev.video_url,
                }))
              }
              className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm dark:border-gray-700 dark:bg-gray-900"
            >
              <option value="video">Video (YouTube or URL)</option>
              <option value="image">Image only</option>
            </select>
          </div>

          <div>
            <Label>
              {isVideo ? "Thumbnail / Poster Image" : "Image"}{" "}
              <span className="text-error-500">*</span>
            </Label>
            <p className="mb-2 text-xs text-gray-500">
              Used as the sharp center preview and blurred card background on the site.
            </p>
            <ImageUpload
              value={formData.media_url}
              onChange={(url) =>
                setFormData((prev) => ({ ...prev, media_url: url }))
              }
            />
          </div>

          {isVideo ? (
            <div>
              <Label>Video URL <span className="text-error-500">*</span></Label>
              <Input
                value={formData.video_url}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, video_url: e.target.value }))
                }
                placeholder="https://www.youtube.com/watch?v=..."
              />
            </div>
          ) : null}

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
        </div>
      </div>

      <div className="flex gap-3">
        <button
          type="submit"
          disabled={loading || !formData.media_url.trim()}
          className="inline-flex items-center justify-center gap-2 rounded-lg px-4 py-3 text-sm font-medium text-white transition bg-brand-500 shadow-theme-xs hover:bg-brand-600 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? "Saving..." : submitLabel}
        </button>
        <Link to="/testimonials">
          <Button variant="outline" size="sm" disabled={loading}>
            Cancel
          </Button>
        </Link>
      </div>
    </form>
  );
}
