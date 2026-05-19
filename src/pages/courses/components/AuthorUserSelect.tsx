import { useState, useEffect, useRef } from "react";
import type { User } from "../../../api/users";

function userLabel(u: User): string {
  const name =
    u.name?.trim() ||
    u.display_name?.trim() ||
    u.email?.trim() ||
    `User #${u.id}`;
  const roleHint =
    u.role?.trim() || u.designation?.trim() || u.profession?.trim() || "—";
  return `${name} — ${roleHint}`;
}

export function AuthorUserSelect({
  users,
  value,
  onChange,
  disabled = false,
  placeholder = "Select an author",
  usersLoading = false,
  usersError = false,
  onRetry,
}: {
  users: User[];
  value: string;
  onChange: (userId: string) => void;
  disabled?: boolean;
  placeholder?: string;
  usersLoading?: boolean;
  usersError?: boolean;
  onRetry?: () => void;
}) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const selected = users.find((u) => String(u.id) === value);
  const displayLabel = selected ? userLabel(selected) : "";

  const q = query.trim().toLowerCase();
  const filtered = users.filter((u) => {
    if (!q) return true;
    return (
      (u.name || "").toLowerCase().includes(q) ||
      (u.display_name || "").toLowerCase().includes(q) ||
      (u.email || "").toLowerCase().includes(q) ||
      (u.role || "").toLowerCase().includes(q) ||
      (u.designation || "").toLowerCase().includes(q) ||
      (u.profession || "").toLowerCase().includes(q) ||
      String(u.id).includes(q)
    );
  });

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

  const pick = (userId: string) => {
    onChange(userId);
    setOpen(false);
    setQuery("");
  };

  return (
    <div ref={containerRef} className="relative w-full">
      <button
        type="button"
        disabled={disabled || usersLoading}
        onClick={() => !(disabled || usersLoading) && setOpen((o) => !o)}
        className="flex h-11 w-full items-center justify-between rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm text-left text-gray-800 shadow-theme-xs focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:focus:border-brand-800"
      >
        <span className={displayLabel ? "truncate text-gray-800 dark:text-white" : "truncate text-gray-400"}>
          {usersLoading ? "Loading users…" : (displayLabel || placeholder)}
        </span>
        <svg
          className={`h-4 w-4 shrink-0 text-gray-400 transition-transform ${open ? "rotate-180" : ""}`}
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
          <div className="border-b border-gray-100 p-2 dark:border-gray-700">
            <input
              autoFocus
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by name, email, role…"
              className="w-full rounded-md border border-gray-200 px-2 py-1.5 text-xs text-gray-800 outline-none focus:border-brand-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
            />
          </div>
          <ul className="max-h-52 overflow-y-auto py-1">
            {usersLoading ? (
              <li className="px-3 py-3 text-xs text-gray-400 text-center">Loading users…</li>
            ) : usersError ? (
              <li className="px-3 py-2 text-xs text-center">
                <span className="text-error-500 dark:text-error-400">Failed to load users.</span>{" "}
                {onRetry && (
                  <button
                    type="button"
                    onClick={onRetry}
                    className="underline text-brand-600 dark:text-brand-400 hover:no-underline"
                  >
                    Retry
                  </button>
                )}
              </li>
            ) : (
              <>
                <li>
                  <button
                    type="button"
                    onClick={() => pick("")}
                    className="w-full px-3 py-2 text-left text-sm text-gray-500 hover:bg-gray-50 dark:text-gray-400 dark:hover:bg-gray-700"
                  >
                    {placeholder}
                  </button>
                </li>
                {filtered.length === 0 && (
                  <li className="px-3 py-2 text-xs italic text-gray-400">No users match your search</li>
                )}
              </>
            )}
            {!usersLoading && !usersError && filtered.map((u) => {
              const active = String(u.id) === value;
              return (
                <li key={u.id}>
                  <button
                    type="button"
                    onClick={() => pick(String(u.id))}
                    className={`w-full px-3 py-2 text-left text-sm hover:bg-gray-50 dark:hover:bg-gray-700 ${
                      active
                        ? "bg-brand-50 font-medium text-brand-700 dark:bg-brand-500/15 dark:text-brand-300"
                        : "text-gray-700 dark:text-gray-300"
                    }`}
                  >
                    {userLabel(u)}
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
}
