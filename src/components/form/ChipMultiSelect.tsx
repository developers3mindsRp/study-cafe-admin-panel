/**
 * Chip-style multi-select: selected items as removable chips + input with searchable dropdown.
 * Use for tags, categories, and any id+name taxonomy.
 */

import { useState, useRef, useEffect } from "react";
import Label from "./Label";

export interface ChipOption {
  id: number;
  name: string;
  slug?: string | null;
}

interface ChipMultiSelectProps {
  label: string;
  options: ChipOption[];
  value: number[];
  onChange: (ids: number[]) => void;
  placeholder?: string;
  disabled?: boolean;
  "aria-label"?: string;
}

export function ChipMultiSelect({
  label,
  options,
  value,
  onChange,
  placeholder = "Search or select…",
  disabled = false,
  "aria-label": ariaLabel,
}: ChipMultiSelectProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [highlightIndex, setHighlightIndex] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const selectedIds = new Set(value ?? []);
  const selectedOptions = options.filter((o) => selectedIds.has(o.id));
  const filteredOptions = options.filter(
    (o) => query === "" || o.name.toLowerCase().includes(query.toLowerCase())
  );
  const allFilteredSelected = filteredOptions.length > 0 && filteredOptions.every((o) => selectedIds.has(o.id));

  useEffect(() => {
    if (!open) return;
    const handle = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handle);
    return () => document.removeEventListener("mousedown", handle);
  }, [open]);

  useEffect(() => {
    setHighlightIndex(0);
  }, [query, open]);

  const toggle = (id: number) => {
    if (selectedIds.has(id)) {
      onChange(Array.from(selectedIds).filter((i) => i !== id));
    } else {
      onChange([...Array.from(selectedIds), id]);
    }
    inputRef.current?.focus();
  };

  const toggleAll = () => {
    if (allFilteredSelected) {
      // Deselect all filtered options
      const filteredIds = new Set(filteredOptions.map((o) => o.id));
      onChange(Array.from(selectedIds).filter((id) => !filteredIds.has(id)));
    } else {
      // Select all filtered options
      const merged = new Set(selectedIds);
      filteredOptions.forEach((o) => merged.add(o.id));
      onChange(Array.from(merged));
    }
    inputRef.current?.focus();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!open && (e.key === "ArrowDown" || e.key === "Enter")) {
      setOpen(true);
      e.preventDefault();
      return;
    }
    if (open) {
      if (e.key === "Escape") {
        setOpen(false);
        e.preventDefault();
        return;
      }
      if (e.key === "ArrowDown") {
        setHighlightIndex((i) => (i < filteredOptions.length - 1 ? i + 1 : 0));
        e.preventDefault();
        return;
      }
      if (e.key === "ArrowUp") {
        setHighlightIndex((i) => (i > 0 ? i - 1 : filteredOptions.length - 1));
        e.preventDefault();
        return;
      }
      if (e.key === "Enter" && filteredOptions[highlightIndex]) {
        toggle(filteredOptions[highlightIndex].id);
        e.preventDefault();
      }
    }
  };

  return (
    <div ref={containerRef} className="relative w-full">
      <Label>{label}</Label>
      <div
        className={`flex min-h-[42px] items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2 transition focus-within:border-brand-500 focus-within:ring-2 focus-within:ring-brand-500/20 dark:border-gray-700 dark:bg-gray-800 dark:focus-within:border-brand-500 ${
          disabled ? "cursor-not-allowed opacity-60" : ""
        }`}
      >
        {selectedOptions.length > 0 && (
          <div className="flex items-center gap-1.5 shrink-0">
            <span className="inline-flex items-center gap-1 rounded-full bg-brand-500 px-2.5 py-1 text-xs font-semibold text-white">
              {selectedOptions.length} selected
            </span>
            {!disabled && (
              <button
                type="button"
                onClick={() => onChange([])}
                className="rounded-full p-1 text-gray-400 transition hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-700 dark:hover:text-gray-300"
                aria-label="Clear all"
                title="Clear all"
              >
                <svg className="size-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>
        )}
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => setOpen(true)}
          onKeyDown={handleKeyDown}
          disabled={disabled}
          placeholder={selectedOptions.length === 0 ? placeholder : "Add more…"}
          aria-label={ariaLabel ?? label}
          className="min-w-[120px] flex-1 border-0 bg-transparent py-1 text-sm text-gray-800 placeholder-gray-400 outline-none dark:text-white/90 dark:placeholder-gray-500"
        />
      </div>
      {open && filteredOptions.length > 0 && (
        <ul
          className="absolute left-0 right-0 top-full z-20 mt-1 max-h-[280px] overflow-auto rounded-lg border border-gray-200 bg-white py-1 shadow-lg dark:border-gray-700 dark:bg-gray-800"
          role="listbox"
        >
          {/* Select All toggle */}
          <li
            className="cursor-pointer px-3 py-2 text-sm font-medium text-gray-800 dark:text-white/90 border-b border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-white/5"
            onMouseDown={(e) => {
              e.preventDefault();
              toggleAll();
            }}
          >
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={allFilteredSelected}
                readOnly
                className="rounded border-gray-300 text-brand-500 focus:ring-brand-500"
              />
              <span>Select All{query ? " (filtered)" : ""}</span>
            </label>
          </li>
          {filteredOptions.map((opt, i) => (
            <li
              key={opt.id}
              role="option"
              aria-selected={selectedIds.has(opt.id)}
              className={`cursor-pointer px-3 py-2 text-sm text-gray-800 dark:text-white/90 ${
                i === highlightIndex ? "bg-brand-50 dark:bg-brand-500/20" : "hover:bg-gray-50 dark:hover:bg-white/5"
              }`}
              onMouseEnter={() => setHighlightIndex(i)}
              onMouseDown={(e) => {
                e.preventDefault();
                toggle(opt.id);
              }}
            >
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={selectedIds.has(opt.id)}
                  readOnly
                  className="rounded border-gray-300 text-brand-500 focus:ring-brand-500"
                />
                {opt.name}
              </label>
            </li>
          ))}
        </ul>
      )}
      {open && query && filteredOptions.length === 0 && (
        <p className="absolute left-0 right-0 top-full z-20 mt-1 px-2 text-xs text-gray-500 dark:text-gray-400">No matches. Type to search.</p>
      )}
    </div>
  );
}

export default ChipMultiSelect;
