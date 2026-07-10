/**
 * FilterSearchInput — standalone debounced search box for filter bars.
 * Local state keeps typing responsive; only the debounced value is committed
 * to the parent so the table doesn't refetch on every keystroke.
 */

import { useState, useEffect, useRef } from "react";

const DEBOUNCE_MS = 350;

export interface FilterSearchInputProps {
  /** Committed (debounced) search value. */
  value: string;
  /** Called with the debounced value. */
  onChange: (value: string) => void;
  placeholder?: string;
  /** Wrapper class — control width/placement from the parent. */
  className?: string;
  disabled?: boolean;
}

export function FilterSearchInput({
  value,
  onChange,
  placeholder = "Search…",
  className = "",
  disabled = false,
}: FilterSearchInputProps) {
  const [localValue, setLocalValue] = useState(value);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Reflect external clears/resets into the input.
  useEffect(() => {
    if (value === "") setLocalValue("");
  }, [value]);

  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const next = e.target.value;
    setLocalValue(next);

    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      debounceRef.current = null;
      onChange(next);
    }, DEBOUNCE_MS);
  };

  return (
    <div className={`relative ${className}`}>
      <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-gray-400 dark:text-gray-500">
        <svg width="18" height="18" viewBox="0 0 20 20" fill="none" aria-hidden="true">
          <path
            d="M9 3a6 6 0 1 0 3.9 10.6l3.75 3.75a1 1 0 0 0 1.4-1.4l-3.74-3.75A6 6 0 0 0 9 3Zm-4 6a4 4 0 1 1 8 0 4 4 0 0 1-8 0Z"
            fill="currentColor"
          />
        </svg>
      </span>
      <input
        type="search"
        value={localValue}
        onChange={handleChange}
        placeholder={placeholder}
        disabled={disabled}
        aria-label={placeholder}
        className="h-11 w-full rounded-lg border border-gray-200 bg-white pl-10 pr-3 text-sm text-gray-800 placeholder-gray-500 shadow-theme-xs transition focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20 dark:border-gray-700 dark:bg-gray-800 dark:text-white/90 dark:placeholder-gray-400 disabled:opacity-50"
      />
    </div>
  );
}
