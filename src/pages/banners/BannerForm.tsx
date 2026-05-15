import React from "react";
import Label from "../../components/form/Label";
import Input from "../../components/form/input/InputField";
import ImageUpload from "../../components/form/ImageUpload";
import Button from "../../components/ui/button/Button";
import { CMS_IMAGE_UPLOAD_PLACEHOLDER } from "../../constants/cmsImageUpload";
import { BannerRecord } from "../../api/banners";

interface BannerFormProps {
  initialData?: Partial<BannerRecord>;
  onSubmit: (data: any) => Promise<void>;
  loading?: boolean;
}

export default function BannerForm({ initialData, onSubmit, loading }: BannerFormProps) {
  const [formData, setFormData] = React.useState({
    identifier: initialData?.identifier || "",
    desktop_image_url: initialData?.desktop_image_url || "",
    mobile_image_url: initialData?.mobile_image_url || "",
    link_url: initialData?.link_url || "",
    is_active: initialData?.is_active ?? true,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] sm:p-6">
        <div className="grid gap-6">
          <div>
            <Label>Unique Identifier (slug/key)</Label>
            <Input
              value={formData.identifier}
              onChange={(e) => setFormData({ ...formData, identifier: e.target.value })}
              placeholder="e.g. home-popup, course-promo"
              required
            />
          </div>

          <div className="grid gap-6 sm:grid-cols-2">
            <div>
              <Label>Desktop Image</Label>
              <ImageUpload
                value={formData.desktop_image_url ?? ""}
                onChange={(url) => setFormData({ ...formData, desktop_image_url: url })}
                placeholder={CMS_IMAGE_UPLOAD_PLACEHOLDER}
              />
            </div>
            <div>
              <Label>Mobile Image</Label>
              <ImageUpload
                value={formData.mobile_image_url ?? ""}
                onChange={(url) => setFormData({ ...formData, mobile_image_url: url })}
                placeholder={CMS_IMAGE_UPLOAD_PLACEHOLDER}
              />
            </div>
          </div>

          <div>
            <Label>Link URL (Optional)</Label>
            <Input
              value={formData.link_url}
              onChange={(e) => setFormData({ ...formData, link_url: e.target.value })}
              placeholder="https://studycafe.in/..."
            />
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="is_active"
              checked={formData.is_active}
              onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
              className="h-4 w-4 rounded border-gray-300 text-brand-600 focus:ring-brand-500"
            />
            <Label htmlFor="is_active" className="mb-0 cursor-pointer">
              Active
            </Label>
          </div>
        </div>
      </div>

      <div className="flex justify-end gap-3">
        <Button variant="outline" type="button" onClick={() => window.history.back()}>
          Cancel
        </Button>
        <Button type="submit" disabled={loading}>
          {loading ? "Saving..." : "Save Banner"}
        </Button>
      </div>
    </form>
  );
}
