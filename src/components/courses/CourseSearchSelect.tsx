import { useState, useEffect, useRef } from "react";
import type { Course } from "../../api/courses";

export function CourseSearchSelect({
  courses,
  value,
  onChange,
  placeholder = "Select course...",
  allowAll = false,
}: {
  courses: Course[];
  value: string;
  onChange: (val: string) => void;
  placeholder?: string;
  allowAll?: boolean;
}) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const selectedCourse = courses.find((c) => String(c.id) === value);
  const displayLabel =
    allowAll && value === "all" ? "All Courses" : selectedCourse?.title ?? "";

  const filtered = courses.filter((c) => c.title.toLowerCase().includes(query.toLowerCase()));

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

  function select(val: string) {
    onChange(val);
    setOpen(false);
    setQuery("");
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
          className={`w-4 h-4 text-gray-400 transition-transform ${open ? "rotate-180" : ""}`}
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
              placeholder="Search course..."
              className="w-full rounded-md border border-gray-200 px-2 py-1.5 text-xs outline-none focus:border-brand-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
            />
          </div>
          <ul className="max-h-52 overflow-y-auto py-1">
            {allowAll && (
              <li
                onClick={() => select("all")}
                className={`cursor-pointer px-3 py-2 text-sm hover:bg-gray-50 dark:hover:bg-gray-700 ${
                  value === "all"
                    ? "bg-brand-50 text-brand-600 dark:bg-brand-900/20 dark:text-brand-400 font-medium"
                    : "text-gray-700 dark:text-gray-300"
                }`}
              >
                All Courses
              </li>
            )}
            {filtered.length === 0 && (
              <li className="px-3 py-2 text-xs text-gray-400 italic">No courses match</li>
            )}
            {filtered.map((c) => (
              <li
                key={c.id}
                onClick={() => select(String(c.id))}
                className={`cursor-pointer px-3 py-2 text-sm hover:bg-gray-50 dark:hover:bg-gray-700 ${
                  String(c.id) === value
                    ? "bg-brand-50 text-brand-600 dark:bg-brand-900/20 dark:text-brand-400 font-medium"
                    : "text-gray-700 dark:text-gray-300"
                }`}
              >
                {c.title}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
