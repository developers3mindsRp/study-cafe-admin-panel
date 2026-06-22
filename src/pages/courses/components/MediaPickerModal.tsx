import { useCallback, useEffect, useRef, useState } from "react";
import { getMediaLibrary, type MediaAsset } from "../../../api/mediaAssets";
import { getImageUrl } from "../../../utils/image.utils";
import { inferMediaKind } from "../../../utils/media.utils";

type FilterType = "all" | "image" | "document";

interface Props {
  /** Already-selected media asset IDs so they show as pre-checked */
  selectedIds: Set<number>;
  onConfirm: (assets: MediaAsset[]) => void;
  onClose: () => void;
}

function DocThumbnail({ url }: { url: string }) {
  const ext = url.split("?")[0].split(".").pop()?.toLowerCase() ?? "";
  const colorMap: Record<string, string> = {
    pdf: "bg-red-50 text-red-600",
    doc: "bg-blue-50 text-blue-600",
    docx: "bg-blue-50 text-blue-600",
    xls: "bg-green-50 text-green-600",
    xlsx: "bg-green-50 text-green-600",
    ppt: "bg-orange-50 text-orange-600",
    pptx: "bg-orange-50 text-orange-600",
    zip: "bg-yellow-50 text-yellow-600",
  };
  const cls = colorMap[ext] ?? "bg-gray-50 text-gray-500";
  return (
    <div className={`flex h-full flex-col items-center justify-center gap-1 ${cls}`}>
      <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
      </svg>
      {ext && <span className="text-[10px] font-bold uppercase">{ext}</span>}
    </div>
  );
}

export function MediaPickerModal({ selectedIds, onConfirm, onClose }: Props) {
  const [assets, setAssets] = useState<MediaAsset[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<FilterType>("all");
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  /** Local selection state (starts from existing selections) */
  const [picked, setPicked] = useState<Map<number, MediaAsset>>(new Map());

  const searchRef = useRef<HTMLInputElement>(null);

  // Load media assets
  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getMediaLibrary({
        page,
        limit: 24,
        type: filter === "all" ? "all" : filter,
        search: search.trim() || undefined,
      });
      setAssets(res.data);
      setTotal(res.total);
      setTotalPages(res.totalPages || 1);
    } catch {
      setAssets([]);
    } finally {
      setLoading(false);
    }
  }, [filter, page, search]);

  useEffect(() => { load(); }, [load]);

  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [onClose]);

  // Focus search on open
  useEffect(() => { setTimeout(() => searchRef.current?.focus(), 50); }, []);

  function toggleAsset(asset: MediaAsset) {
    setPicked((prev) => {
      const next = new Map(prev);
      if (next.has(asset.id)) next.delete(asset.id);
      else next.set(asset.id, asset);
      return next;
    });
  }

  function handleConfirm() {
    onConfirm([...picked.values()]);
  }

  function applySearch() {
    setSearch(searchInput);
    setPage(1);
  }

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 p-4"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="flex h-[90vh] w-full max-w-5xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl dark:bg-gray-900">

        {/* ── Header ── */}
        <div className="flex items-center justify-between border-b border-gray-200 px-5 py-4 dark:border-gray-700">
          <h2 className="text-base font-semibold text-gray-800 dark:text-white">Select Files from Media Library</h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-800"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* ── Toolbar ── */}
        <div className="flex flex-wrap items-center gap-2 border-b border-gray-100 px-4 py-3 dark:border-gray-800">
          <div className="relative flex-1 min-w-[180px]">
            <svg className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <circle cx="11" cy="11" r="8" /><path strokeLinecap="round" d="M21 21l-4.35-4.35" />
            </svg>
            <input
              ref={searchRef}
              type="search"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") applySearch(); }}
              placeholder="Search media…"
              className="h-9 w-full rounded-lg border border-gray-200 pl-8 pr-3 text-sm outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
            />
          </div>
          <button
            type="button"
            onClick={applySearch}
            className="rounded-lg border border-gray-200 px-3 py-1.5 text-sm dark:border-gray-700 dark:text-gray-300"
          >
            Search
          </button>
          <div className="flex rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
            {(["all", "image", "document"] as FilterType[]).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => { setFilter(t); setPage(1); }}
                className={`px-3 py-1.5 text-xs font-medium capitalize transition ${
                  filter === t
                    ? "bg-brand-500 text-white"
                    : "bg-white text-gray-600 hover:bg-gray-50 dark:bg-gray-800 dark:text-gray-300"
                }`}
              >
                {t === "all" ? "All" : t === "image" ? "Images" : "Documents"}
              </button>
            ))}
          </div>
          <span className="ml-auto text-xs text-gray-400">{total} item{total !== 1 ? "s" : ""}</span>
        </div>

        {/* ── Grid ── */}
        <div className="flex-1 overflow-y-auto p-4">
          {loading ? (
            <div className="flex h-full items-center justify-center">
              <svg className="h-8 w-8 animate-spin text-brand-400" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth={4} />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
              </svg>
            </div>
          ) : assets.length === 0 ? (
            <div className="flex h-full items-center justify-center text-center">
              <p className="text-sm text-gray-400">No files found{search ? ` for "${search}"` : ""}.</p>
            </div>
          ) : (
            <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6">
              {assets.map((asset) => {
                const kind = inferMediaKind(asset);
                const name = asset.label || asset.url.split("/").pop() || "file";
                const isSelected = picked.has(asset.id) || selectedIds.has(asset.id);

                return (
                  <button
                    key={asset.id}
                    type="button"
                    onClick={() => toggleAsset(asset)}
                    className={`group relative flex flex-col overflow-hidden rounded-xl border-2 text-left transition-all ${
                      isSelected
                        ? "border-brand-500 shadow-md shadow-brand-100 dark:shadow-brand-500/10"
                        : "border-gray-200 hover:border-brand-300 dark:border-gray-700"
                    }`}
                  >
                    {/* Thumbnail */}
                    <div className="relative aspect-square bg-gray-50 dark:bg-gray-800">
                      {kind === "image" ? (
                        <img
                          src={getImageUrl(asset.url)}
                          alt={name}
                          className="h-full w-full object-cover"
                          loading="lazy"
                        />
                      ) : (
                        <DocThumbnail url={asset.url} />
                      )}

                      {/* Selected overlay */}
                      {isSelected && (
                        <div className="absolute inset-0 flex items-start justify-end bg-brand-500/10 p-1.5">
                          <div className="flex h-5 w-5 items-center justify-center rounded-full bg-brand-500 shadow">
                            <svg className="h-3 w-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Label */}
                    <div className="px-1.5 py-1">
                      <p className="truncate text-[11px] text-gray-600 dark:text-gray-300" title={name}>
                        {name}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* ── Pagination ── */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-3 border-t border-gray-100 px-4 py-2 dark:border-gray-800">
            <button
              type="button"
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className="rounded-lg border border-gray-200 px-3 py-1 text-sm disabled:opacity-40 dark:border-gray-700"
            >
              ← Prev
            </button>
            <span className="text-sm text-gray-500">Page {page} / {totalPages}</span>
            <button
              type="button"
              disabled={page >= totalPages}
              onClick={() => setPage((p) => p + 1)}
              className="rounded-lg border border-gray-200 px-3 py-1 text-sm disabled:opacity-40 dark:border-gray-700"
            >
              Next →
            </button>
          </div>
        )}

        {/* ── Footer ── */}
        <div className="flex items-center justify-between border-t border-gray-200 px-5 py-4 dark:border-gray-700">
          <span className="text-sm text-gray-500">
            {picked.size > 0
              ? `${picked.size} file${picked.size !== 1 ? "s" : ""} selected`
              : "Click files to select"}
          </span>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-800"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleConfirm}
              disabled={picked.size === 0}
              className="rounded-lg bg-brand-500 px-5 py-2 text-sm font-medium text-white hover:bg-brand-600 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Select{picked.size > 0 ? ` (${picked.size})` : ""}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
