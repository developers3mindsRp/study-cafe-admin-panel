import { useEffect, useRef } from "react";
import flatpickr from "flatpickr";
import "flatpickr/dist/flatpickr.css";
import { twMerge } from "tailwind-merge";
import Label from "./Label";
import { CalenderIcon } from "../../icons";
import Hook = flatpickr.Options.Hook;
import DateOption = flatpickr.Options.DateOption;

type PropsType = {
  id: string;
  mode?: "single" | "multiple" | "range" | "time";
  onChange?: Hook | Hook[];
  /** Controlled value (Y-m-d). When cleared, the picker input is cleared too. */
  value?: string;
  defaultDate?: DateOption;
  minDate?: DateOption;
  maxDate?: DateOption;
  label?: string;
  /** Merged into the label element (e.g. compact filter bars). */
  labelClassName?: string;
  placeholder?: string;
  dateFormat?: string;
  required?: boolean;
  /** Extra classes on the input (merged with variant defaults). */
  inputClassName?: string;
  /** `filter` matches FilterBar select height, border, and padding. */
  variant?: "form" | "filter";
};

export default function DatePicker({
  id,
  mode,
  onChange,
  value,
  label,
  labelClassName,
  defaultDate,
  minDate,
  maxDate,
  placeholder,
  dateFormat = "Y-m-d",
  required = false,
  inputClassName,
  variant = "form",
}: PropsType) {
  /**
   * Keep onChange in a ref so flatpickr always calls the latest version
   * without the useEffect having to teardown and re-create the instance
   * on every parent render (which was clearing the selected date).
   */
  const onChangeRef = useRef<Hook | Hook[] | undefined>(onChange);
  const instanceRef = useRef<flatpickr.Instance | null>(null);
  useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);

  useEffect(() => {
    const flatPickr = flatpickr(`#${id}`, {
      mode: mode || "single",
      /** Inline calendar is clipped by overflow (e.g. orders filter row). */
      static: false,
      appendTo: document.body,
      monthSelectorType: "static",
      dateFormat,
      defaultDate,
      minDate,
      maxDate,
      onChange: (...args) => {
        const cb = onChangeRef.current;
        if (!cb) return;
        if (Array.isArray(cb)) cb.forEach((fn) => fn(...args));
        else cb(...args);
      },
      closeOnSelect: mode !== "range", // Stay open for range selection
      onReady: (_dates, _dateStr, instance) => {
        instance.calendarContainer.style.zIndex = "10050";
      },
    });

    instanceRef.current = Array.isArray(flatPickr) ? flatPickr[0] : flatPickr;

    return () => {
      instanceRef.current = null;
      if (!Array.isArray(flatPickr)) {
        flatPickr.destroy();
      }
    };
  }, [mode, id, defaultDate, minDate, maxDate, dateFormat]); // onChange intentionally excluded — handled via ref

  useEffect(() => {
    const fp = instanceRef.current;
    if (!fp) return;
    if (value === undefined) return;
    const next = value.trim();
    const current = fp.input.value.trim();
    if (next === current) return;
    if (!next) {
      fp.clear();
      return;
    }
    fp.setDate(next, false);
  }, [value]);

  const isFilter = variant === "filter";
  const resolvedInputClass = twMerge(
    isFilter
      ? "h-11 w-full min-w-0 rounded-lg border border-gray-200 bg-white px-3 pr-9 text-sm leading-normal text-gray-800 shadow-theme-xs placeholder:text-gray-500 transition focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20 dark:border-gray-700 dark:bg-gray-800 dark:text-white/90 dark:placeholder:text-gray-400"
      : "h-11 w-full rounded-lg border appearance-none px-4 py-2.5 text-sm shadow-theme-xs placeholder:text-gray-400 focus:outline-hidden focus:ring-3 bg-transparent text-gray-800 border-gray-300 focus:border-brand-300 focus:ring-brand-500/20 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30 dark:border-gray-700 dark:focus:border-brand-800",
    inputClassName,
  );

  return (
    <div className={label ? undefined : "w-full"}>
      {label && (
        <Label htmlFor={id} className={labelClassName}>
          {label}
        </Label>
      )}

      <div className="relative w-full">
        <input
          required={required}
          id={id}
          placeholder={placeholder}
          className={resolvedInputClass}
        />

        <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 dark:text-gray-400">
          <CalenderIcon className={isFilter ? "size-5" : "size-6"} />
        </span>
      </div>
    </div>
  );
}
