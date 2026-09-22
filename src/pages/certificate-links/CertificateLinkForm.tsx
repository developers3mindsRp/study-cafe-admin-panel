import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router";
import Label from "../../components/form/Label";
import Input from "../../components/form/input/InputField";
import TextArea from "../../components/form/input/TextArea";
import Checkbox from "../../components/form/input/Checkbox";
import Button from "../../components/ui/button/Button";
import SearchableSelect from "../../components/form/SearchableSelect";
import { fetchCourses, type Course } from "../../api/courses";
import type { CertificateLinkFormValues, CertificateLinkStatus } from "../../types/certificateLink";

const empty: CertificateLinkFormValues = {
  course_id: "",
  title: "",
  description: "",
  status: "draft",
  expires_at: "",
  certificate_date: "",
  max_claims: "",
  send_email: true,
};

const STATUS_OPTIONS: { value: CertificateLinkStatus; label: string; hint: string }[] = [
  { value: "draft", label: "Draft", hint: "Not reachable yet — the public URL returns nothing." },
  { value: "active", label: "Active", hint: "Anyone with the link can claim a certificate." },
  {
    value: "disabled",
    label: "Disabled",
    hint: "Closed to new claims. Certificates already issued stay valid.",
  },
];

/** `<input type="datetime-local">` wants local wall-clock time, not an ISO string. */
function toDatetimeLocal(iso?: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

interface Props {
  mode: "create" | "edit";
  defaultValues?: Partial<CertificateLinkFormValues>;
  loading?: boolean;
  /** Certificates already issued. Above zero the course is locked. */
  claimsCount?: number;
  onSubmit: (data: CertificateLinkFormValues) => void;
}

export default function CertificateLinkForm({
  mode,
  defaultValues,
  loading = false,
  claimsCount = 0,
  onSubmit,
}: Props) {
  const [form, setForm] = useState<CertificateLinkFormValues>({ ...empty, ...defaultValues });
  const [courses, setCourses] = useState<Course[]>([]);
  const [coursesLoading, setCoursesLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const rows = await fetchCourses();
        if (!cancelled) setCourses(rows);
      } catch {
        if (!cancelled) setCourses([]);
      } finally {
        if (!cancelled) setCoursesLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const update = <K extends keyof CertificateLinkFormValues>(
    key: K,
    value: CertificateLinkFormValues[K],
  ) => setForm((prev) => ({ ...prev, [key]: value }));

  const courseOptions = useMemo(
    () => courses.map((c) => ({ value: String(c.id), text: c.title })),
    [courses],
  );

  const selectedCourse = useMemo(
    () => courses.find((c) => String(c.id) === form.course_id) || null,
    [courses, form.course_id],
  );

  // The claim endpoint rejects a course with certificates switched off, so warn here rather than
  // letting the admin share a link that fails for every visitor.
  const certificatesDisabled =
    selectedCourse != null && selectedCourse.certificate_enabled === false;

  /** Changing the course would print a different course on serials already in people's hands. */
  const courseLocked = mode === "edit" && claimsCount > 0;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.course_id || !form.title.trim() || !form.expires_at) return;
    onSubmit(form);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] lg:p-6">
        <h3 className="mb-5 text-base font-medium text-gray-800 dark:text-white/90">Link details</h3>

        <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
          <div className="md:col-span-2">
            <Label>
              Internal title <span className="text-error-500">*</span>
            </Label>
            <Input
              required
              value={form.title}
              onChange={(e) => update("title", e.target.value)}
              placeholder="e.g. GST Webinar — 14 Sep 2026"
            />
            <p className="mt-1 text-xs text-gray-400">
              Shown on the claim page and in the leads list. Visitors see it, so keep it presentable.
            </p>
          </div>

          <div className="md:col-span-2">
            <Label>
              Course <span className="text-error-500">*</span>
            </Label>
            <SearchableSelect
              options={courseOptions}
              value={form.course_id}
              onChange={(v) => update("course_id", v)}
              placeholder={coursesLoading ? "Loading courses…" : "Select a course"}
              searchPlaceholder="Type to search…"
              emptyMessage="No courses found."
              disabled={courseLocked}
            />
            {courseLocked && (
              <p className="mt-1 text-xs text-gray-400">
                Locked — this link has already issued {claimsCount} certificate
                {claimsCount === 1 ? "" : "s"}. Changing the course now would print a different course
                on numbers already handed out. Create a new link instead.
              </p>
            )}
            {certificatesDisabled && (
              <p className="mt-1 text-xs text-error-500">
                This course has certificates switched off — every claim on this link would be
                rejected. Enable certificates on the course first.
              </p>
            )}
          </div>

          <div className="md:col-span-2">
            <Label>Description</Label>
            <TextArea
              rows={3}
              value={form.description}
              onChange={(v) => update("description", v)}
              placeholder="Optional. Shown under the title on the claim page."
            />
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] lg:p-6">
        <h3 className="mb-5 text-base font-medium text-gray-800 dark:text-white/90">
          Availability
        </h3>

        <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
          <div>
            <Label>
              Link expires <span className="text-error-500">*</span>
            </Label>
            <input
              required
              type="datetime-local"
              value={toDatetimeLocal(form.expires_at)}
              onChange={(e) =>
                update("expires_at", e.target.value ? new Date(e.target.value).toISOString() : "")
              }
              className="h-11 w-full appearance-none rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm text-gray-800 shadow-theme-xs focus:border-brand-300 focus:ring-brand-500/20 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90"
            />
            <p className="mt-1 text-xs text-gray-400">
              After this moment the page stops accepting claims. Nothing needs to be switched off by
              hand.
            </p>
          </div>

          <div>
            <Label>Maximum certificates</Label>
            <Input
              type="number"
              min={1}
              value={form.max_claims}
              onChange={(e) => update("max_claims", e.target.value)}
              placeholder="Leave blank for unlimited"
            />
            <p className="mt-1 text-xs text-gray-400">
              Counts certificates issued through this link.
            </p>
          </div>

          <div>
            <Label>Date printed on the certificate</Label>
            <input
              type="date"
              value={form.certificate_date}
              onChange={(e) => update("certificate_date", e.target.value)}
              className="h-11 w-full appearance-none rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm text-gray-800 shadow-theme-xs focus:border-brand-300 focus:ring-brand-500/20 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90"
            />
            <p className="mt-1 text-xs text-gray-400">
              Set this to the event date. Leave blank to print the day each person claims.
            </p>
          </div>

          <div>
            <Label>Status</Label>
            <div className="space-y-2">
              {STATUS_OPTIONS.map((opt) => (
                <label
                  key={opt.value}
                  className="flex cursor-pointer items-start gap-3 rounded-lg border border-gray-200 p-3 dark:border-gray-800"
                >
                  <input
                    type="radio"
                    name="certificate-link-status"
                    className="mt-1"
                    checked={form.status === opt.value}
                    onChange={() => update("status", opt.value)}
                  />
                  <span>
                    <span className="block text-sm font-medium text-gray-800 dark:text-white/90">
                      {opt.label}
                    </span>
                    <span className="block text-xs text-gray-400">{opt.hint}</span>
                  </span>
                </label>
              ))}
            </div>
          </div>

          <div className="md:col-span-2">
            <Checkbox
              checked={form.send_email}
              onChange={(v) => update("send_email", v)}
              label="Email a copy of the certificate to each claimant"
            />
            <p className="mt-1 ml-8 text-xs text-gray-400">
              Sent once, on a person's first claim. The attached PDF is a plain text layout, not the
              designed certificate they download on the page.
            </p>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <Button type="submit" disabled={loading}>
          {loading ? "Saving…" : mode === "create" ? "Create link" : "Save changes"}
        </Button>
        <Link
          to="/certificate-links"
          className="inline-flex items-center justify-center rounded-lg border border-gray-300 px-4 py-3 text-sm font-medium text-gray-700 transition hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-white/[0.03]"
        >
          Cancel
        </Link>
      </div>
    </form>
  );
}
