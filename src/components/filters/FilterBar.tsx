import { useCallback, useEffect, useState, type ReactNode } from "react";
import AsyncSelect from "react-select/async";
import type { CSSObjectWithLabel } from "react-select";
import type { FilterFieldDef, FilterValues, SelectOption } from "./filter.types";
import DatePicker from "../form/date-picker";
import AmountRangeDropdown from "../form/AmountRangeDropdown";

export interface FilterBarProps {
  fields: FilterFieldDef[];
  values: FilterValues;
  onChange: (id: string, value: string) => void;
  /** Update multiple filter keys in one state commit (e.g. amount min + max). */
  onChangeMany?: (updates: Record<string, string>) => void;
  onReset: () => void;
  hasActive: boolean;
  className?: string;
  /** `full` stretches filters across the bar on wide screens. */
  layout?: "wrap" | "full";
  /** Extra controls (e.g. Export) shown at the end of the filter row. */
  actions?: React.ReactNode;
  /**
   * Increment this value to force date-range pickers to reset their UI
   * (e.g. after calling onReset). Pass the same counter you use to clear
   * filter state so the calendar clears in sync.
   */
  resetKey?: number;
}

function resolveFieldLayoutClass(field: FilterFieldDef, layout: "wrap" | "full"): string {
  const custom = "className" in field ? field.className : undefined;
  if (custom) return custom;
  if (layout !== "full") return "";
  switch (field.type) {
    case "date-range":
      return "min-w-0 w-full";
    case "searchable-async-select":
      return "min-w-0 w-full";
    case "amount-range":
      return "min-w-0 w-full";
    default:
      return "min-w-0 w-full";
  }
}

function FilterFieldShell({
  layoutClass,
  children,
}: {
  layoutClass: string;
  children: ReactNode;
}) {
  if (!layoutClass) return <>{children}</>;
  return <div className={layoutClass}>{children}</div>;
}

const labelClass = "text-xs font-medium text-gray-600 dark:text-gray-400";

/** Shared height, border, and padding for every filter control. */
const filterControlClass =
  "h-11 w-full min-w-0 rounded-lg border border-gray-200 bg-white px-3 text-sm leading-normal text-gray-800 shadow-theme-xs transition placeholder:text-gray-500 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20 dark:border-gray-700 dark:bg-gray-800 dark:text-white/90 dark:placeholder:text-gray-400";

const selectClass = `${filterControlClass} appearance-none pr-8`;

const inputClass = filterControlClass;

const FILTER_ASYNC_SELECT_STYLES = {
  control: (base: CSSObjectWithLabel, state: { isFocused: boolean }) => ({
    ...base,
    minHeight: "44px",
    height: "44px",
    width: "100%",
    borderRadius: "0.5rem",
    borderColor: state.isFocused ? "rgb(70 95 255)" : "rgb(229 231 235)",
    boxShadow: state.isFocused ? "0 0 0 2px rgb(70 95 255 / 0.2)" : "none",
    backgroundColor: "transparent",
    "&:hover": { borderColor: state.isFocused ? "rgb(70 95 255)" : "rgb(209 213 219)" },
  }),
  valueContainer: (base: CSSObjectWithLabel) => ({
    ...base,
    padding: "0 12px",
    fontSize: "0.875rem",
  }),
  placeholder: (base: CSSObjectWithLabel) => ({
    ...base,
    color: "rgb(107 114 128)",
    fontSize: "0.875rem",
  }),
  input: (base: CSSObjectWithLabel) => ({
    ...base,
    margin: 0,
    padding: 0,
    fontSize: "0.875rem",
  }),
  indicatorsContainer: (base: CSSObjectWithLabel) => ({
    ...base,
    height: "44px",
  }),
  menu: (base: CSSObjectWithLabel) => ({
    ...base,
    zIndex: 50,
    fontSize: "0.875rem",
  }),
};

/** Uniform filter field column — label + control stack. */
const filterFieldClass = "flex min-w-0 w-full flex-col gap-1.5";
const filterFieldClassCompact = "flex min-w-[160px] shrink-0 flex-col gap-1.5";

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
    <div className={filterFieldClassCompact}>
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

function SearchableAsyncSelectField({
  field,
  value,
  onChange,
  resetKey = 0,
  wide = false,
}: {
  field: Extract<FilterFieldDef, { type: "searchable-async-select" }>;
  value: string;
  onChange: (v: string) => void;
  resetKey?: number;
  wide?: boolean;
}) {
  const [selected, setSelected] = useState<SelectOption | null>(null);
  const minSearchLength = field.minSearchLength ?? 2;

  useEffect(() => {
    let cancelled = false;
    if (!value) {
      setSelected(null);
      return;
    }
    if (selected?.value === value) return;
    if (!field.resolveOption) return;
    field.resolveOption(value).then((opt) => {
      if (!cancelled) setSelected(opt);
    }).catch(() => {
      if (!cancelled) setSelected(null);
    });
    return () => {
      cancelled = true;
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value, field.resolveOption, resetKey]);

  const loadOptions = useCallback(
    async (inputValue: string) => {
      const q = inputValue.trim();
      if (minSearchLength > 0 && q.length < minSearchLength) return [];
      return field.loader(inputValue);
    },
    [field, minSearchLength],
  );

  return (
    <div className={wide ? filterFieldClass : `${filterFieldClassCompact} min-w-[220px]`}>
      <label htmlFor={`filter-${field.id}`} className={labelClass}>
        {field.label}
      </label>
      <AsyncSelect
        key={`filter-searchable-${field.id}-${resetKey}`}
        inputId={`filter-${field.id}`}
        cacheOptions
        defaultOptions={field.defaultOptions ?? false}
        loadOptions={loadOptions}
        value={selected}
        onChange={(option: SelectOption | null) => {
          const next = option?.value ?? "";
          setSelected(option);
          onChange(next);
        }}
        isClearable
        placeholder={field.searchPlaceholder ?? field.placeholder ?? `Search ${field.label.toLowerCase()}…`}
        noOptionsMessage={({ inputValue }: { inputValue: string }) => {
          const q = inputValue.trim();
          if (minSearchLength > 0 && q.length < minSearchLength) {
            return `Type at least ${minSearchLength} characters`;
          }
          return "No results found";
        }}
        styles={FILTER_ASYNC_SELECT_STYLES}
        className="text-sm text-gray-800 dark:text-gray-200"
        classNamePrefix="filter-select"
      />
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
    <div className={`${filterFieldClassCompact} min-w-[180px]`}>
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
  wide = false,
}: {
  field: Extract<FilterFieldDef, { type: "date-range" }>;
  values: FilterValues;
  onChange: (id: string, v: string) => void;
  resetKey?: number;
  wide?: boolean;
}) {
  const fromId = field.fromId ?? `${field.id}_from`;
  const toId = field.toId ?? `${field.id}_to`;

  return (
    <div className={wide ? `${filterFieldClass} min-w-[13rem]` : `${filterFieldClassCompact} min-w-[13rem]`}>
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
    <div className={filterFieldClassCompact}>
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
    <div key={resetKey} className={filterFieldClassCompact}>
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
      <div className={`${filterFieldClassCompact} min-w-[11rem]`}>
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
      <div className={`${filterFieldClassCompact} min-w-[11rem]`}>
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
    <div className={filterFieldClassCompact}>
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

function AmountRangeField({
  field,
  values,
  onChange,
  onChangeMany,
  resetKey = 0,
  wide = false,
}: {
  field: Extract<FilterFieldDef, { type: "amount-range" }>;
  values: FilterValues;
  onChange: (id: string, v: string) => void;
  onChangeMany?: (updates: Record<string, string>) => void;
  resetKey?: number;
  wide?: boolean;
}) {
  const minId = field.minId ?? `${field.id}_min`;
  const maxId = field.maxId ?? `${field.id}_max`;
  const step = field.step ?? 1;
  const snapOnBlur = field.snapOnBlur ?? false;

  const handleRangeChange = useCallback(
    ({ amountMin, amountMax }: { amountMin: string; amountMax: string }) => {
      if (onChangeMany) {
        onChangeMany({ [minId]: amountMin, [maxId]: amountMax });
        return;
      }
      onChange(minId, amountMin);
      onChange(maxId, amountMax);
    },
    [maxId, minId, onChange, onChangeMany],
  );

  return (
    <div className={wide ? `${filterFieldClass} min-w-[11rem]` : `${filterFieldClassCompact} min-w-[11rem]`}>
      <AmountRangeDropdown
        key={`filter-amount-range-${field.id}-${resetKey}`}
        id={`filter-${field.id}`}
        label={field.label}
        amountMin={values[minId] ?? ""}
        amountMax={values[maxId] ?? ""}
        sliderMax={field.sliderMax}
        step={step}
        snapOnBlur={snapOnBlur}
        showSlider={field.showSlider ?? false}
        className="w-full"
        onChange={handleRangeChange}
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
    <div className={`${filterFieldClassCompact} min-w-0`}>
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
  onChangeMany,
  onReset,
  hasActive,
  className = "",
  layout = "wrap",
  actions,
  resetKey = 0,
}: FilterBarProps) {
  if (fields.length === 0) return null;

  const wide = layout === "full";
  const containerClass =
    layout === "full"
      ? "grid w-full grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-[minmax(11rem,1.1fr)_minmax(14rem,2fr)_minmax(14rem,2fr)_minmax(11rem,1.1fr)_auto] xl:items-end"
      : "flex flex-wrap items-end gap-3";

  return (
    <div
      className={`${containerClass} rounded-2xl border border-gray-200 bg-white p-4 shadow-theme-xs dark:border-gray-800 dark:bg-white/[0.03] ${className}`}
    >
      {fields.map((field) => {
        const layoutClass = resolveFieldLayoutClass(field, layout);
        const shell = (node: ReactNode) => (
          <FilterFieldShell key={field.id} layoutClass={layoutClass}>
            {node}
          </FilterFieldShell>
        );

        switch (field.type) {
          case "select":
            return shell(
              <SelectField
                field={field}
                value={values[field.id] ?? ""}
                onChange={(v) => onChange(field.id, v)}
              />,
            );
          case "async-select":
            return shell(
              <AsyncSelectField
                field={field}
                value={values[field.id] ?? ""}
                onChange={(v) => onChange(field.id, v)}
              />,
            );
          case "searchable-async-select":
            return shell(
              <SearchableAsyncSelectField
                field={field}
                value={values[field.id] ?? ""}
                onChange={(v) => onChange(field.id, v)}
                resetKey={resetKey}
                wide={wide}
              />,
            );
          case "amount-range":
            return shell(
              <AmountRangeField
                field={field}
                values={values}
                onChange={onChange}
                onChangeMany={onChangeMany}
                resetKey={resetKey}
                wide={wide}
              />,
            );
          case "date-range":
            return shell(
              <DateRangeField
                field={field}
                values={values}
                onChange={onChange}
                resetKey={resetKey}
                wide={wide}
              />,
            );
          case "text":
            return shell(
              <TextField
                field={field}
                value={values[field.id] ?? ""}
                onChange={(v) => onChange(field.id, v)}
              />,
            );
          case "number-range":
            return shell(
              <NumberRangeField
                field={field}
                values={values}
                onChange={onChange}
              />,
            );
          case "month-select":
            return shell(
              <MonthSelectField
                field={field}
                value={values[field.id] ?? ""}
                onChange={onChange}
                resetKey={resetKey}
              />,
            );
          case "date-split":
            return shell(
              <DateSplitField
                field={field}
                values={values}
                onChange={onChange}
                resetKey={resetKey}
              />,
            );
          case "date":
            return shell(
              <DateField
                field={field}
                value={values[field.id] ?? ""}
                onChange={(v) => onChange(field.id, v)}
                resetKey={resetKey}
              />,
            );
          default:
            return null;
        }
      })}

      <div
        className={
          wide
            ? "flex items-end justify-end gap-2 sm:col-span-2 xl:col-auto"
            : "ml-auto flex shrink-0 items-end gap-2 self-end"
        }
      >
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
