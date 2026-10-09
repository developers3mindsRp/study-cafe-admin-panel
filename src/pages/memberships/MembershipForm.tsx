import { useState, useEffect, useRef } from "react";
import { Link } from "react-router";
import Label from "../../components/form/Label";
import Input from "../../components/form/input/InputField";
import TextArea from "../../components/form/input/TextArea";
import { ChipMultiSelect } from "../../components/form/ChipMultiSelect";
import Button from "../../components/ui/button/Button";
import { api } from "../../api/axios";
import { planIsLifetime, planWebsiteUrl } from "./membershipUtils";
import { slugifyForSeo, shouldResyncSlugFromSource } from "../../lib/slug";

export interface CourseOption {
  id: number;
  title: string;
}

export interface CourseCatOption {
  id: number;
  name: string;
  slug: string;
}

/** Convert a plain textarea string (one item per line) into a string[] for the API. */
export function parseFeaturesToArray(text: string): string[] {
  if (!text || !text.trim()) return [];
  return text
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.length > 0);
}

/** Convert a string[] (from API) back into a plain textarea string. */
export function arrayToFeaturesText(arr: string[]): string {
  if (!arr || arr.length === 0) return "";
  return arr.join("\n");
}

// Keep old name as alias so MembershipEdit.tsx doesn't need changes
export const arrayToFeaturesHtml = arrayToFeaturesText;

export interface MembershipFormData {
  name: string;
  slug: string;
  description: string;
  price: number;
  mrp: number;
  currency: string;
  duration_days: number;
  is_lifetime: boolean;
  features_included: string;
  is_active: boolean;
  hide_from_public: boolean;
  is_popular: boolean;
  sort_order: number;
  tier_rank: number;
  course_ids: number[];
  course_cat_ids: number[];
  /** Percent of paid order for affiliate (0–100). */
  affiliate_commission: number;
}

interface MembershipFormProps {
  mode: "create" | "edit";
  defaultValues?: Partial<MembershipFormData>;
  onSubmit: (data: MembershipFormData) => void;
  loading?: boolean;
}

const emptyFormData: MembershipFormData = {
  name: "",
  slug: "",
  description: "",
  price: 0,
  mrp: 0,
  currency: "INR",
  duration_days: 30,
  is_lifetime: false,
  features_included: "",
  is_active: true,
  hide_from_public: false,
  is_popular: false,
  sort_order: 0,
  tier_rank: 0,
  course_ids: [],
  course_cat_ids: [],
  affiliate_commission: 0,
};

export default function MembershipForm({
  mode,
  defaultValues,
  onSubmit,
  loading = false,
}: MembershipFormProps) {
  const [formData, setFormData] = useState<MembershipFormData>({
    ...emptyFormData,
    ...defaultValues,
  });
  // Tracks the last duration_days value before switching to lifetime,
  // so we can restore it when the user unchecks the Lifetime checkbox.
  const prevDurationRef = useRef<number>(
    defaultValues?.is_lifetime ? 365 : (defaultValues?.duration_days ?? 365)
  );
  const [courses, setCourses] = useState<CourseOption[]>([]);
  const [courseCats, setCourseCats] = useState<CourseCatOption[]>([]);
  const [optionsLoading, setOptionsLoading] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setOptionsLoading(true);
      try {
        const [coursesRes, catsRes] = await Promise.all([
          api.get<(CourseOption & { is_published: boolean })[]>("/admin/courses"),
          api.get<CourseCatOption[]>("/admin/course-cats"),
        ]);
        if (!cancelled) {
          const allCourses = Array.isArray(coursesRes.data) ? coursesRes.data : [];
          setCourses(allCourses.filter((c) => c.is_published));
          setCourseCats(Array.isArray(catsRes.data) ? catsRes.data : []);
        }
      } catch {
        if (!cancelled) { setCourses([]); setCourseCats([]); }
      } finally {
        if (!cancelled) setOptionsLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  // Effect to update state when defaultValues change (e.g. after async data fetch in edit mode).
  // Serialise to JSON so the effect only re-runs when the actual values change,
  // not on every parent re-render that produces a new object reference.
  const defaultValuesJson = JSON.stringify(defaultValues);
  useEffect(() => {
    if (defaultValues) {
      const merged = { ...defaultValues };
      if (planIsLifetime(merged as MembershipFormData)) {
        merged.is_lifetime = true;
      }
      setFormData((prev) => ({ ...prev, ...merged }));
      // Keep prevDurationRef in sync: if the loaded plan is NOT lifetime,
      // store the real duration so we can restore it if the user toggles.
      if (!defaultValues.is_lifetime && defaultValues.duration_days) {
        prevDurationRef.current = defaultValues.duration_days;
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [defaultValuesJson]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const slug =
      slugifyForSeo(formData.slug) ||
      slugifyForSeo(formData.name);
    onSubmit({ ...formData, slug });
  };

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const name = e.target.value;
    setFormData((prev) => {
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
  };

  const submitLabel = loading
    ? "Saving..."
    : mode === "create" ? "Create Membership" : "Update Membership";

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] sm:p-6">
        <div className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label>Name <span className="text-error-500">*</span></Label>
              <Input
                value={formData.name}
                onChange={handleNameChange}
                placeholder="e.g. Lifetime Ultimate"
                required
              />
            </div>
            <div>
              <Label>Slug <span className="text-error-500">*</span></Label>
              <Input
                value={formData.slug}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, slug: e.target.value }))
                }
                onBlur={() =>
                  setFormData((prev) => ({
                    ...prev,
                    slug: slugifyForSeo(prev.slug),
                  }))
                }
                placeholder="e.g. lifetime-ultimate"
                required
              />
            </div>
          </div>

          <div>
            <Label>Description</Label>
            <TextArea
              rows={3}
              value={formData.description}
              onChange={(value) =>
                setFormData((prev) => ({ ...prev, description: value }))
              }
              placeholder="Brief description of the membership"
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-4">
            <div>
              <Label>Price <span className="text-error-500">*</span></Label>
              <div className="relative">
                <span className="absolute left-3 top-2.5 text-gray-500">₹</span>
                <Input
                  type="number"
                  className="pl-8"
                  value={formData.price}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, price: Number(e.target.value) }))
                  }
                  placeholder="0"
                  required
                />
              </div>
            </div>
            <div>
              <Label>MRP (Strikethrough Price)</Label>
              <div className="relative">
                <span className="absolute left-3 top-2.5 text-gray-500">₹</span>
                <Input
                  type="number"
                  className="pl-8"
                  value={formData.mrp}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, mrp: Number(e.target.value) }))
                  }
                  placeholder="0"
                />
              </div>
            </div>
            <div>
              <Label>Currency</Label>
              <Input
                value={formData.currency}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, currency: e.target.value }))
                }
                disabled // Fixed to INR for now
              />
            </div>
            <div>
              <Label>Affiliate commission (%)</Label>
              <Input
                type="number"
                min={0}
                max={100}
                step={0.01}
                value={formData.affiliate_commission}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    affiliate_commission: Number(e.target.value),
                  }))
                }
              />
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                Percent of each paid membership order for the referrer. Use 0 to disable.
              </p>
            </div>
            <div>
              <Label>Duration</Label>
              {formData.is_lifetime ? (
                <div className="flex min-h-[46px] items-center rounded-lg border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm font-medium text-gray-800 dark:border-gray-700 dark:bg-white/[0.03] dark:text-white/90">
                  Lifetime
                </div>
              ) : (
                <Input
                  type="number"
                  value={formData.duration_days}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, duration_days: Number(e.target.value) }))
                  }
                  placeholder="e.g. 30, 365"
                />
              )}
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="is_lifetime"
                checked={formData.is_lifetime}
                onChange={(e) => {
                  const checked = e.target.checked;
                  setFormData((prev) => {
                    if (checked) {
                      // Save the current duration before switching to lifetime
                      prevDurationRef.current = prev.duration_days || 365;
                      return { ...prev, is_lifetime: true, duration_days: 3650 };
                    } else {
                      // Restore the previously saved duration
                      return { ...prev, is_lifetime: false, duration_days: prevDurationRef.current };
                    }
                  });
                }}
                className="rounded border-gray-300"
              />
              <Label htmlFor="is_lifetime" className="!mb-0">Lifetime plan</Label>
            </div>
          </div>
          {!optionsLoading && (courses.length > 0 || courseCats.length > 0) && (
            <div className="grid gap-4 sm:grid-cols-2">
              {courses.length > 0 && (
                <ChipMultiSelect
                  label="Courses included (optional)"
                  options={courses.map((c) => ({ id: c.id, name: c.title }))}
                  value={formData.course_ids}
                  onChange={(ids) => setFormData((prev) => ({ ...prev, course_ids: ids }))}
                  placeholder="Search or select courses…"
                />
              )}
              {courseCats.length > 0 && (
                <ChipMultiSelect
                  label="Categories included – all courses under these (optional)"
                  options={courseCats.map((c) => ({ id: c.id, name: c.name, slug: c.slug }))}
                  value={formData.course_cat_ids}
                  onChange={(ids) => setFormData((prev) => ({ ...prev, course_cat_ids: ids }))}
                  placeholder="Search or select categories…"
                />
              )}
            </div>
          )}
          <div>
            <Label>Included Features</Label>
            <textarea
              rows={10}
              value={formData.features_included}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, features_included: e.target.value }))
              }
              placeholder={"Ad Free Content\nDownload Files\nCertificate Download\n..."}
              className="w-full rounded-lg border border-gray-200 bg-white px-4 py-3 text-sm text-gray-800 placeholder-gray-400 dark:border-gray-800 dark:bg-white/[0.03] dark:text-white/90 resize-y"
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label>Status</Label>
              <select
                value={formData.is_active ? "active" : "inactive"}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    is_active: e.target.value === "active",
                  }))
                }
                className="w-full rounded-lg border border-gray-200 bg-white px-4 py-3 text-sm text-gray-800 dark:border-gray-800 dark:bg-white/[0.03] dark:text-white/90"
              >
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
            <div>
              <Label>Sort Order</Label>
              <Input
                type="number"
                value={formData.sort_order}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, sort_order: Number(e.target.value) }))
                }
                placeholder="0"
              />
            </div>
            <div>
              <Label>Tier Rank</Label>
              <Input
                type="number"
                value={formData.tier_rank}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, tier_rank: Number(e.target.value) }))
                }
                placeholder="1=Basic, 2=Premium, 3=Ultimate"
              />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="is_popular"
              checked={formData.is_popular}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, is_popular: e.target.checked }))
              }
              className="rounded border-gray-300"
            />
            <Label htmlFor="is_popular" className="!mb-0">Mark as Most Popular</Label>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="hide_from_public"
                checked={formData.hide_from_public}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, hide_from_public: e.target.checked }))
                }
                className="rounded border-gray-300"
              />
              <Label htmlFor="hide_from_public" className="!mb-0">Hide from Public (Unlisted)</Label>
            </div>
            <p className="mt-1 text-theme-xs text-gray-500 dark:text-gray-400">
              Not shown on the Plans page or home page. Still opens and can be bought via the direct link
              {planWebsiteUrl(formData) ? `: ${planWebsiteUrl(formData)}` : ""} (copy it from the Memberships list
              or the membership's View page).
            </p>
          </div>
        </div>
      </div>

      <div className="flex gap-3">
        <button
          type="submit"
          disabled={loading}
          className="inline-flex items-center justify-center gap-2 rounded-lg px-4 py-3 text-sm font-medium text-white transition bg-brand-500 shadow-theme-xs hover:bg-brand-600 disabled:opacity-50"
        >
          {submitLabel}
        </button>
        <Link to="/memberships">
          <Button variant="outline" size="sm">
            Cancel
          </Button>
        </Link>
      </div>
    </form>
  );
}
