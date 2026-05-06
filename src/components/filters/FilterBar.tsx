import { useEffect, useState } from "react";
import type { FilterFieldDef, FilterValues, SelectOption } from "./filter.types";

export interface FilterBarProps {
  fields: FilterFieldDef[];
  values: FilterValues;
  onChange: (id: string, value: string) => void;
  onReset: () => void;
  hasActive: boolean;
  className?: string;
}

const selectClass =
  "min-w-[160px] rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-800 transition focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20 dark:border-gray-700 dark:bg-gray-800 dark:text-white/90";

const labelClass = "text-xs font-medium text-gray-600 dark:text-gray-400";

const inputClass =
  "min-w-[140px] rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-800 transition focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20 dark:border-gray-700 dark:bg-gray-800 dark:text-white/90";

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
    <div className="flex min-w-[160px] flex-col gap-1.5">
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
    <div className="flex min-w-[180px] flex-col gap-1.5">
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
  values,
  onChange,
}: {
  field: Extract<FilterFieldDef, { type: "date-range" }>;
  values: FilterValues;
  onChange: (id: string, v: string) => void;
}) {
  const fromId = field.fromId ?? `${field.id}_from`;
  const toId = field.toId ?? `${field.id}_to`;

  return (
    <div className="flex flex-col gap-1.5">
      <span className={labelClass}>{field.label}</span>
      <div className="flex items-center gap-2">
        <input
          id={`filter-${fromId}`}
          type="date"
          className={inputClass}
          value={values[fromId] ?? ""}
          onChange={(e) => onChange(fromId, e.target.value)}
          aria-label={`${field.label} from`}
        />
        <span className="text-sm text-gray-400 dark:text-gray-500">–</span>
        <input
          id={`filter-${toId}`}
          type="date"
          className={inputClass}
          value={values[toId] ?? ""}
          onChange={(e) => onChange(toId, e.target.value)}
          aria-label={`${field.label} to`}
        />
      </div>
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
    <div className="flex min-w-[160px] flex-col gap-1.5">
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
    <div className="flex flex-col gap-1.5">
      <span className={labelClass}>{field.label}</span>
      <div className="flex items-center gap-2">
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
          default:
            return null;
        }
      })}

      {hasActive && (
        <button
          type="button"
          onClick={onReset}
          className="ml-auto self-end rounded-lg px-3 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-white"
        >
          Clear filters
        </button>
      )}
    </div>
  );
}
