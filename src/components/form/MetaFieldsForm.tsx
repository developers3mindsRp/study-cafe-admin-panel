import { useState } from "react";
import Label from "./Label";
import Input from "./input/InputField";
import TextArea from "./input/TextArea";
import ImageUpload from "./ImageUpload";

export interface SEOMetaFields {
  metaTitle: string;
  metaDescription: string;
  metaKeywords: string;
  canonicalUrl: string;
  robots: "index, follow" | "noindex, nofollow" | "index, nofollow" | "noindex, follow";
  ogTitle: string;
  ogDescription: string;
  ogImageUrl: string;
}

export const emptySEOMetaFields: SEOMetaFields = {
  metaTitle: "",
  metaDescription: "",
  metaKeywords: "",
  canonicalUrl: "",
  robots: "index, follow",
  ogTitle: "",
  ogDescription: "",
  ogImageUrl: "",
};

interface MetaFieldsFormProps {
  value: Partial<SEOMetaFields>;
  onChange: (data: Partial<SEOMetaFields>) => void;
  /** Wrap in collapsible section (e.g. for Article form) */
  collapsible?: boolean;
  /** When collapsible, start open or closed */
  defaultOpen?: boolean;
}

export default function MetaFieldsForm({
  value,
  onChange,
  collapsible = false,
  defaultOpen = false,
}: MetaFieldsFormProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  /** Send only the changed slice so parents merge correctly (full `{ ...value, ...patch }` stale-closed UI values). */
  const update = (patch: Partial<SEOMetaFields>) => onChange(patch);

  const content = (
    <div className="space-y-6">
      {/* Meta Tags */}
      <div className="space-y-4">
        <div>
          <Label>Meta Title</Label>
          <Input
            value={value.metaTitle ?? ""}
            onChange={(e) => update({ metaTitle: e.target.value })}
            placeholder="50–60 characters for search results"
          />
        </div>
        <div>
          <Label>Meta Description</Label>
          <TextArea
            rows={2}
            value={value.metaDescription ?? ""}
            onChange={(v) => update({ metaDescription: v })}
            placeholder="150–160 characters for search results"
          />
        </div>
        <div>
          <Label>Meta Keywords</Label>
          <Input
            value={value.metaKeywords ?? ""}
            onChange={(e) => update({ metaKeywords: e.target.value })}
            placeholder="Comma-separated keywords"
          />
        </div>
        <div>
          <Label>Canonical URL</Label>
          <Input
            value={value.canonicalUrl ?? ""}
            onChange={(e) => update({ canonicalUrl: e.target.value })}
            placeholder="https://studycafe.in/page-path"
          />
        </div>
        <div>
          <Label>Robots</Label>
          <select
            value={value.robots ?? "index, follow"}
            onChange={(e) =>
              update({
                robots: e.target.value as SEOMetaFields["robots"],
              })
            }
            className="w-full rounded-lg border border-gray-200 bg-white px-4 py-3 text-sm text-gray-800 dark:border-gray-800 dark:bg-white/[0.03] dark:text-white/90"
          >
            <option value="index, follow">Index, Follow</option>
            <option value="noindex, nofollow">No Index, No Follow</option>
            <option value="index, nofollow">Index, No Follow</option>
            <option value="noindex, follow">No Index, Follow</option>
          </select>
        </div>
      </div>

      {/* Open Graph */}
      <div className="space-y-4">
        <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">
          Open Graph (Social Sharing)
        </h4>
        <div>
          <Label>OG Title</Label>
          <Input
            value={value.ogTitle ?? ""}
            onChange={(e) => update({ ogTitle: e.target.value })}
            placeholder="Title for social sharing"
          />
        </div>
        <div>
          <Label>OG Description</Label>
          <TextArea
            rows={2}
            value={value.ogDescription ?? ""}
            onChange={(v) => update({ ogDescription: v })}
            placeholder="Description for social sharing"
          />
        </div>
        <div>
          <ImageUpload
            label="OG Image"
            value={value.ogImageUrl ?? ""}
            onChange={(ogImageUrl) => update({ ogImageUrl })}
            placeholder="Drop or select OG image"
          />
        </div>
      </div>
    </div>
  );

  if (collapsible) {
    return (
      <details
        open={isOpen}
        onToggle={(e) => setIsOpen(e.currentTarget.open)}
        className="group rounded-lg border bg-white border-gray-200 dark:border-gray-800"
      >
        <summary className="cursor-pointer list-none px-4 py-3 font-medium text-gray-800  dark:text-white/90 dark:hover:bg-gray-800/50">
          <span className="flex items-center gap-2">
            <svg
              className={`size-4 transition-transform ${isOpen ? "rotate-90" : ""}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
            SEO &amp; Open Graph
          </span>
        </summary>
        <div className="border-t border-gray-200 px-4 py-4 dark:border-gray-800">
          {content}
        </div>
      </details>
    );
  }

  return content;
}
