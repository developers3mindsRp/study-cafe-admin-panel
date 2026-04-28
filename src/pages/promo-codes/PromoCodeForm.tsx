import { useState, useEffect, useCallback } from "react";
import { Link } from "react-router";
import Label from "../../components/form/Label";
import Input from "../../components/form/input/InputField";
import TextArea from "../../components/form/input/TextArea";
import Select from "../../components/form/Select";
import DatePicker from "../../components/form/date-picker";
import Button from "../../components/ui/button/Button";
import type {
  CouponFormData,
  CouponDiscountOn,
  CouponType,
  CouponStatus,
} from "../../types/promoCode";
import { COUPON_DISCOUNT_ON_OPTIONS } from "../../types/promoCode";
import { checkCouponCodeExists } from "../../api/promoCodes";

interface CouponFormProps {
  mode: "create" | "edit";
  defaultValues?: Partial<CouponFormData>;
  loading?: boolean;
  onSubmit: (data: CouponFormData) => void;
  excludeId?: string | number; // For edit mode, exclude this ID when checking code uniqueness
}

const emptyFormData: CouponFormData = {
  code: "",
  description: "",
  type: "Percentage",
  value: "0",
  min_order: "",
  max_discount: "",
  discount_on: "Membership Only",
  start_date: "",
  expire_date: "",
  status: "publish",
};

export default function CouponForm({
  mode,
  defaultValues,
  loading = false,
  onSubmit,
  excludeId,
}: CouponFormProps) {
  const [formData, setFormData] = useState<CouponFormData>(
    Object.assign({}, emptyFormData, defaultValues),
  );
  const [originalCode, setOriginalCode] = useState<string>(
    defaultValues?.code || "",
  );
  const [codeExists, setCodeExists] = useState(false);
  const [checkingCode, setCheckingCode] = useState(false);
  const [codeError, setCodeError] = useState<string | null>(null);

  // Update original code when defaultValues change (for edit mode)
  useEffect(() => {
    if (defaultValues?.code) {
      setOriginalCode(defaultValues.code);
    }
  }, [defaultValues?.code]);

  // Debounced function to check coupon code existence
  const checkCodeExistence = useCallback(
    async (code: string) => {
      if (!code.trim()) {
        setCodeExists(false);
        setCodeError(null);
        return;
      }

      setCheckingCode(true);
      try {
        const exists = await checkCouponCodeExists(code, excludeId);
        setCodeExists(exists);
        setCodeError(
          exists
            ? "This coupon code already exists. Please choose a different code."
            : null,
        );
      } catch (error) {
        console.error("Error checking coupon code:", error);
        setCodeExists(false);
        setCodeError(null);
      } finally {
        setCheckingCode(false);
      }
    },
    [excludeId],
  );

  // Debounced onKeyUp handler
  useEffect(() => {
    // Don't check if code is empty or same as original (for edit mode)
    if (
      !formData.code.trim() ||
      (mode === "edit" && formData.code === originalCode)
    ) {
      setCodeExists(false);
      setCodeError(null);
      setCheckingCode(false);
      return;
    }

    const timeoutId = setTimeout(() => {
      checkCodeExistence(formData.code);
    }, 500); // 500ms debounce

    return () => clearTimeout(timeoutId);
  }, [formData.code, checkCodeExistence, mode, originalCode]);

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

  const submitLabel = mode === "create" ? "Create Coupon" : "Update Coupon";

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] sm:p-6">
        <div className="space-y-4">
          <div>
            <Label>
              Coupon Code <span className="text-error-500">*</span>
            </Label>
            <div className="grid w-full gap-2 sm:grid-cols-12">
              <div className="sm:col-span-10">
                <Input
                  value={formData.code}
                  onChange={(e) => {
                    const value = e.target.value.replace(/\s/g, ""); // remove all spaces
                    setFormData((prev) => ({ ...prev, code: value }));
                  }}
                  placeholder="e.g. SPRING50"
                  className="w-full"
                  required
                />
                {/* {checkingCode && (
                  <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                    Checking code availability...
                  </p>
                )} */}
                {codeError && (
                  <p className="mt-1 text-xs text-error-500">{codeError}</p>
                )}
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
              placeholder="Optional details about the coupon"
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label>
                Coupon Type <span className="text-error-500">*</span>
              </Label>
              <Select
                options={[
                  { value: "Percentage", label: "Percentage" },
                  { value: "Amount", label: "Amount" },
                ]}
                placeholder="Select coupon type"
                defaultValue={formData.type}
                onChange={(value) =>
                  setFormData((prev) => ({
                    ...prev,
                    type: value as CouponType,
                    max_discount: value === "Amount" ? "" : prev.max_discount,
                  }))
                }
              />
            </div>

            <div>
              <Label>
                Discount On <span className="text-error-500">*</span>
              </Label>
              <Select
                options={COUPON_DISCOUNT_ON_OPTIONS.map((item) => ({
                  value: item.value,
                  label: item.label,
                }))}
                placeholder="Select discount target"
                defaultValue={formData.discount_on}
                onChange={(value) =>
                  setFormData((prev) => ({
                    ...prev,
                    discount_on: value as CouponDiscountOn,
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
                max={formData.type === "Percentage" ? 100 : undefined}
                value={formData.value}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    value: e.target.value,
                  }))
                }
                placeholder={formData.type === "Percentage" ? "e.g. 20" : "e.g. 500"}
              />
            </div>

            {formData.type === "Percentage" && (
              <div>
                <Label>Maximum Discount (₹)</Label>
                <Input
                  type="number"
                  min={0}
                  value={formData.max_discount}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      max_discount: e.target.value,
                    }))
                  }
                  placeholder="Optional cap (e.g. 500)"
                />
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  Optional cap on the rupee discount for percentage coupons. Empty means no extra cap beyond the order amount.
                </p>
              </div>
            )}

            <div>
              <Label>Minimum Order Value (optional)</Label>
              <Input
                type="number"
                min={0}
                value={formData.min_order}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    min_order: e.target.value,
                  }))
                }
                placeholder="e.g. 500"
              />
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                Optional minimum order value required to apply this coupon.
              </p>
            </div>

            <div>
              <Label>
                Start Date <span className="text-error-500">*</span>
              </Label>
              <DatePicker
                required
                id="coupon-start-date"
                placeholder="Select start date"
                defaultDate={formData.start_date || undefined}
                onChange={(_, dateStr) =>
                  setFormData((prev) => ({ ...prev, start_date: dateStr }))
                }
              />
            </div>

            <div>
              <Label>
                Expiry Date <span className="text-error-500">*</span>
              </Label>
              <DatePicker
                id="coupon-expire-date"
                placeholder="Select expiry date"
                defaultDate={formData.expire_date || undefined}
                minDate={formData.start_date || undefined}
                onChange={(_, dateStr) =>
                  setFormData((prev) => ({ ...prev, expire_date: dateStr }))
                }
              />
            </div>

            <div>
              <Label>Status</Label>
              <Select
                options={[
                  { value: "publish", label: "Publish" },
                  { value: "draft", label: "Draft" },
                ]}
                placeholder="Select status"
                defaultValue={formData.status}
                onChange={(value) =>
                  setFormData((prev) => ({
                    ...prev,
                    status: value as CouponStatus,
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
          disabled={loading || codeExists || checkingCode}
          className="inline-flex items-center justify-center gap-2 rounded-lg px-4 py-3 text-sm font-medium text-white transition bg-brand-500 shadow-theme-xs hover:bg-brand-600 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? "Saving..." : submitLabel}
        </button>
        <Link to="/coupons">
          <Button variant="outline" size="sm" disabled={loading}>
            Cancel
          </Button>
        </Link>
      </div>
    </form>
  );
}
