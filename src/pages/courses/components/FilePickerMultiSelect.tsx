import { useState, useEffect, useRef, useCallback } from "react";
import { searchFiles, type DownloadFile } from "../../../api/downloads";

interface Props {
  /** Currently selected file IDs (strings or numbers both work) */
  value: (string | number)[];
  onChange: (ids: string[]) => void;
}

/**
 * Searchable multi-select for download files.
 * Lets you pick files by title — no copy-paste required.
 */
export function FilePickerMultiSelect({ value, onChange }: Props) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [results, setResults] = useState<DownloadFile[]>([]);
  const [loading, setLoading] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Normalise value to string array for comparison
  const selectedIds = value.map(String);
  const selectedSet = new Set(selectedIds);

  // ── close on outside click ────────────────────────────────────────────────
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

  // ── debounced search ──────────────────────────────────────────────────────
  const doSearch = useCallback(async (q: string) => {
    setLoading(true);
    try {
      const files = await searchFiles(q, 25);
      setResults(files);
    } catch {
      setResults([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!open) return;
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => doSearch(query), 300);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query, open, doSearch]);

  // Load initial results when dropdown opens
  useEffect(() => {
    if (open) doSearch("");
  }, [open]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── toggle a file ─────────────────────────────────────────────────────────
  function toggle(id: number) {
    const idStr = String(id);
    const next = new Set(selectedSet);
    if (next.has(idStr)) next.delete(idStr);
    else next.add(idStr);
    onChange([...next]);
  }

  function remove(id: string) {
    onChange(selectedIds.filter((s) => s !== id));
  }

  // ── label for the trigger button ──────────────────────────────────────────
  const selectedCount = selectedIds.length;

  return (
    <div ref={containerRef} className="relative w-full">
      {/* ── Selected tags ── */}
      {selectedCount > 0 && (
        <div className="mb-2 flex flex-wrap gap-1.5">
          {selectedIds.map((id) => {
            const match = results.find((f) => String(f.id) === id);
            return (
              <span
                key={id}
                className="inline-flex items-center gap-1 rounded-full bg-brand-50 px-2.5 py-0.5 text-xs font-medium text-brand-700 dark:bg-brand-500/10 dark:text-brand-300"
              >
                <span className="font-mono">#{id}</span>
                {match && <span className="max-w-[140px] truncate">{match.title}</span>}
                <button
                  type="button"
                  onClick={() => remove(id)}
                  className="ml-0.5 text-brand-400 hover:text-brand-600 dark:hover:text-brand-200"
                  aria-label={`Remove file ${id}`}
                >
                  <svg viewBox="0 0 14 14" width="10" height="10" fill="currentColor">
                    <path d="M8.414 7l3.293-3.293a1 1 0 00-1.414-1.414L7 5.586 3.707 2.293a1 1 0 00-1.414 1.414L5.586 7 2.293 10.293a1 1 0 001.414 1.414L7 8.414l3.293 3.293a1 1 0 001.414-1.414L8.414 7z" />
                  </svg>
                </button>
              </span>
            );
          })}
        </div>
      )}

      {/* ── Trigger button ── */}
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm text-left transition hover:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-300 dark:border-gray-600 dark:bg-gray-900 dark:text-white"
      >
        <span className={selectedCount > 0 ? "text-gray-700 dark:text-gray-200" : "text-gray-400"}>
          {selectedCount === 0
            ? "Search and select files…"
            : `${selectedCount} file${selectedCount !== 1 ? "s" : ""} selected`}
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

      {/* ── Dropdown ── */}
      {open && (
        <div className="absolute z-50 mt-1 w-full rounded-lg border border-gray-200 bg-white shadow-xl dark:border-gray-600 dark:bg-gray-800">
          {/* Search input */}
          <div className="p-2 border-b border-gray-100 dark:border-gray-700">
            <div className="relative">
              <svg
                className="absolute left-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                viewBox="0 0 24 24"
              >
                <circle cx="11" cy="11" r="8" />
                <path strokeLinecap="round" d="M21 21l-4.35-4.35" />
              </svg>
              <input
                autoFocus
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search files by title…"
                className="w-full rounded-md border border-gray-200 pl-7 pr-2 py-1.5 text-xs outline-none focus:border-brand-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:placeholder-gray-400"
              />
              {loading && (
                <svg
                  className="absolute right-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-brand-400 animate-spin"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                </svg>
              )}
            </div>
          </div>

          {/* Results list */}
          <ul className="max-h-56 overflow-y-auto py-1">
            {!loading && results.length === 0 && (
              <li className="px-3 py-3 text-xs text-gray-400 italic text-center">
                {query ? "No files match your search" : "No published files found"}
              </li>
            )}
            {results.map((file) => {
              const checked = selectedSet.has(String(file.id));
              return (
                <li
                  key={file.id}
                  className="flex cursor-pointer items-start gap-2.5 px-3 py-2 text-sm hover:bg-gray-50 dark:hover:bg-gray-700"
                  onClick={() => toggle(file.id)}
                >
                  <input
                    type="checkbox"
                    readOnly
                    checked={checked}
                    className="mt-0.5 shrink-0 rounded border-gray-300 text-brand-500 focus:ring-brand-500 dark:border-gray-600"
                  />
                  <div className="min-w-0">
                    <p className={`truncate text-sm ${checked ? "font-medium text-brand-600 dark:text-brand-400" : "text-gray-700 dark:text-gray-300"}`}>
                      {file.title}
                    </p>
                    <p className="font-mono text-xs text-gray-400 dark:text-gray-500">ID: {file.id}</p>
                  </div>
                </li>
              );
            })}
          </ul>

          {/* Footer hint */}
          <div className="border-t border-gray-100 px-3 py-1.5 dark:border-gray-700">
            <p className="text-[11px] text-gray-400">
              {selectedCount > 0 ? `${selectedCount} selected · ` : ""}Click a file to add/remove
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
