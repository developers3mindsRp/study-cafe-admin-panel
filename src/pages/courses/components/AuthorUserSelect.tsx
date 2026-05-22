import { useState, useEffect, useRef, useCallback } from "react";
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
  value,
  onChange,
  disabled = false,
  placeholder = "Select an author",
  fetchUsers,
  initialUser,
}: {
  value: string;
  onChange: (userId: string, user?: User) => void;
  disabled?: boolean;
  placeholder?: string;
  /** Called to search users; receives the current query string (empty = default list). */
  fetchUsers: (search: string) => Promise<User[]>;
  /** Pre-built user object to show as the selected label before any search runs. */
  initialUser?: User;
}) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [results, setResults] = useState<User[]>([]);
  const [searching, setSearching] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | undefined>(initialUser);
  const containerRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  // Keep a ref so loadResults never stale-closes over fetchUsers
  const fetchRef = useRef(fetchUsers);
  useEffect(() => { fetchRef.current = fetchUsers; }, [fetchUsers]);

  const loadResults = useCallback(async (q: string) => {
    setSearching(true);
    try {
      const users = await fetchRef.current(q);
      setResults(users);
    } catch {
      setResults([]);
    } finally {
      setSearching(false);
    }
  }, []);

  // Sync initialUser → selectedUser when the prop arrives (e.g. after parent data loads)
  useEffect(() => {
    if (initialUser && String(initialUser.id) === value) {
      setSelectedUser(initialUser);
    }
  }, [initialUser, value]);

  const handleOpen = () => {
    if (disabled) return;
    setOpen(true);
    setQuery("");
    loadResults("");
  };

  const handleQueryChange = (q: string) => {
    setQuery(q);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => loadResults(q), 350);
  };

  const pick = (user: User) => {
    setSelectedUser(user);
    onChange(String(user.id), user);
    setOpen(false);
    setQuery("");
  };

  const clear = () => {
    setSelectedUser(undefined);
    onChange("", undefined);
    setOpen(false);
    setQuery("");
  };

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

  const displayLabel =
    selectedUser && String(selectedUser.id) === value ? userLabel(selectedUser) : "";

  return (
    <div ref={containerRef} className="relative w-full">
      <button
        type="button"
        disabled={disabled}
        onClick={handleOpen}
        className="flex h-11 w-full items-center justify-between rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm text-left text-gray-800 shadow-theme-xs focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:focus:border-brand-800"
      >
        <span className={displayLabel ? "truncate text-gray-800 dark:text-white" : "truncate text-gray-400"}>
          {displayLabel || placeholder}
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
              onChange={(e) => handleQueryChange(e.target.value)}
              placeholder="Search by name, email, role…"
              className="w-full rounded-md border border-gray-200 px-2 py-1.5 text-xs text-gray-800 outline-none focus:border-brand-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
            />
          </div>
          <ul className="max-h-52 overflow-y-auto py-1">
            {searching ? (
              <li className="px-3 py-3 text-xs text-gray-400 text-center">Searching…</li>
            ) : (
              <>
                <li>
                  <button
                    type="button"
                    onClick={clear}
                    className="w-full px-3 py-2 text-left text-sm text-gray-500 hover:bg-gray-50 dark:text-gray-400 dark:hover:bg-gray-700"
                  >
                    {placeholder}
                  </button>
                </li>
                {results.length === 0 && query.trim() && (
                  <li className="px-3 py-2 text-xs italic text-gray-400">
                    No users match your search
                  </li>
                )}
                {results.length === 0 && !query.trim() && (
                  <li className="px-3 py-2 text-xs italic text-gray-400">
                    Type a name to search users
                  </li>
                )}
                {results.map((u) => {
                  const active = String(u.id) === value;
                  return (
                    <li key={u.id}>
                      <button
                        type="button"
                        onClick={() => pick(u)}
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
              </>
            )}
          </ul>
        </div>
      )}
    </div>
  );
}
