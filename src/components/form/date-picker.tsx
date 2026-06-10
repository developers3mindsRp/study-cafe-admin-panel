import { useEffect, useRef } from "react";
import flatpickr from "flatpickr";
import "flatpickr/dist/flatpickr.css";
import Label from "./Label";
import { CalenderIcon } from "../../icons";
import Hook = flatpickr.Options.Hook;
import DateOption = flatpickr.Options.DateOption;

type PropsType = {
  id: string;
  mode?: "single" | "multiple" | "range" | "time";
  onChange?: Hook | Hook[];
  defaultDate?: DateOption;
  minDate?: DateOption;
  maxDate?: DateOption;
  label?: string;
  /** Merged into the label element (e.g. compact filter bars). */
  labelClassName?: string;
  placeholder?: string;
  dateFormat?: string;
  required?: boolean;
};

export default function DatePicker({
  id,
  mode,
  onChange,
  label,
  labelClassName,
  defaultDate,
  minDate,
  maxDate,
  placeholder,
  dateFormat = "Y-m-d",
  required = false,
}: PropsType) {
  /**
   * Keep onChange in a ref so flatpickr always calls the latest version
   * without the useEffect having to teardown and re-create the instance
   * on every parent render (which was clearing the selected date).
   */
  const onChangeRef = useRef<Hook | Hook[] | undefined>(onChange);
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

    return () => {
      if (!Array.isArray(flatPickr)) {
        flatPickr.destroy();
      }
    };
  }, [mode, id, defaultDate, minDate, maxDate, dateFormat]); // onChange intentionally excluded — handled via ref

  return (
    <div>
      {label && (
        <Label htmlFor={id} className={labelClassName}>
          {label}
        </Label>
      )}

      <div className="relative">
        <input
          required={required}
          id={id}
          placeholder={placeholder}
          className="h-11 w-full rounded-lg border appearance-none px-4 py-2.5 text-sm shadow-theme-xs placeholder:text-gray-400 focus:outline-hidden focus:ring-3  dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30  bg-transparent text-gray-800 border-gray-300 focus:border-brand-300 focus:ring-brand-500/20 dark:border-gray-700  dark:focus:border-brand-800"
        />

        <span className="absolute text-gray-500 -translate-y-1/2 pointer-events-none right-3 top-1/2 dark:text-gray-400">
          <CalenderIcon className="size-6" />
        </span>
      </div>
    </div>
  );
}
