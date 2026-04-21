import { useState, useEffect, useRef } from "react";
import type { CourseCat } from "../../../api/courses";

export function CourseCatMultiSelect({
  categories,
  value,
  onChange,
  placeholder = "Select categories…",
}: {
  categories: CourseCat[];
  value: number[];
  onChange: (ids: number[]) => void;
  placeholder?: string;
}) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const selectedSet = new Set(value);
  const selectedCats = categories.filter((c) => selectedSet.has(c.id));
  const displayLabel =
    selectedCats.length === 0
      ? ""
      : selectedCats.length <= 2
        ? selectedCats.map((c) => c.name).join(", ")
        : `${selectedCats.length} categories selected`;

  const filtered = categories.filter((c) => c.name.toLowerCase().includes(query.toLowerCase()));

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
        setQuery("");
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  function toggle(id: number) {
    const next = new Set(value);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    onChange([...next].sort((a, b) => a - b));
  }

  return (
    <div ref={containerRef} className="relative w-full">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-left dark:border-gray-600 dark:bg-gray-700 dark:text-white"
      >
        <span className={displayLabel ? "text-gray-800 dark:text-white" : "text-gray-400"}>
          {displayLabel || placeholder}
        </span>
        <svg
          className={`w-4 h-4 shrink-0 text-gray-400 transition-transform ${open ? "rotate-180" : ""}`}
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {open && (
        <div className="absolute z-50 mt-1 w-full rounded-lg border border-gray-200 bg-white shadow-lg dark:border-gray-600 dark:bg-gray-800">
          <div className="p-2 border-b border-gray-100 dark:border-gray-700">
            <input
              autoFocus
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search categories…"
              className="w-full rounded-md border border-gray-200 px-2 py-1.5 text-xs outline-none focus:border-brand-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
            />
          </div>
          <ul className="max-h-52 overflow-y-auto py-1">
            {filtered.length === 0 && (
              <li className="px-3 py-2 text-xs text-gray-400 italic">No categories match</li>
            )}
            {filtered.map((c) => {
              const checked = selectedSet.has(c.id);
              return (
                <li
                  key={c.id}
                  className="flex cursor-pointer items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-gray-700"
                  onClick={() => toggle(c.id)}
                >
                  <input
                    type="checkbox"
                    readOnly
                    checked={checked}
                    className="rounded border-gray-300 text-brand-500 focus:ring-brand-500 dark:border-gray-600"
                  />
                  <span className={checked ? "font-medium text-brand-600 dark:text-brand-400" : ""}>{c.name}</span>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
}
