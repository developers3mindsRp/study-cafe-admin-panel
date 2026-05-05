import { useEffect, useState } from "react";
import { Link } from "react-router";
import Label from "../../components/form/Label";
import Input from "../../components/form/input/InputField";
import Button from "../../components/ui/button/Button";
import RichTextEditor from "../../components/form/RichTextEditor";
import type { PaymentLinkFormValues, PaymentLinkStatus } from "../../types/paymentLink";

const empty: PaymentLinkFormValues = {
  title: "",
  slug: "",
  description: "",
  amount: "",
  sale_price: "",
  expiry: "",
  total_seats: "",
  random_value: "",
  status: "draft",
};

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
  /** Paid orders from `orders` table (same number shown to visitors as “booked”, before random boost). */
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
  const [slugManual, setSlugManual] = useState(mode === "edit");

  useEffect(() => {
    setForm({ ...empty, ...defaultValues });
  }, [defaultValues]);

  const update = <K extends keyof PaymentLinkFormValues>(key: K, value: PaymentLinkFormValues[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const slugify = (t: string) =>
    t
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "") || "payment-link";

  return (
    <form
      className="space-y-6"
      onSubmit={(e) => {
        e.preventDefault();
        const slug = form.slug.trim() ? slugify(form.slug) : slugify(form.title);
        onSubmit({ ...form, slug });
      }}
    >
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
                update("title", v);
                if (!slugManual && mode === "create") {
                  update("slug", slugify(v));
                }
              }}
              placeholder="Payment title"
            />
          </div>
          <div>
            <Label>Slug</Label>
            <Input
              value={form.slug}
              onChange={(e) => {
                setSlugManual(true);
                update("slug", e.target.value);
              }}
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

      <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] sm:p-6">
        <h3 className="mb-4 text-lg font-semibold text-gray-800 dark:text-white/90">Pricing & seats</h3>
        <div className="grid gap-4 sm:grid-cols-2">
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
          <div className="sm:col-span-2">
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
          <div>
            <Label>Paid orders (completed checkouts)</Label>
            <div className="mt-1 flex h-11 items-center rounded-lg border border-gray-200 bg-gray-50 px-4 text-sm font-semibold text-gray-800 dark:border-gray-700 dark:bg-white/[0.04] dark:text-white/90">
              {mode === "edit" && typeof paidOrdersCount === "number" ? paidOrdersCount : 0}
            </div>
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              This count comes from successful payments only. Visitors see this number plus the random boost (capped by
              total seats). It cannot be edited.
            </p>
          </div>
          <div>
            <Label>Random value</Label>
            <Input
              value={form.random_value}
              onChange={(e) => update("random_value", e.target.value)}
              placeholder="e.g. 1-3 or 0-3"
            />
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              On each checkout page load, the visible “sold” count increases by a random whole number between the min and
              max you set (e.g. 1–3 adds 1, 2, or 3 per reload). Stops increasing once it reaches total seats. Changing
              this field or total seats resets the extra boost to zero.
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
