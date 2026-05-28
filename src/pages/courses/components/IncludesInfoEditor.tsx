import { useCallback, useEffect, useRef, useState } from "react";
import Label from "../../../components/form/Label";
import Input from "../../../components/form/input/InputField";
import Button from "../../../components/ui/button/Button";
import { uploadImage } from "../../../api/uploads";
import {
  getMediaAssets,
  createMediaAsset,
  deleteMediaAsset,
  type MediaAsset,
} from "../../../api/mediaAssets";
import { getImageUrl } from "../../../utils/image.utils";

export interface IncludesInfoItem {
  image: string;
  title: string;
  worth: string;
}

type PickerTab = "library" | "upload" | "custom";

// ─── Icon Picker ────────────────────────────────────────────────────────────

interface IconPickerProps {
  value: string;
  onChange: (path: string) => void;
}

export function IconPicker({ value, onChange }: IconPickerProps) {
  const [open, setOpen]           = useState(false);
  const [tab, setTab]             = useState<PickerTab>("library");
  const [assets, setAssets]       = useState<MediaAsset[]>([]);
  const [loading, setLoading]     = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [deleteId, setDeleteId]   = useState<number | null>(null);
  const fileInputRef              = useRef<HTMLInputElement>(null);
  const dropdownRef               = useRef<HTMLDivElement>(null);

  // Fetch icon library from DB when the dropdown opens
  useEffect(() => {
    if (!open) return;
    setLoading(true);
    getMediaAssets("icon")
      .then(setAssets)
      .catch(() => setAssets([]))
      .finally(() => setLoading(false));
  }, [open]);

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  const selected = assets.find((a) => a.url === value);

  const handleFileSelect = useCallback(
    async (file: File) => {
      setUploadError(null);
      setUploading(true);
      try {
        // 1. Upload the file to get a CDN URL
        const { url } = await uploadImage(file);
        // 2. Save the URL into the media table (category: icon)
        const label = file.name.replace(/\.[^.]+$/, "").replace(/[-_]/g, " ");
        const asset = await createMediaAsset({ url, label, category: "icon" });
        // 3. Refresh the library list and auto-select the new icon
        setAssets((prev) => [asset, ...prev]);
        onChange(url);
        setTab("library");
        setOpen(false);
      } catch (e) {
        setUploadError(e instanceof Error ? e.message : "Upload failed");
      } finally {
        setUploading(false);
      }
    },
    [onChange]
  );

  const handleDelete = useCallback(
    async (asset: MediaAsset, e: React.MouseEvent) => {
      e.stopPropagation();
      setDeleteId(asset.id);
      try {
        await deleteMediaAsset(asset.id);
        setAssets((prev) => prev.filter((a) => a.id !== asset.id));
        if (value === asset.url) onChange("");
      } finally {
        setDeleteId(null);
      }
    },
    [value, onChange]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      const file = e.dataTransfer.files[0];
      if (file && file.type.startsWith("image/")) handleFileSelect(file);
    },
    [handleFileSelect]
  );

  return (
    <div className="relative" ref={dropdownRef}>
      {/* ── Trigger ── */}
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-3 w-full border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 bg-white dark:bg-white/[0.03] hover:border-brand-400 transition"
      >
        {value ? (
          <img src={getImageUrl(value)} alt="selected" className="w-8 h-8 object-contain flex-shrink-0" />
        ) : (
          <div className="w-8 h-8 rounded bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-gray-400 text-xs flex-shrink-0">
            ?
          </div>
        )}
        <span className="text-sm text-gray-700 dark:text-gray-300 flex-1 text-left truncate">
          {selected?.label || (value ? value.split("/").pop() : "Select or upload icon…")}
        </span>
        <svg
          className={`w-4 h-4 text-gray-400 flex-shrink-0 transition-transform ${open ? "rotate-180" : ""}`}
          fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* ── Dropdown panel ── */}
      {open && (
        <div className="absolute z-50 top-full left-0 mt-1 w-80 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl shadow-2xl overflow-hidden">

          {/* Tabs */}
          <div className="flex border-b border-gray-100 dark:border-gray-800">
            {(["library", "upload",
            //  "custom"
            ] as PickerTab[]).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setTab(t)}
                className={`flex-1 py-2 text-xs font-semibold transition ${
                  tab === t
                    ? "text-brand-600 border-b-2 border-brand-500 bg-brand-50/50 dark:bg-brand-500/10"
                    : "text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                }`}
              >
                {t === "library" ? "Icon Library" : t === "upload" ? "Upload New" : "Custom URL"}
              </button>
            ))}
          </div>

          <div className="p-3">

            {/* ── Library tab ── */}
            {tab === "library" && (
              <>
                {loading ? (
                  <div className="flex items-center justify-center py-8">
                    <svg className="w-6 h-6 text-brand-500 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                    </svg>
                  </div>
                ) : assets.length === 0 ? (
                  <div className="py-6 text-center text-sm text-gray-400">
                    <p>No icons yet.</p>
                    <button
                      type="button"
                      onClick={() => setTab("upload")}
                      className="mt-1 text-brand-500 hover:underline text-xs font-medium"
                    >
                      Upload your first icon →
                    </button>
                  </div>
                ) : (
                  <div className="grid grid-cols-5 gap-1.5 max-h-52 overflow-y-auto">
                    {assets.map((asset) => (
                      <div key={asset.id} className="relative group">
                        <button
                          type="button"
                          title={asset.label ?? asset.url}
                          onClick={() => { onChange(asset.url); setOpen(false); }}
                          className={`w-full flex flex-col items-center gap-1 p-1.5 rounded-lg border transition ${
                            value === asset.url
                              ? "border-brand-500 bg-brand-50 dark:bg-brand-500/10"
                              : "border-transparent hover:border-gray-300 hover:bg-gray-50 dark:hover:bg-white/[0.04]"
                          }`}
                        >
                          <img src={getImageUrl(asset.url)} alt={asset.label ?? ""} className="w-8 h-8 object-contain" />
                          <span className="text-[8px] text-gray-500 dark:text-gray-400 text-center leading-tight line-clamp-2">
                            {asset.label || "—"}
                          </span>
                        </button>
                        {/* Delete button, visible on hover */}
                        <button
                          type="button"
                          title="Remove from library"
                          disabled={deleteId === asset.id}
                          onClick={(e) => handleDelete(asset, e)}
                          className="absolute -top-1 -right-1 hidden group-hover:flex w-4 h-4 items-center justify-center rounded-full bg-red-500 text-white text-[8px] font-bold shadow hover:bg-red-600 transition"
                        >
                          {deleteId === asset.id ? "…" : "×"}
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}

            {/* ── Upload tab ── */}
            {tab === "upload" && (
              <div>
                <div
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={handleDrop}
                  onClick={() => !uploading && fileInputRef.current?.click()}
                  className={`flex flex-col items-center justify-center gap-2 border-2 border-dashed rounded-xl p-6 transition ${
                    uploading
                      ? "border-brand-400 bg-brand-50/50 dark:bg-brand-500/5 cursor-wait"
                      : "border-gray-300 dark:border-gray-600 cursor-pointer hover:border-brand-400 hover:bg-brand-50/30 dark:hover:bg-brand-500/5"
                  }`}
                >
                  {uploading ? (
                    <>
                      <svg className="w-7 h-7 text-brand-500 animate-spin" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                      </svg>
                      <span className="text-sm text-brand-600 font-medium">Uploading & saving…</span>
                    </>
                  ) : (
                    <>
                      <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
                      </svg>
                      <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        Drag & drop or click to upload
                      </p>
                      <p className="text-xs text-gray-400">PNG, JPG, SVG, WebP</p>
                    </>
                  )}
                </div>
                {uploadError && (
                  <p className="mt-2 text-xs text-red-600 dark:text-red-400">{uploadError}</p>
                )}
                <p className="mt-2 text-[10px] text-gray-400 dark:text-gray-500 leading-snug">
                  Uploaded icons are saved to the library in the database. Any admin can reuse them on any course without re-uploading.
                </p>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleFileSelect(file);
                    e.target.value = "";
                  }}
                />
              </div>
            )}

            {/* ── Custom URL tab ── */}
            {tab === "custom" && (
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">
                  Enter any image URL or a /public path:
                </p>
                <input
                  type="text"
                  value={value}
                  onChange={(e) => onChange(e.target.value)}
                  placeholder="https://… or /images/my-icon.png"
                  className="w-full text-sm border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-1.5 bg-white dark:bg-gray-900 text-gray-800 dark:text-white focus:outline-none focus:border-brand-400"
                />
                {value && (
                  <div className="mt-2 flex items-center gap-3 p-2 border border-dashed border-gray-300 dark:border-gray-600 rounded-lg">
                    <img
                      src={getImageUrl(value)}
                      alt=""
                      className="w-10 h-10 object-contain"
                      onError={(e) => { (e.target as HTMLImageElement).style.opacity = "0.2"; }}
                    />
                    <span className="text-xs text-gray-500 dark:text-gray-400 break-all">{value}</span>
                  </div>
                )}
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="mt-3 w-full py-1.5 rounded-lg bg-brand-500 text-white text-sm font-medium hover:bg-brand-600 transition"
                >
                  Apply
                </button>
              </div>
            )}

          </div>
        </div>
      )}
    </div>
  );
}

// ─── Main Editor ────────────────────────────────────────────────────────────

interface IncludesInfoEditorProps {
  value: IncludesInfoItem[];
  onChange: (value: IncludesInfoItem[]) => void;
}

const DEFAULT_ITEM: IncludesInfoItem = { image: "", title: "", worth: "" };

export default function IncludesInfoEditor({ value, onChange }: IncludesInfoEditorProps) {
  const addItem = () => onChange([...value, { ...DEFAULT_ITEM }]);

  const removeItem = (i: number) => onChange(value.filter((_, idx) => idx !== i));

  const updateItem = (i: number, patch: Partial<IncludesInfoItem>) => {
    const next = [...value];
    next[i] = { ...next[i], ...patch };
    onChange(next);
  };

  return (
    <div className="space-y-4">
      {value.map((item, i) => (
        <div
          key={i}
          className="border border-gray-200 dark:border-gray-700 rounded-xl p-4 bg-gray-50/50 dark:bg-white/[0.02] space-y-4"
        >
          {/* Header */}
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">
              Bonus {i + 1}
            </span>
            <button
              type="button"
              onClick={() => removeItem(i)}
              className="p-1.5 text-gray-400 hover:text-red-500 transition"
              title="Remove"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 6h18" /><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
                <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
              </svg>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-start">
            {/* Icon picker */}
            <div>
              <Label>Icon / Image</Label>
              <IconPicker value={item.image} onChange={(v) => updateItem(i, { image: v })} />
            </div>

            {/* Title */}
            <div>
              <Label>Bonus Title</Label>
              <Input
                value={item.title}
                onChange={(e) => updateItem(i, { title: e.target.value })}
                placeholder="e.g. Ready Made Excel Templates"
              />
            </div>

            {/* Worth */}
            <div>
              <Label>Worth (e.g. ₹4,000)</Label>
              <Input
                value={item.worth}
                onChange={(e) => updateItem(i, { worth: e.target.value })}
                placeholder="₹4,000"
              />
            </div>
          </div>

          {/* Live preview */}
          {(item.image || item.title) && (
            <div className="flex items-center gap-3 rounded-lg border border-dashed border-gray-300 dark:border-gray-600 bg-white dark:bg-white/[0.03] p-3">
              {item.image && (
                <img src={getImageUrl(item.image)} alt="" className="w-9 h-9 object-contain flex-shrink-0" />
              )}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-800 dark:text-white/90 truncate">
                  {item.title || <span className="text-gray-400 italic">No title</span>}
                </p>
                {item.worth && (
                  <p className="text-xs text-green-600 font-semibold mt-0.5">Worth {item.worth}</p>
                )}
              </div>
              <span className="text-[10px] text-gray-400 flex-shrink-0">Preview</span>
            </div>
          )}
        </div>
      ))}

      <Button type="button" variant="outline" size="sm" onClick={addItem}>
        + Add Bonus Item
      </Button>
    </div>
  );
}
