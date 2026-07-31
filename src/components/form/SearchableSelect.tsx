import type React from "react";
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";

interface Option {
  value: string;
  text: string;
}

interface SearchableSelectProps {
  options: Option[];
  /** Currently selected value ("" for none). */
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  searchPlaceholder?: string;
  disabled?: boolean;
  id?: string;
  /** Extra classes for the scrollable list panel (e.g. max height). */
  dropdownListClassName?: string;
  emptyMessage?: string;
  /**
   * Render the menu in a body portal (fixed position) instead of inline.
   * Needed inside a scrolling/clipping container such as a filter bar with
   * `overflow-x-auto`, which would otherwise cut the menu off.
   */
  portal?: boolean;
}

/**
 * Single-select dropdown with a search field, mirroring the look and keyboard
 * behaviour of MultiSelect. Use when a native <select> holds too many options
 * to scan comfortably (e.g. picking one course from dozens).
 */
const SearchableSelect: React.FC<SearchableSelectProps> = ({
  options,
  value,
  onChange,
  placeholder = "Select an option",
  searchPlaceholder = "Search…",
  disabled = false,
  id,
  dropdownListClassName = "",
  emptyMessage = "No matches found.",
  portal = false,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [focusedIndex, setFocusedIndex] = useState(-1);
  const [searchQuery, setSearchQuery] = useState("");
  const dropdownRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const [panelPos, setPanelPos] = useState<{ top: number; left: number; width: number } | null>(null);

  const updatePanelPosition = useCallback(() => {
    const el = triggerRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const width = Math.min(window.innerWidth - 16, Math.max(rect.width, 240));
    const left = Math.max(8, Math.min(rect.left, window.innerWidth - width - 8));
    setPanelPos({ top: rect.bottom + 4, left, width });
  }, []);

  useLayoutEffect(() => {
    if (!portal || !isOpen) return;
    updatePanelPosition();
    window.addEventListener("resize", updatePanelPosition);
    window.addEventListener("scroll", updatePanelPosition, true);
    return () => {
      window.removeEventListener("resize", updatePanelPosition);
      window.removeEventListener("scroll", updatePanelPosition, true);
    };
  }, [portal, isOpen, updatePanelPosition]);

  const selectedOption = options.find((o) => o.value === value);

  const filteredOptions = useMemo(() => {
    if (!searchQuery.trim()) return options;
    const q = searchQuery.trim().toLowerCase();
    return options.filter((o) => o.text.toLowerCase().includes(q));
  }, [options, searchQuery]);

  useEffect(() => {
    if (!isOpen) {
      setSearchQuery("");
      setFocusedIndex(-1);
      setPanelPos(null);
    } else {
      // Focus the search field as soon as the dropdown opens.
      searchRef.current?.focus();
    }
  }, [isOpen]);

  useEffect(() => {
    setFocusedIndex(-1);
  }, [searchQuery]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      if (dropdownRef.current?.contains(target)) return;
      // The portalled menu lives outside dropdownRef, so check it separately.
      if (panelRef.current?.contains(target)) return;
      setIsOpen(false);
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      return () =>
        document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [isOpen]);

  const toggleDropdown = () => {
    if (disabled) return;
    if (!isOpen && portal) updatePanelPosition();
    setIsOpen((prev) => !prev);
  };

  const handleSelect = (optionValue: string) => {
    onChange(optionValue);
    setIsOpen(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (disabled) return;

    const list = filteredOptions;
    switch (e.key) {
      case "Enter":
        e.preventDefault();
        if (!isOpen) {
          setIsOpen(true);
        } else if (focusedIndex >= 0 && list[focusedIndex]) {
          handleSelect(list[focusedIndex].value);
        }
        break;
      case "Escape":
        setIsOpen(false);
        break;
      case "ArrowDown":
        e.preventDefault();
        if (!isOpen) {
          setIsOpen(true);
        } else if (list.length > 0) {
          setFocusedIndex((prev) => (prev < list.length - 1 ? prev + 1 : 0));
        }
        break;
      case "ArrowUp":
        e.preventDefault();
        if (isOpen && list.length > 0) {
          setFocusedIndex((prev) => (prev > 0 ? prev - 1 : list.length - 1));
        }
        break;
    }
  };

  const menu = (
    <div
      ref={panelRef}
      style={
        portal && panelPos
          ? {
              position: "fixed",
              top: panelPos.top,
              left: panelPos.left,
              width: panelPos.width,
              zIndex: 9999,
            }
          : undefined
      }
      className={`overflow-hidden rounded-lg border border-gray-200 bg-white shadow-lg dark:border-gray-700 dark:bg-gray-900 ${
        portal ? "" : "absolute left-0 top-full z-40 mt-1 w-full"
      }`}
      role="listbox"
    >
      <div className="sticky top-0 z-10 border-b border-gray-200 bg-white p-2 dark:border-gray-800 dark:bg-gray-900">
        <input
          ref={searchRef}
          type="search"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={searchPlaceholder}
          className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:border-brand-500 focus:outline-none dark:border-gray-600 dark:bg-gray-800 dark:text-white"
        />
      </div>
      <div
        className={`overflow-y-auto ${
          dropdownListClassName || "max-h-[min(22rem,65vh)]"
        }`}
      >
        {filteredOptions.length === 0 ? (
          <div className="p-4 text-center text-sm text-gray-500 dark:text-gray-400">
            {emptyMessage}
          </div>
        ) : (
          filteredOptions.map((option, index) => {
            const isSelected = option.value === value;
            const isFocused = index === focusedIndex;

            return (
              <div
                key={option.value}
                className={`w-full cursor-pointer border-b border-gray-200 last:border-b-0 hover:bg-primary/5 dark:border-gray-800 ${
                  isFocused ? "bg-primary/5" : ""
                } ${isSelected ? "bg-primary/10" : ""}`}
                onClick={() => handleSelect(option.value)}
                role="option"
                aria-selected={isSelected}
              >
                <div className="relative flex w-full items-center p-3">
                  <div className="mx-1 flex-1 text-sm leading-snug text-gray-800 dark:text-white/90">
                    {option.text}
                  </div>
                  {isSelected && (
                    <span className="text-xs font-medium text-brand-600 dark:text-brand-400">
                      Selected
                    </span>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );

  return (
    <div className="relative w-full" ref={dropdownRef}>
      <div
        ref={triggerRef}
        id={id}
        onClick={toggleDropdown}
        onKeyDown={handleKeyDown}
        role="combobox"
        aria-expanded={isOpen}
        aria-haspopup="listbox"
        aria-disabled={disabled}
        tabIndex={disabled ? -1 : 0}
        className={`flex min-h-11 w-full items-center justify-between rounded-lg border border-gray-300 px-4 py-2.5 text-sm shadow-theme-xs outline-hidden transition focus:border-brand-300 focus:shadow-focus-ring dark:border-gray-700 dark:bg-gray-900 dark:focus:border-brand-300 ${
          disabled
            ? "cursor-not-allowed bg-gray-50 opacity-50 dark:bg-gray-800"
            : "cursor-pointer"
        }`}
      >
        <span
          className={`truncate ${
            selectedOption
              ? "text-gray-900 dark:text-white"
              : "text-gray-400 dark:text-gray-500"
          }`}
          title={selectedOption ? selectedOption.text : undefined}
        >
          {selectedOption ? selectedOption.text : placeholder}
        </span>
        <svg
          className={`ml-2 shrink-0 stroke-current text-gray-500 transition-transform dark:text-gray-400 ${
            isOpen ? "rotate-180" : ""
          }`}
          width="20"
          height="20"
          viewBox="0 0 20 20"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M4.79175 7.39551L10.0001 12.6038L15.2084 7.39551"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>

      {isOpen && (portal ? (panelPos ? createPortal(menu, document.body) : null) : menu)}
    </div>
  );
};

export default SearchableSelect;
