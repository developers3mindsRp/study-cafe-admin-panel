import { useEffect, useState } from "react";
import { Link } from "react-router";
import Label from "../../components/form/Label";
import Input from "../../components/form/input/InputField";
import Button from "../../components/ui/button/Button";
import ImageUpload from "../../components/form/ImageUpload";
import { ArrayEditor } from "../courses/components/ArrayEditor";
import { fetchCourses } from "../../api/courses";
import type { MarketingPageMeta } from "../../api/marketingPages";

export interface MarketingPageFormData {
  course_id: string;
  slug: string;
  is_published: boolean;
  meta: MarketingPageMeta;
}

const emptyMeta = (): MarketingPageMeta => ({
  announcement_text: "Join now for just Rs.99 Only",
  use_global_faq: true,
  use_course_faq: false,
  countdown_minutes: 15,
  learning_bullets: [],
  feature_cards: [],
  bonus_items: [],
  who_can_attend: [],
  text_testimonials: [],
  video_testimonials: [],
  trainer: { highlights: [], bio_points: [] },
  stats: { people_coached: "10000", preferred_by: "150", attended: "8500" },
});

interface MarketingPageFormProps {
  mode: "create" | "edit";
  defaultValues?: Partial<MarketingPageFormData>;
  loading?: boolean;
  onSubmit: (data: MarketingPageFormData) => void;
}

function slugify(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

function slugFromCourse(course: { slug?: string | null; title: string }): string {
  const fromSlug = course.slug?.trim();
  if (fromSlug) return slugify(fromSlug);
  return slugify(course.title);
}

export default function MarketingPageForm({
  mode,
  defaultValues,
  loading = false,
  onSubmit,
}: MarketingPageFormProps) {
  const [courses, setCourses] = useState<{ id: number; title: string; slug?: string | null }[]>([]);
  /** When true, slug was edited manually — course changes no longer overwrite it. */
  const [slugManuallyEdited, setSlugManuallyEdited] = useState(mode === "edit");
  const [form, setForm] = useState<MarketingPageFormData>({
    course_id: "",
    slug: "",
    is_published: false,
    meta: emptyMeta(),
    ...defaultValues,
    meta: { ...emptyMeta(), ...defaultValues?.meta },
  });

  useEffect(() => {
    fetchCourses()
      .then((list) => setCourses(Array.isArray(list) ? list : []))
      .catch(() => setCourses([]));
  }, []);

  useEffect(() => {
    if (slugManuallyEdited || !form.course_id || courses.length === 0) return;
    const course = courses.find((c) => String(c.id) === form.course_id);
    if (!course) return;
    const generated = slugFromCourse(course);
    if (!generated) return;
    setForm((prev) => (prev.slug === generated ? prev : { ...prev, slug: generated }));
  }, [form.course_id, courses, slugManuallyEdited]);

  const handleCourseChange = (courseId: string) => {
    const course = courses.find((c) => String(c.id) === courseId);
    setForm((prev) => {
      const next = { ...prev, course_id: courseId };
      if (!slugManuallyEdited && course) {
        next.slug = slugFromCourse(course);
      }
      return next;
    });
  };

  const setMeta = (patch: Partial<MarketingPageMeta>) => {
    setForm((prev) => ({ ...prev, meta: { ...prev.meta, ...patch } }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(form);
  };

  const cardClass =
    "rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] sm:p-6 space-y-4";

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className={cardClass}>
        <h3 className="text-lg font-semibold text-gray-800 dark:text-white">Page & course</h3>
        <p className="text-sm text-gray-500">
          Link this landing page to a course. Public URL:{" "}
          <code className="text-theme-sm">/marketing/{form.slug || "[slug]"}</code>
        </p>
        {mode === "create" && !slugManuallyEdited ? (
          <p className="text-xs text-gray-400">
            Slug fills from the course automatically. Edit the slug field to use a custom URL.
          </p>
        ) : null}
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <Label>Course <span className="text-error-500">*</span></Label>
            <select
              className="h-11 w-full rounded-lg border border-gray-300 bg-transparent px-4 text-sm dark:border-gray-700 dark:bg-gray-900"
              value={form.course_id}
              onChange={(e) => handleCourseChange(e.target.value)}
              required
              disabled={mode === "edit"}
            >
              <option value="">Select course</option>
              {courses.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.title}
                  {c.slug ? ` (${c.slug})` : ""}
                </option>
              ))}
            </select>
          </div>
          <div>
            <Label>URL slug <span className="text-error-500">*</span></Label>
            <Input
              value={form.slug}
              onChange={(e) => {
                setSlugManuallyEdited(true);
                setForm((p) => ({ ...p, slug: e.target.value }));
              }}
              placeholder="automate-ca-practice"
              required
            />
            {slugManuallyEdited && mode === "create" ? (
              <button
                type="button"
                className="mt-1 text-xs text-brand-500 hover:underline"
                onClick={() => {
                  const course = courses.find((c) => String(c.id) === form.course_id);
                  if (!course) return;
                  setSlugManuallyEdited(false);
                  setForm((p) => ({ ...p, slug: slugFromCourse(course) }));
                }}
                disabled={!form.course_id}
              >
                Reset slug from course
              </button>
            ) : null}
          </div>
        </div>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={form.is_published}
            onChange={(e) => setForm((p) => ({ ...p, is_published: e.target.checked }))}
          />
          Published (visible on website)
        </label>
      </div>

      <div className={cardClass}>
        <h3 className="text-lg font-semibold text-gray-800 dark:text-white">Hero & schedule</h3>
        <div>
          <Label>Top announcement ticker</Label>
          <Input
            value={form.meta.announcement_text ?? ""}
            onChange={(e) => setMeta({ announcement_text: e.target.value })}
          />
        </div>
        <div>
          <Label>Headline</Label>
          <Input
            value={form.meta.headline ?? ""}
            onChange={(e) => setMeta({ headline: e.target.value })}
            placeholder="Leave empty to use course title"
          />
        </div>
        <div>
          <Label>Sub-headline</Label>
          <Input
            value={form.meta.subheadline ?? ""}
            onChange={(e) => setMeta({ subheadline: e.target.value })}
          />
        </div>
        <div>
          <Label>Promo video URL (YouTube)</Label>
          <Input
            value={form.meta.video_url ?? ""}
            onChange={(e) => setMeta({ video_url: e.target.value })}
            placeholder="Leave empty to use course YouTube URL"
          />
        </div>
        <div>
          <Label>Bonus banner text</Label>
          <Input
            value={form.meta.bonus_banner_text ?? ""}
            onChange={(e) => setMeta({ bonus_banner_text: e.target.value })}
          />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <Label>Masterclass date</Label>
            <Input
              value={form.meta.masterclass_date ?? ""}
              onChange={(e) => setMeta({ masterclass_date: e.target.value })}
            />
          </div>
          <div>
            <Label>Masterclass time</Label>
            <Input
              value={form.meta.masterclass_time ?? ""}
              onChange={(e) => setMeta({ masterclass_time: e.target.value })}
            />
          </div>
        </div>
      </div>

      <div className={cardClass}>
        <h3 className="text-lg font-semibold text-gray-800 dark:text-white">CTA & urgency</h3>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <Label>CTA title</Label>
            <Input
              value={form.meta.cta_title ?? ""}
              onChange={(e) => setMeta({ cta_title: e.target.value })}
            />
          </div>
          <div>
            <Label>CTA subtitle</Label>
            <Input
              value={form.meta.cta_subtitle ?? ""}
              onChange={(e) => setMeta({ cta_subtitle: e.target.value })}
            />
          </div>
          <div>
            <Label>Price button text</Label>
            <Input
              value={form.meta.cta_price_text ?? ""}
              onChange={(e) => setMeta({ cta_price_text: e.target.value })}
            />
          </div>
          <div>
            <Label>Checkout URL</Label>
            <Input
              value={form.meta.checkout_url ?? ""}
              onChange={(e) => setMeta({ checkout_url: e.target.value })}
              placeholder="/course/slug or payment link"
            />
          </div>
          <div>
            <Label>Countdown (minutes)</Label>
            <Input
              type="number"
              value={String(form.meta.countdown_minutes ?? 15)}
              onChange={(e) =>
                setMeta({ countdown_minutes: parseInt(e.target.value, 10) || 15 })
              }
            />
          </div>
          <div>
            <Label>Price after timer (text)</Label>
            <Input
              value={form.meta.increased_price_text ?? ""}
              onChange={(e) => setMeta({ increased_price_text: e.target.value })}
            />
          </div>
        </div>
        <div className="grid gap-4 sm:grid-cols-3">
          <div>
            <Label>People coached</Label>
            <Input
              value={form.meta.stats?.people_coached ?? ""}
              onChange={(e) =>
                setMeta({ stats: { ...form.meta.stats, people_coached: e.target.value } })
              }
            />
          </div>
          <div>
            <Label>Preferred by experts</Label>
            <Input
              value={form.meta.stats?.preferred_by ?? ""}
              onChange={(e) =>
                setMeta({ stats: { ...form.meta.stats, preferred_by: e.target.value } })
              }
            />
          </div>
          <div>
            <Label>Attended</Label>
            <Input
              value={form.meta.stats?.attended ?? ""}
              onChange={(e) =>
                setMeta({ stats: { ...form.meta.stats, attended: e.target.value } })
              }
            />
          </div>
        </div>
      </div>

      <div className={cardClass}>
        <h3 className="text-lg font-semibold text-gray-800 dark:text-white">FAQ source</h3>
        <p className="text-sm text-gray-500">
          Manage global FAQs under <Link to="/faq" className="text-brand-500">FAQ</Link> and course FAQs in the course editor.
        </p>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={form.meta.use_global_faq !== false}
            onChange={(e) => setMeta({ use_global_faq: e.target.checked })}
          />
          Use global FAQs (common section)
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={!!form.meta.use_course_faq}
            onChange={(e) => setMeta({ use_course_faq: e.target.checked })}
          />
          Use course-specific FAQs (from linked course)
        </label>
      </div>

      <div className={cardClass}>
        <h3 className="text-lg font-semibold text-gray-800 dark:text-white">Learning bullets</h3>
        <ArrayEditor
          value={form.meta.learning_bullets ?? []}
          onChange={(learning_bullets) => setMeta({ learning_bullets })}
          defaultItem=""
          addButtonLabel="Add bullet"
          renderItem={(item, index) => (
            <Input
              value={item}
              onChange={(e) => {
                const arr = [...(form.meta.learning_bullets ?? [])];
                arr[index] = e.target.value;
                setMeta({ learning_bullets: arr });
              }}
              placeholder="Learn how to..."
            />
          )}
        />
      </div>

      <div className={cardClass}>
        <h3 className="text-lg font-semibold text-gray-800 dark:text-white">Feature cards</h3>
        <ArrayEditor
          value={form.meta.feature_cards ?? []}
          onChange={(feature_cards) => setMeta({ feature_cards })}
          defaultItem={{ icon: "", text: "" }}
          addButtonLabel="Add feature"
          renderItem={(item, index, updateItem) => (
            <div className="space-y-2">
              <ImageUpload
                label="Icon"
                value={item.icon ?? ""}
                onChange={(url) => updateItem(index, { icon: url })}
              />
              <Input
                value={item.text ?? ""}
                onChange={(e) => updateItem(index, { text: e.target.value })}
              />
            </div>
          )}
        />
      </div>

      <div className={cardClass}>
        <h3 className="text-lg font-semibold text-gray-800 dark:text-white">Bonuses</h3>
        <ArrayEditor
          value={form.meta.bonus_items ?? []}
          onChange={(bonus_items) => setMeta({ bonus_items })}
          defaultItem={{ label: "", icon: "", description: "", worth: "" }}
          addButtonLabel="Add bonus"
          renderItem={(item, index, updateItem) => (
            <div className="space-y-2">
              <Input
                value={item.label ?? ""}
                onChange={(e) => updateItem(index, { label: e.target.value })}
                placeholder="Bonus 1"
              />
              <ImageUpload
                label="Icon"
                value={item.icon ?? ""}
                onChange={(url) => updateItem(index, { icon: url })}
              />
              <Input
                value={item.description ?? ""}
                onChange={(e) => updateItem(index, { description: e.target.value })}
              />
              <Input
                value={item.worth ?? ""}
                onChange={(e) => updateItem(index, { worth: e.target.value })}
                placeholder="Worth ₹4,000"
              />
            </div>
          )}
        />
      </div>

      <div className={cardClass}>
        <h3 className="text-lg font-semibold text-gray-800 dark:text-white">Who can attend</h3>
        <ArrayEditor
          value={form.meta.who_can_attend ?? []}
          onChange={(who_can_attend) => setMeta({ who_can_attend })}
          defaultItem=""
          addButtonLabel="Add audience"
          renderItem={(item, index) => (
            <Input
              value={item}
              onChange={(e) => {
                const arr = [...(form.meta.who_can_attend ?? [])];
                arr[index] = e.target.value;
                setMeta({ who_can_attend: arr });
              }}
            />
          )}
        />
      </div>

      <div className={cardClass}>
        <h3 className="text-lg font-semibold text-gray-800 dark:text-white">Trainer</h3>
        <ImageUpload
          label="Trainer photo override"
          value={form.meta.trainer?.image_url ?? ""}
          onChange={(url) =>
            setMeta({ trainer: { ...form.meta.trainer, image_url: url } })
          }
        />
        <Label>Highlights</Label>
        <ArrayEditor
          value={form.meta.trainer?.highlights ?? []}
          onChange={(highlights) =>
            setMeta({ trainer: { ...form.meta.trainer, highlights } })
          }
          defaultItem=""
          addButtonLabel="Add highlight"
          renderItem={(item, index) => (
            <Input
              value={item}
              onChange={(e) => {
                const arr = [...(form.meta.trainer?.highlights ?? [])];
                arr[index] = e.target.value;
                setMeta({ trainer: { ...form.meta.trainer, highlights: arr } });
              }}
            />
          )}
        />
        <Label>Bio points</Label>
        <ArrayEditor
          value={form.meta.trainer?.bio_points ?? []}
          onChange={(bio_points) =>
            setMeta({ trainer: { ...form.meta.trainer, bio_points } })
          }
          defaultItem=""
          addButtonLabel="Add bio point"
          renderItem={(item, index) => (
            <Input
              value={item}
              onChange={(e) => {
                const arr = [...(form.meta.trainer?.bio_points ?? [])];
                arr[index] = e.target.value;
                setMeta({ trainer: { ...form.meta.trainer, bio_points: arr } });
              }}
            />
          )}
        />
      </div>

      <p className="text-sm text-gray-500 rounded-lg border border-gray-200 bg-gray-50 p-4 dark:border-gray-800 dark:bg-white/[0.02]">
        Photo gallery images are managed in{" "}
        <Link to="/courses/settings" className="text-brand-500 hover:underline">
          Courses → Page Settings
        </Link>
        . They appear on all course detail and marketing pages.
      </p>

      <div className="flex gap-3">
        <Button type="submit" disabled={loading}>
          {mode === "create" ? "Create marketing page" : "Save changes"}
        </Button>
        <Link to="/marketing-pages">
          <Button type="button" variant="outline">
            Cancel
          </Button>
        </Link>
      </div>
    </form>
  );
}
