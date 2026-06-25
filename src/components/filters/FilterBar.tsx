import { useEffect, useState } from "react";
import type { FilterFieldDef, FilterValues, SelectOption } from "./filter.types";
import DatePicker from "../form/date-picker";

export interface FilterBarProps {
  fields: FilterFieldDef[];
  values: FilterValues;
  onChange: (id: string, value: string) => void;
  onReset: () => void;
  hasActive: boolean;
  className?: string;
  /** Extra controls (e.g. Export) shown at the end of the filter row. */
  actions?: React.ReactNode;
  /**
   * Increment this value to force date-range pickers to reset their UI
   * (e.g. after calling onReset). Pass the same counter you use to clear
   * filter state so the calendar clears in sync.
   */
  resetKey?: number;
}

const labelClass = "text-xs font-medium text-gray-600 dark:text-gray-400";

/** Shared height, border, and padding for every filter control. */
const filterControlClass =
  "h-11 w-full min-w-0 rounded-lg border border-gray-200 bg-white px-3 text-sm leading-normal text-gray-800 shadow-theme-xs transition placeholder:text-gray-500 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20 dark:border-gray-700 dark:bg-gray-800 dark:text-white/90 dark:placeholder:text-gray-400";

const selectClass = `${filterControlClass} appearance-none pr-8`;

const inputClass = filterControlClass;

/** Uniform filter field column — label + control stack. */
const filterFieldClass = "flex min-w-[160px] shrink-0 flex-col gap-1.5";

/** Formats a Date using local calendar date (YYYY-MM-DD), avoiding UTC timezone shift. */
function localDateString(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

// ─── Individual field renderers ───────────────────────────────────────────────

function SelectField({
  field,
  value,
  onChange,
}: {
  field: Extract<FilterFieldDef, { type: "select" }>;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className={filterFieldClass}>
      <label htmlFor={`filter-${field.id}`} className={labelClass}>
        {field.label}
      </label>
      <select
        id={`filter-${field.id}`}
        className={selectClass}
        value={value}
        onChange={(e) => onChange(e.target.value)}
      >
        <option value="">{field.placeholder ?? `All ${field.label.toLowerCase()}s`}</option>
        {field.options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </div>
  );
}

function AsyncSelectField({
  field,
  value,
  onChange,
}: {
  field: Extract<FilterFieldDef, { type: "async-select" }>;
  value: string;
  onChange: (v: string) => void;
}) {
  const [options, setOptions] = useState<SelectOption[]>([]);

  useEffect(() => {
    let cancelled = false;
    field.loader().then((opts) => {
      if (!cancelled) setOptions(opts);
    }).catch(() => {
      if (!cancelled) setOptions([]);
    });
    return () => {
      cancelled = true;
    };
  }, [field]);

  return (
    <div className={`${filterFieldClass} min-w-[180px]`}>
      <label htmlFor={`filter-${field.id}`} className={labelClass}>
        {field.label}
      </label>
      <select
        id={`filter-${field.id}`}
        className={selectClass}
        value={value}
        onChange={(e) => onChange(e.target.value)}
      >
        <option value="">{field.placeholder ?? `All ${field.label.toLowerCase()}s`}</option>
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </div>
  );
}

function DateRangeField({
  field,
  onChange,
  resetKey = 0,
}: {
  field: Extract<FilterFieldDef, { type: "date-range" }>;
  values: FilterValues;
  onChange: (id: string, v: string) => void;
  resetKey?: number;
}) {
  const fromId = field.fromId ?? `${field.id}_from`;
  const toId = field.toId ?? `${field.id}_to`;

  return (
    <div className={`${filterFieldClass} min-w-[13rem]`}>
      <label htmlFor={`filter-daterange-${field.id}`} className={labelClass}>
        {field.label}
      </label>
      <DatePicker
        key={`filter-daterange-${field.id}-${resetKey}`}
        id={`filter-daterange-${field.id}`}
        mode="range"
        variant="filter"
        placeholder="Select date range"
        onChange={(dates) => {
          if (dates.length === 2) {
            const [start, end] = dates;
            onChange(fromId, start ? localDateString(start) : "");
            onChange(toId, end ? localDateString(end) : "");
          } else if (dates.length === 0) {
            onChange(fromId, "");
            onChange(toId, "");
          }
        }}
      />
    </div>
  );
}

function TextField({
  field,
  value,
  onChange,
}: {
  field: Extract<FilterFieldDef, { type: "text" }>;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className={filterFieldClass}>
      <label htmlFor={`filter-${field.id}`} className={labelClass}>
        {field.label}
      </label>
      <input
        id={`filter-${field.id}`}
        type="text"
        className={inputClass}
        value={value}
        placeholder={field.placeholder ?? ""}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  );
}

function MonthSelectField({
  field,
  value,
  onChange,
  resetKey = 0,
}: {
  field: Extract<FilterFieldDef, { type: "month-select" }>;
  value: string;
  onChange: (id: string, v: string) => void;
  resetKey?: number;
}) {
  const fromId = field.fromId ?? `${field.id}_from`;
  const toId = field.toId ?? `${field.id}_to`;

  const handleChange = (monthValue: string) => {
    if (!monthValue) {
      onChange(fromId, "");
      onChange(toId, "");
      return;
    }
    const [year, month] = monthValue.split("-").map(Number);
    const from = new Date(year, month - 1, 1);
    const to = new Date(year, month, 0);
    const pad = (n: number) => String(n).padStart(2, "0");
    onChange(fromId, `${from.getFullYear()}-${pad(from.getMonth() + 1)}-${pad(from.getDate())}`);
    onChange(toId, `${to.getFullYear()}-${pad(to.getMonth() + 1)}-${pad(to.getDate())}`);
  };

  return (
    <div key={resetKey} className={filterFieldClass}>
      <label htmlFor={`filter-${field.id}`} className={labelClass}>
        {field.label}
      </label>
      <input
        key={`month-${field.id}-${resetKey}`}
        id={`filter-${field.id}`}
        type="month"
        className={inputClass}
        defaultValue={value}
        onChange={(e) => handleChange(e.target.value)}
      />
    </div>
  );
}

function DateSplitField({
  field,
  values,
  onChange,
  resetKey = 0,
}: {
  field: Extract<FilterFieldDef, { type: "date-split" }>;
  values: FilterValues;
  onChange: (id: string, v: string) => void;
  resetKey?: number;
}) {
  const fromId = field.fromId ?? `${field.id}From`;
  const toId = field.toId ?? `${field.id}To`;
  const fromLabel = field.fromLabel ?? "From";
  const toLabel = field.toLabel ?? "To";

  return (
    <div className="flex flex-wrap items-end gap-3">
      <div className={`${filterFieldClass} min-w-[11rem]`}>
        <span className={labelClass}>{field.label} — {fromLabel}</span>
        <DatePicker
          key={`filter-split-from-${field.id}-${resetKey}`}
          id={`filter-split-from-${field.id}`}
          mode="single"
          variant="filter"
          placeholder={`${fromLabel} date`}
          defaultDate={values[fromId] || undefined}
          onChange={(dates) => {
            onChange(fromId, dates[0] ? localDateString(dates[0]) : "");
          }}
        />
      </div>
      <div className={`${filterFieldClass} min-w-[11rem]`}>
        <span className={labelClass}>{field.label} — {toLabel}</span>
        <DatePicker
          key={`filter-split-to-${field.id}-${resetKey}`}
          id={`filter-split-to-${field.id}`}
          mode="single"
          variant="filter"
          placeholder={`${toLabel} date`}
          defaultDate={values[toId] || undefined}
          onChange={(dates) => {
            onChange(toId, dates[0] ? localDateString(dates[0]) : "");
          }}
        />
      </div>
    </div>
  );
}

function DateField({
  field,
  value,
  onChange,
  resetKey = 0,
}: {
  field: Extract<FilterFieldDef, { type: "date" }>;
  value: string;
  onChange: (v: string) => void;
  resetKey?: number;
}) {
  return (
    <div className={filterFieldClass}>
      <label htmlFor={`filter-${field.id}`} className={labelClass}>
        {field.label}
      </label>
      <DatePicker
        key={`filter-date-${field.id}-${resetKey}`}
        id={`filter-date-${field.id}`}
        mode="single"
        variant="filter"
        placeholder={field.placeholder ?? "Select date"}
        defaultDate={value || undefined}
        onChange={(dates) => {
          onChange(dates[0] ? localDateString(dates[0]) : "");
        }}
      />
    </div>
  );
}

function NumberRangeField({
  field,
  values,
  onChange,
}: {
  field: Extract<FilterFieldDef, { type: "number-range" }>;
  values: FilterValues;
  onChange: (id: string, v: string) => void;
}) {
  const minId = field.minId ?? `${field.id}_min`;
  const maxId = field.maxId ?? `${field.id}_max`;

  return (
    <div className={`${filterFieldClass} min-w-0`}>
      <span className={labelClass}>{field.label}</span>
      <div className="flex h-11 items-center gap-2">
        <input
          id={`filter-${minId}`}
          type="number"
          min={0}
          className={`${inputClass} w-28`}
          value={values[minId] ?? ""}
          placeholder="Min"
          onChange={(e) => onChange(minId, e.target.value)}
          aria-label={`${field.label} min`}
        />
        <span className="text-sm text-gray-400 dark:text-gray-500">–</span>
        <input
          id={`filter-${maxId}`}
          type="number"
          min={0}
          className={`${inputClass} w-28`}
          value={values[maxId] ?? ""}
          placeholder="Max"
          onChange={(e) => onChange(maxId, e.target.value)}
          aria-label={`${field.label} max`}
        />
      </div>
    </div>
  );
}

// ─── Main FilterBar ───────────────────────────────────────────────────────────

export function FilterBar({
  fields,
  values,
  onChange,
  onReset,
  hasActive,
  className = "",
  actions,
  resetKey = 0,
}: FilterBarProps) {
  if (fields.length === 0) return null;

  return (
    <div
      className={`flex flex-wrap items-end gap-3 rounded-2xl border border-gray-200 bg-white p-4 shadow-theme-xs dark:border-gray-800 dark:bg-white/[0.03] ${className}`}
    >
      {fields.map((field) => {
        switch (field.type) {
          case "select":
            return (
              <SelectField
                key={field.id}
                field={field}
                value={values[field.id] ?? ""}
                onChange={(v) => onChange(field.id, v)}
              />
            );
          case "async-select":
            return (
              <AsyncSelectField
                key={field.id}
                field={field}
                value={values[field.id] ?? ""}
                onChange={(v) => onChange(field.id, v)}
              />
            );
          case "date-range":
            return (
              <DateRangeField
                key={field.id}
                field={field}
                values={values}
                onChange={onChange}
                resetKey={resetKey}
              />
            );
          case "text":
            return (
              <TextField
                key={field.id}
                field={field}
                value={values[field.id] ?? ""}
                onChange={(v) => onChange(field.id, v)}
              />
            );
          case "number-range":
            return (
              <NumberRangeField
                key={field.id}
                field={field}
                values={values}
                onChange={onChange}
              />
            );
          case "month-select":
            return (
              <MonthSelectField
                key={field.id}
                field={field}
                value={values[field.id] ?? ""}
                onChange={onChange}
                resetKey={resetKey}
              />
            );
          case "date-split":
            return (
              <DateSplitField
                key={field.id}
                field={field}
                values={values}
                onChange={onChange}
                resetKey={resetKey}
              />
            );
          case "date":
            return (
              <DateField
                key={field.id}
                field={field}
                value={values[field.id] ?? ""}
                onChange={(v) => onChange(field.id, v)}
                resetKey={resetKey}
              />
            );
          default:
            return null;
        }
      })}

      <div className="ml-auto flex shrink-0 items-end gap-2 self-end">
        {hasActive && (
          <button
            type="button"
            onClick={onReset}
            className="rounded-lg px-3 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-white"
          >
            Clear filters
          </button>
        )}
        {actions}
      </div>
    </div>
  );
}
