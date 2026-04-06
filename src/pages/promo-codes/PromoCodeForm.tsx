import { useState } from "react";
import { Link } from "react-router";
import Label from "../../components/form/Label";
import Input from "../../components/form/input/InputField";
import TextArea from "../../components/form/input/TextArea";
import Select from "../../components/form/Select";
import DatePicker from "../../components/form/date-picker";
import Button from "../../components/ui/button/Button";
import type {
  PromoCodeFormData,
  PromoCodeTargetType,
} from "../../types/promoCode";
import { PROMO_CODE_TARGET_TYPES } from "../../types/promoCode";

interface PromoCodeFormProps {
  mode: "create" | "edit";
  defaultValues?: Partial<PromoCodeFormData>;
  loading?: boolean;
  onSubmit: (data: PromoCodeFormData) => void;
}

const emptyFormData: PromoCodeFormData = {
  code: "",
  description: "",
  discount_type: "percentage",
  discount_value: "0",
  max_discount_amount: "",
  min_cart_value: "",
  target_type: "membership_plans",
  active: true,
  valid_from: "",
  valid_to: "",
  usage_limit: "",
};

export default function PromoCodeForm({
  mode,
  defaultValues,
  loading = false,
  onSubmit,
}: PromoCodeFormProps) {
  const [formData, setFormData] = useState<PromoCodeFormData>({
    ...emptyFormData,
    ...defaultValues,
  });

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    onSubmit(formData);
  };

  const generateRandomCode = (length = 10) => {
    const characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    const randomCode = Array.from({ length }, () =>
      characters.charAt(Math.floor(Math.random() * characters.length)),
    ).join("");

    setFormData((prev) => ({ ...prev, code: randomCode }));
  };

  const submitLabel =
    mode === "create" ? "Create Promo Code" : "Update Promo Code";

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] sm:p-6">
        <div className="space-y-4">
          <div>
            <Label>
              Promo Code <span className="text-error-500">*</span>
            </Label>
            <div className="grid w-full gap-2 sm:grid-cols-12">
              <div className="sm:col-span-10">
                <Input
                  value={formData.code}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, code: e.target.value }))
                  }
                  placeholder="e.g. SPRING50"
                  className="w-full"
                  required
                />
              </div>
              <div className="sm:col-span-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="w-full"
                  onClick={() => generateRandomCode()}
                >
                  Generate Code
                </Button>
              </div>
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
              placeholder="Optional details about the promo code"
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label>
                Discount Type <span className="text-error-500">*</span>
              </Label>
              <Select
                options={[
                  { value: "percentage", label: "Percentage" },
                  { value: "fixed", label: "Fixed Amount" },
                ]}
                placeholder="Select discount type"
                defaultValue={formData.discount_type}
                onChange={(value) =>
                  setFormData((prev) => ({
                    ...prev,
                    discount_type: value as "percentage" | "fixed",
                  }))
                }
              />
            </div>

            <div>
              <Label>
                Promo Target <span className="text-error-500">*</span>
              </Label>
              <Select
                options={PROMO_CODE_TARGET_TYPES.map((item) => ({
                  value: item.value,
                  label: item.label,
                }))}
                placeholder="Select promo target"
                defaultValue={formData.target_type}
                onChange={(value) =>
                  setFormData((prev) => ({
                    ...prev,
                    target_type: value as PromoCodeTargetType,
                  }))
                }
              />
            </div>

            <div>
              <Label>
                Discount Value <span className="text-error-500">*</span>
              </Label>
              <Input
                required
                type="number"
                min={0}
                value={formData.discount_value}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    discount_value: e.target.value,
                  }))
                }
                placeholder="e.g. 20"
              />
            </div>

            {formData.discount_type === "percentage" && (
              <div>
                <Label>Maximum Discount Amount (optional)</Label>
                <Input
                  type="number"
                  min={0}
                  value={formData.max_discount_amount}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      max_discount_amount: e.target.value,
                    }))
                  }
                  placeholder="e.g. 100"
                />
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  Optional cap for percentage discounts. Leave empty for no cap.
                </p>
              </div>
            )}

            <div>
              <Label>Minimum Cart Value (optional)</Label>
              <Input
                type="number"
                min={0}
                value={formData.min_cart_value}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    min_cart_value: e.target.value,
                  }))
                }
                placeholder="e.g. 500"
              />
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                Optional minimum cart value required to apply this promo code.
              </p>
            </div>

            <div>
              <Label>
                Valid From <span className="text-error-500">*</span>
              </Label>
              <DatePicker
              required
                id="promo-valid-from"
                placeholder="Select start date"
                defaultDate={formData.valid_from || undefined}
                onChange={(_, dateStr) =>
                  setFormData((prev) => {
                    const next = { ...prev, valid_from: dateStr };
                    if (prev.valid_to && dateStr && prev.valid_to < dateStr) {
                      next.valid_to = dateStr;
                    }
                    return next;
                  })
                }
              />
            </div>

            <div>
              <Label>
                Valid To <span className="text-error-500">*</span>
              </Label>
              <DatePicker
                id="promo-valid-to"
                placeholder="Select end date"
                defaultDate={formData.valid_to || undefined}
                minDate={formData.valid_from || undefined}
                onChange={(_, dateStr) =>
                  setFormData((prev) => ({ ...prev, valid_to: dateStr }))
                }
              />
            </div>

            <div>
              <Label>Usage Limit</Label>
              <Input
                type="number"
                min={0}
                value={formData.usage_limit}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    usage_limit: e.target.value,
                  }))
                }
                placeholder="e.g. 100"
              />
            </div>

            <div>
              <Label>Status</Label>
              <Select
                options={[
                  { value: "active", label: "Active" },
                  { value: "inactive", label: "Inactive" },
                ]}
                placeholder="Select status"
                defaultValue={formData.active ? "active" : "inactive"}
                onChange={(value) =>
                  setFormData((prev) => ({
                    ...prev,
                    active: value === "active",
                  }))
                }
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
        <Link to="/promo-codes">
          <Button variant="outline" size="sm" disabled={loading}>
            Cancel
          </Button>
        </Link>
      </div>
    </form>
  );
}
