import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router";
import { useNavMenu } from "../context/NavMenuContext";
import type { NavSearchResult } from "./sidebarMenu";

type AppNavSearchProps = {
  inputRef?: React.RefObject<HTMLInputElement | null>;
  className?: string;
};

export default function AppNavSearch({ inputRef: externalRef, className }: AppNavSearchProps) {
  const navigate = useNavigate();
  const { searchMenus } = useNavMenu();
  const internalRef = useRef<HTMLInputElement>(null);
  const inputRef = externalRef ?? internalRef;
  const containerRef = useRef<HTMLDivElement>(null);

  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [highlightIndex, setHighlightIndex] = useState(0);

  const results = useMemo(
    () => searchMenus(query, query.trim() ? 12 : 20),
    [searchMenus, query],
  );

  useEffect(() => {
    setHighlightIndex(0);
  }, [query, results.length]);

  useEffect(() => {
    const onDocMouseDown = (e: MouseEvent) => {
      if (!containerRef.current?.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", onDocMouseDown);
    return () => document.removeEventListener("mousedown", onDocMouseDown);
  }, []);

  const goTo = (item: NavSearchResult) => {
    setOpen(false);
    setQuery("");
    navigate(item.path);
    inputRef.current?.blur();
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!open && (e.key === "ArrowDown" || e.key === "ArrowUp")) {
      setOpen(true);
      return;
    }
    if (e.key === "Escape") {
      setOpen(false);
      inputRef.current?.blur();
      return;
    }
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlightIndex((i) => (results.length ? (i + 1) % results.length : 0));
      return;
    }
    if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlightIndex((i) => (results.length ? (i - 1 + results.length) % results.length : 0));
      return;
    }
    if (e.key === "Enter" && results[highlightIndex]) {
      e.preventDefault();
      goTo(results[highlightIndex]);
    }
  };

  const showDropdown = open;

  return (
    <div ref={containerRef} className={`relative ${className ?? ""}`}>
      <span className="absolute -translate-y-1/2 pointer-events-none left-4 top-1/2 z-10">
        <svg
          className="fill-gray-500 dark:fill-gray-400"
          width="20"
          height="20"
          viewBox="0 0 20 20"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            fillRule="evenodd"
            clipRule="evenodd"
            d="M3.04175 9.37363C3.04175 5.87693 5.87711 3.04199 9.37508 3.04199C12.8731 3.04199 15.7084 5.87693 15.7084 9.37363C15.7084 12.8703 12.8731 15.7053 9.37508 15.7053C5.87711 15.7053 3.04175 12.8703 3.04175 9.37363ZM9.37508 1.54199C5.04902 1.54199 1.54175 5.04817 1.54175 9.37363C1.54175 13.6991 5.04902 17.2053 9.37508 17.2053C11.2674 17.2053 13.003 16.5344 14.357 15.4176L17.177 18.238C17.4699 18.5309 17.9448 18.5309 18.2377 18.238C18.5306 17.9451 18.5306 17.4703 18.2377 17.1774L15.418 14.3573C16.5365 13.0033 17.2084 11.2669 17.2084 9.37363C17.2084 5.04817 13.7011 1.54199 9.37508 1.54199Z"
            fill=""
          />
        </svg>
      </span>
      <input
        ref={inputRef}
        type="search"
        role="combobox"
        aria-expanded={showDropdown}
        aria-autocomplete="list"
        aria-controls="app-nav-search-listbox"
        placeholder="Search menus…"
        autoComplete="off"
        value={query}
        onChange={(e) => {
          setQuery(e.target.value);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        onKeyDown={onKeyDown}
        className="dark:bg-dark-900 h-11 w-full rounded-lg border border-gray-200 bg-transparent py-2.5 pl-12 pr-14 text-sm text-gray-800 shadow-theme-xs placeholder:text-gray-400 focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-800 dark:bg-white/[0.03] dark:text-white/90 dark:placeholder:text-white/30 dark:focus:border-brand-800 xl:w-[430px]"
      />
      <button
        type="button"
        tabIndex={-1}
        className="absolute right-2.5 top-1/2 inline-flex -translate-y-1/2 items-center gap-0.5 rounded-lg border border-gray-200 bg-gray-50 px-[7px] py-[4.5px] text-xs -tracking-[0.2px] text-gray-500 dark:border-gray-800 dark:bg-white/[0.03] dark:text-gray-400 pointer-events-none"
      >
        <span> ⌘ </span>
        <span> K </span>
      </button>

      {showDropdown && (
        <ul
          id="app-nav-search-listbox"
          role="listbox"
          className="absolute left-0 right-0 top-full z-[100000] mt-2 max-h-[min(24rem,70vh)] overflow-y-auto rounded-xl border border-gray-200 bg-white py-2 shadow-lg dark:border-gray-800 dark:bg-gray-900"
        >
          {results.length === 0 ? (
            <li className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400">
              {query.trim() ? "No matching menu items" : "Type to search sidebar menus"}
            </li>
          ) : (
            results.map((item, index) => (
              <li key={`${item.path}-${item.label}`} role="option" aria-selected={index === highlightIndex}>
                <button
                  type="button"
                  className={`flex w-full flex-col items-start gap-0.5 px-4 py-2.5 text-left text-sm transition-colors ${
                    index === highlightIndex
                      ? "bg-brand-50 text-brand-700 dark:bg-brand-500/15 dark:text-brand-300"
                      : "text-gray-800 hover:bg-gray-50 dark:text-white/90 dark:hover:bg-white/5"
                  }`}
                  onMouseEnter={() => setHighlightIndex(index)}
                  onClick={() => goTo(item)}
                >
                  <span className="font-medium">{item.label}</span>
                  {item.parentName && (
                    <span className="text-xs text-gray-500 dark:text-gray-400">{item.parentName}</span>
                  )}
                </button>
              </li>
            ))
          )}
        </ul>
      )}
    </div>
  );
}
