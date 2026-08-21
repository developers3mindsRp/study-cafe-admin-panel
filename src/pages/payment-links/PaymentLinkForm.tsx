import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router";
import Label from "../../components/form/Label";
import Input from "../../components/form/input/InputField";
import Button from "../../components/ui/button/Button";
import RichTextEditor from "../../components/form/RichTextEditor";
import SearchableSelect from "../../components/form/SearchableSelect";
import type {
  PaymentLinkFormValues,
  PaymentLinkProductType,
  PaymentLinkStatus,
} from "../../types/paymentLink";
import { slugifyForSeo, shouldResyncSlugFromSource } from "../../lib/slug";
import { fetchCourses, fetchBatchesList, type Course, type BatchRecordWithCourse } from "../../api/courses";
import { plansApi, type Plan } from "../../api/plans";

const empty: PaymentLinkFormValues = {
  title: "",
  slug: "",
  description: "",
  amount: "",
  sale_price: "",
  expiry: "",
  total_seats: "",
  random_value: "",
  random_boost_accumulator: "0",
  status: "draft",
  product_type: "custom",
  product_id: "",
  batch_id: "",
  auto_enroll: true,
};

const PRODUCT_TYPE_OPTIONS: { value: PaymentLinkProductType; label: string; hint: string }[] = [
  {
    value: "custom",
    label: "Nothing (collect payment only)",
    hint: "Money is recorded against the link. You assign access by hand, as before.",
  },
  {
    value: "course",
    label: "A course",
    hint: "The buyer is enrolled in the course the moment payment succeeds.",
  },
  {
    value: "membership",
    label: "A membership plan",
    hint: "The plan and every course it bundles are granted the moment payment succeeds.",
  },
];

function priceOf(value: unknown): string {
  const n = typeof value === "string" ? parseFloat(value) : Number(value);
  return Number.isFinite(n) && n > 0 ? String(n) : "";
}

function toDatetimeLocal(iso?: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

interface Props {
  mode: "create" | "edit";
  defaultValues?: Partial<PaymentLinkFormValues>;
  loading?: boolean;
  /** Paid orders from `orders` table (same number shown to visitors as "booked", before random boost). */
  paidOrdersCount?: number;
  onSubmit: (data: PaymentLinkFormValues) => void;
}

export default function PaymentLinkForm({
  mode,
  defaultValues,
  loading = false,
  paidOrdersCount,
  onSubmit,
}: Props) {
  const [form, setForm] = useState<PaymentLinkFormValues>({ ...empty, ...defaultValues });

  const defaultValuesKey = useMemo(
    () => (defaultValues ? JSON.stringify(defaultValues) : ""),
    [defaultValues],
  );

  useEffect(() => {
    if (!defaultValuesKey) return;
    setForm({ ...empty, ...JSON.parse(defaultValuesKey) as PaymentLinkFormValues });
  }, [defaultValuesKey]);

  const update = <K extends keyof PaymentLinkFormValues>(key: K, value: PaymentLinkFormValues[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const paymentLinkSlug = (rawTitle: string) =>
    slugifyForSeo(rawTitle) || "payment-link";

  // ─── What this link sells ──────────────────────────────────────────────────
  const [courses, setCourses] = useState<Course[]>([]);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [batches, setBatches] = useState<BatchRecordWithCourse[]>([]);
  const [catalogError, setCatalogError] = useState<string | null>(null);

  // Both lists load once up front: an admin switching between "a course" and "a
  // membership plan" should not sit through a fetch each time they change their mind.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [courseRows, planRes] = await Promise.all([fetchCourses(), plansApi.list()]);
        if (cancelled) return;
        setCourses(Array.isArray(courseRows) ? courseRows : []);
        const planRows = planRes.data;
        setPlans(Array.isArray(planRows) ? planRows : []);
      } catch {
        if (!cancelled) setCatalogError("Could not load courses and plans. Reload to try again.");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const courseIdForBatches = form.product_type === "course" ? Number(form.product_id) : NaN;

  useEffect(() => {
    if (!Number.isFinite(courseIdForBatches) || courseIdForBatches <= 0) {
      setBatches([]);
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const { rows } = await fetchBatchesList({ courseId: courseIdForBatches, limit: 100 });
        if (!cancelled) setBatches(Array.isArray(rows) ? rows : []);
      } catch {
        if (!cancelled) setBatches([]);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [courseIdForBatches]);

  const courseOptions = useMemo(
    () => courses.map((c) => ({ value: String(c.id), text: c.title })),
    [courses],
  );
  const planOptions = useMemo(
    () => plans.map((p) => ({ value: String(p.id), text: p.name })),
    [plans],
  );
  const batchOptions = useMemo(
    () => [
      { value: "", text: "Auto — pick the current purchase batch" },
      ...batches.map((b) => ({
        value: String(b.id),
        text: b.start_date ? `${b.name} (starts ${b.start_date.slice(0, 10)})` : b.name,
      })),
    ],
    [batches],
  );

  const selectedCourse = useMemo(
    () => courses.find((c) => String(c.id) === form.product_id) || null,
    [courses, form.product_id],
  );
  const selectedPlan = useMemo(
    () => plans.find((p) => String(p.id) === form.product_id) || null,
    [plans, form.product_id],
  );

  /** Switching what's being sold clears the id/batch, so a stale course can't linger. */
  const changeProductType = (next: PaymentLinkProductType) => {
    setForm((prev) =>
      prev.product_type === next ? prev : { ...prev, product_type: next, product_id: "", batch_id: "" },
    );
  };

  /** Copy the product's own pricing across so the admin only edits the discount. */
  const applyProductPricing = () => {
    const mrp = selectedCourse
      ? priceOf(selectedCourse.price)
      : selectedPlan
        ? priceOf(selectedPlan.price)
        : "";
    const sale = selectedCourse ? priceOf(selectedCourse.sale_price) || mrp : mrp;
    if (!mrp && !sale) return;
    setForm((prev) => ({ ...prev, amount: mrp || prev.amount, sale_price: sale || prev.sale_price }));
  };

  const productMissing = form.product_type !== "custom" && !form.product_id;

  return (
    <form
      className="space-y-6"
      onSubmit={(e) => {
        e.preventDefault();
        if (productMissing) {
          alert(
            form.product_type === "course"
              ? "Pick the course this link sells, or switch it to payment-only."
              : "Pick the membership plan this link sells, or switch it to payment-only.",
          );
          return;
        }
        const slug = form.slug.trim()
          ? slugifyForSeo(form.slug)
          : paymentLinkSlug(form.title);
        onSubmit({ ...form, slug: slug || "payment-link" });
      }}
    >
      {/* Basic section */}
      <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] sm:p-6">
        <h3 className="mb-4 text-lg font-semibold text-gray-800 dark:text-white/90">Basic</h3>
        <div className="grid gap-4">
          <div>
            <Label>
              Title <span className="text-error-500">*</span>
            </Label>
            <Input
              required
              value={form.title}
              onChange={(e) => {
                const v = e.target.value;
                setForm((prev) => {
                  const keepSync = shouldResyncSlugFromSource(
                    prev.slug,
                    prev.title,
                    paymentLinkSlug,
                  );
                  return {
                    ...prev,
                    title: v,
                    slug: keepSync ? paymentLinkSlug(v) : prev.slug,
                  };
                });
              }}
              placeholder="Payment title"
            />
          </div>
          <div>
            <Label>Slug</Label>
            <Input
              value={form.slug}
              onChange={(e) => update("slug", e.target.value)}
              onBlur={() =>
                setForm((prev) => ({
                  ...prev,
                  slug: slugifyForSeo(prev.slug),
                }))
              }
              placeholder="url-slug (auto from title if empty)"
            />
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              Public URL: /payment-links/your-slug
            </p>
          </div>
          <div>
            <Label>Description (HTML supported)</Label>
            <div className="mt-2 rounded-lg border border-gray-300 dark:border-gray-700 overflow-hidden rich-text-editor-content">
              <RichTextEditor
                value={form.description}
                onChange={(html) => update("description", html)}
                placeholder="Describe this offer…"
                minHeight={200}
              />
            </div>
          </div>
        </div>
      </div>

      {/* What the buyer gets — drives automatic enrolment after payment */}
      <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] sm:p-6">
        <h3 className="mb-1 text-lg font-semibold text-gray-800 dark:text-white/90">
          What does this link sell?
        </h3>
        <p className="mb-4 text-sm text-gray-500 dark:text-gray-400">
          Pick a course or plan and the buyer is enrolled automatically the moment they pay — no manual
          assignment afterwards.
        </p>

        {catalogError && <p className="mb-3 text-sm text-error-500">{catalogError}</p>}

        <div className="grid gap-3">
          {PRODUCT_TYPE_OPTIONS.map((opt) => (
            <label
              key={opt.value}
              className={`flex cursor-pointer gap-3 rounded-lg border p-3 transition ${
                form.product_type === opt.value
                  ? "border-brand-500 bg-brand-50 dark:border-brand-500 dark:bg-brand-500/10"
                  : "border-gray-200 hover:border-gray-300 dark:border-gray-700 dark:hover:border-gray-600"
              }`}
            >
              <input
                type="radio"
                name="product_type"
                className="mt-1 shrink-0"
                value={opt.value}
                checked={form.product_type === opt.value}
                onChange={() => changeProductType(opt.value)}
              />
              <span>
                <span className="block text-sm font-medium text-gray-800 dark:text-white/90">{opt.label}</span>
                <span className="block text-xs text-gray-500 dark:text-gray-400">{opt.hint}</span>
              </span>
            </label>
          ))}
        </div>

        {form.product_type !== "custom" && (
          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            <div>
              <Label>
                {form.product_type === "course" ? "Course" : "Membership plan"}{" "}
                <span className="text-error-500">*</span>
              </Label>
              <SearchableSelect
                options={form.product_type === "course" ? courseOptions : planOptions}
                value={form.product_id}
                onChange={(v) => setForm((prev) => ({ ...prev, product_id: v, batch_id: "" }))}
                placeholder={form.product_type === "course" ? "Select a course" : "Select a plan"}
                searchPlaceholder="Type to search…"
                emptyMessage={
                  form.product_type === "course" ? "No courses found." : "No plans found."
                }
              />
              {productMissing && (
                <p className="mt-1 text-xs text-error-500">
                  Required — the link cannot enrol anyone without it.
                </p>
              )}
              {(selectedCourse || selectedPlan) && (
                <button
                  type="button"
                  onClick={applyProductPricing}
                  className="mt-2 text-xs font-medium text-brand-500 hover:underline"
                >
                  Use this {form.product_type === "course" ? "course" : "plan"}&rsquo;s pricing
                </button>
              )}
            </div>

            {form.product_type === "course" && (
              <div>
                <Label>Batch</Label>
                <SearchableSelect
                  options={batchOptions}
                  value={form.batch_id}
                  onChange={(v) => update("batch_id", v)}
                  placeholder="Auto — pick the current purchase batch"
                  searchPlaceholder="Search batches…"
                  emptyMessage="No batches for this course."
                  disabled={!form.product_id}
                />
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  Leave on Auto unless this link is for one specific cohort — Auto follows the same rule as a
                  normal course checkout.
                </p>
              </div>
            )}

            <div className="sm:col-span-2">
              <label className="flex cursor-pointer items-start gap-2">
                <input
                  type="checkbox"
                  className="mt-1 shrink-0"
                  checked={form.auto_enroll}
                  onChange={(e) => update("auto_enroll", e.target.checked)}
                />
                <span>
                  <span className="block text-sm font-medium text-gray-800 dark:text-white/90">
                    Grant access automatically on payment
                  </span>
                  <span className="block text-xs text-gray-500 dark:text-gray-400">
                    Turn off to record the sale but hold the enrolment for manual review. Leave on for the
                    fastest path from payment to first lesson.
                  </span>
                </span>
              </label>
            </div>
          </div>
        )}
      </div>

      {/* Pricing & seats section — strict 2-column grid */}
      <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] sm:p-6">
        <h3 className="mb-4 text-lg font-semibold text-gray-800 dark:text-white/90">Pricing &amp; seats</h3>
        <div className="grid gap-4 sm:grid-cols-2">

          {/* Row 1: Amount (MRP) | Sale price */}
          <div>
            <Label>
              Amount (MRP) <span className="text-error-500">*</span>
            </Label>
            <Input
              required
              type="number"
              min={0}
              step="0.01"
              value={form.amount}
              onChange={(e) => update("amount", e.target.value)}
            />
          </div>
          <div>
            <Label>
              Sale price <span className="text-error-500">*</span>
            </Label>
            <Input
              required
              type="number"
              min={0}
              step="0.01"
              value={form.sale_price}
              onChange={(e) => update("sale_price", e.target.value)}
            />
          </div>

          {/* Row 2: Expiry | Total seats */}
          <div>
            <Label>
              Expiry <span className="text-error-500">*</span>
            </Label>
            <input
              required
              type="datetime-local"
              value={toDatetimeLocal(form.expiry)}
              onChange={(e) => update("expiry", e.target.value ? new Date(e.target.value).toISOString() : "")}
              className="h-11 w-full rounded-lg border appearance-none px-4 py-2.5 text-sm shadow-theme-xs bg-transparent text-gray-800 border-gray-300 focus:border-brand-300 focus:ring-brand-500/20 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90"
            />
          </div>
          <div>
            <Label>
              Total seats <span className="text-error-500">*</span>
            </Label>
            <Input
              required
              type="number"
              min={0}
              value={form.total_seats}
              onChange={(e) => update("total_seats", e.target.value)}
            />
            <p className="mt-1 text-xs text-gray-500">Use 0 for unlimited capacity.</p>
          </div>

          {/* Row 3: Random value | Boost accumulator start value */}
          <div>
            <Label>Random value</Label>
            <Input
              value={form.random_value}
              onChange={(e) => update("random_value", e.target.value)}
              placeholder="e.g. 1-3 or 0-3"
            />
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              On each checkout page load, the visible &ldquo;sold&rdquo; count increases by a random whole number
              between the min and max you set (e.g. 1–3 adds 1, 2, or 3 per reload). Stops once it reaches total
              seats. Changing this or total seats resets the boost to zero.
            </p>
          </div>
          <div>
            <Label>Boost accumulator start value</Label>
            <Input
              type="number"
              min={0}
              step={1}
              value={form.random_boost_accumulator}
              onChange={(e) => update("random_boost_accumulator", e.target.value)}
              placeholder="0"
            />
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              Sets the initial starting value of the random boost counter. Visitors see: paid orders + this value +
              future increments (capped by total seats). Leave unchanged when saving other fields — only edit this
              when you want to set a new start value. Changing Random value or Total seats resets this (or uses the
              value you enter here in the same save).
            </p>
          </div>

          {/* Row 4: Paid orders | Status */}
          <div>
            <Label>Paid orders (completed checkouts)</Label>
            <div className="mt-1 flex h-11 items-center rounded-lg border border-gray-200 bg-gray-50 px-4 text-sm font-semibold text-gray-800 dark:border-gray-700 dark:bg-white/[0.04] dark:text-white/90">
              {mode === "edit" && typeof paidOrdersCount === "number" ? paidOrdersCount : 0}
            </div>
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              From successful payments only. Cannot be edited.
            </p>
          </div>
          <div>
            <Label>Status</Label>
            <select
              value={form.status}
              onChange={(e) => update("status", e.target.value as PaymentLinkStatus)}
              className="h-11 w-full rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm shadow-theme-xs text-gray-800 focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90"
            >
              <option value="draft">Draft</option>
              <option value="publish">Published</option>
            </select>
          </div>

        </div>
      </div>

      <div className="flex flex-wrap gap-3">
        <Button type="submit" disabled={loading}>
          {loading ? "Saving…" : mode === "create" ? "Create" : "Save changes"}
        </Button>
        <Link to="/payment-links">
          <Button type="button" variant="outline">
            Cancel
          </Button>
        </Link>
      </div>
    </form>
  );
}
