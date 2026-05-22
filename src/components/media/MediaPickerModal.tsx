import { useCallback, useEffect, useRef, useState } from "react";
import { useDropzone } from "react-dropzone";
import { toast } from "react-toastify";
import {
  deleteMediaAsset,
  getMediaLibrary,
  type MediaAsset,
} from "../../api/mediaAssets";
import { uploadMedia } from "../../api/uploads";
import { getImageUrl } from "../../utils/image.utils";
import { CopyUrlButton } from "./CopyUrlButton";
import { inferMediaKind, type MediaFileKind } from "../../utils/media.utils";

type FilterType = "all" | "image" | "document";

interface MediaPickerModalProps {
  open: boolean;
  onClose: () => void;
  onSelectImage?: (url: string) => void;
  onSelectLink?: (url: string, label?: string) => void;
}

export default function MediaPickerModal({
  open,
  onClose,
  onSelectImage,
  onSelectLink,
}: MediaPickerModalProps) {
  const [assets, setAssets] = useState<MediaAsset[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [filter, setFilter] = useState<FilterType>("all");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const fileInputRef = useRef<HTMLInputElement>(null);

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
      setTotalPages(res.totalPages || 1);
    } catch {
      setAssets([]);
      toast.error("Failed to load media library");
    } finally {
      setLoading(false);
    }
  }, [filter, page, search]);

  useEffect(() => {
    if (!open) return;
    load();
  }, [open, load]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  const handleUpload = async (files: File[]) => {
    if (!files.length) return;
    setUploading(true);
    try {
      for (const file of files) {
        await uploadMedia(file);
      }
      toast.success(files.length > 1 ? "Files uploaded" : "File uploaded");
      setPage(1);
      await load();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  const onDrop = useCallback(
    (accepted: File[]) => {
      handleUpload(accepted);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [load],
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    disabled: uploading,
    noClick: true,
    accept: {
      "image/*": [".png", ".jpg", ".jpeg", ".webp", ".gif", ".svg"],
      "application/pdf": [".pdf"],
      "application/msword": [".doc"],
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document": [".docx"],
      "application/vnd.ms-excel": [".xls"],
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": [".xlsx"],
      "application/vnd.ms-powerpoint": [".ppt"],
      "application/vnd.openxmlformats-officedocument.presentationml.presentation": [".pptx"],
    },
  });

  const handleDelete = async (asset: MediaAsset) => {
    if (!confirm("Remove this item from the media library? The file stays on the CDN.")) return;
    try {
      await deleteMediaAsset(asset.id);
      setAssets((prev) => prev.filter((a) => a.id !== asset.id));
      toast.success("Removed from library");
    } catch {
      toast.error("Failed to delete");
    }
  };

  const handleUse = (asset: MediaAsset) => {
    const kind = inferMediaKind(asset);
    if (kind === "image" && onSelectImage) {
      onSelectImage(asset.url);
      onClose();
      return;
    }
    if (onSelectLink) {
      onSelectLink(asset.url, asset.label || undefined);
      onClose();
      return;
    }
    onClose();
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <button
        type="button"
        className="absolute inset-0 bg-black/50"
        aria-label="Close"
        onClick={onClose}
      />
      <div
        className="relative flex max-h-[90vh] w-full max-w-4xl flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-xl dark:border-gray-800 dark:bg-gray-900"
        {...getRootProps()}
      >
        <input {...getInputProps()} />
        <div className="flex items-center justify-between border-b border-gray-200 px-4 py-3 dark:border-gray-800">
          <h2 className="text-lg font-semibold text-gray-800 dark:text-white">Media Library</h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-2 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800"
          >
            ✕
          </button>
        </div>

        <div className="flex flex-wrap items-center gap-2 border-b border-gray-100 px-4 py-3 dark:border-gray-800">
          <input
            type="search"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            placeholder="Search files…"
            className="h-9 min-w-[180px] flex-1 rounded-lg border border-gray-200 px-3 text-sm dark:border-gray-700 dark:bg-gray-950 dark:text-white"
          />
          {(["all", "image", "document"] as FilterType[]).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => {
                setFilter(t);
                setPage(1);
              }}
              className={`rounded-lg px-3 py-1.5 text-sm capitalize ${
                filter === t
                  ? "bg-brand-500 text-white"
                  : "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-300"
              }`}
            >
              {t === "all" ? "All" : t === "image" ? "Images" : "Documents"}
            </button>
          ))}
          <button
            type="button"
            disabled={uploading}
            onClick={() => fileInputRef.current?.click()}
            className="rounded-lg bg-brand-500 px-3 py-1.5 text-sm text-white hover:bg-brand-600 disabled:opacity-50"
          >
            {uploading ? "Uploading…" : "Upload"}
          </button>
          <input
            ref={fileInputRef}
            type="file"
            multiple
            className="hidden"
            accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx"
            onChange={(e) => {
              const list = e.target.files ? Array.from(e.target.files) : [];
              if (list.length) handleUpload(list);
              e.target.value = "";
            }}
          />
        </div>

        {isDragActive && (
          <div className="border-b border-brand-200 bg-brand-50 px-4 py-2 text-center text-sm text-brand-700 dark:border-brand-800 dark:bg-brand-500/10 dark:text-brand-300">
            Drop files to upload
          </div>
        )}

        <div className="flex-1 overflow-y-auto p-4">
          {loading ? (
            <p className="text-center text-sm text-gray-500">Loading…</p>
          ) : assets.length === 0 ? (
            <p className="text-center text-sm text-gray-500">No media yet. Upload images or PDFs.</p>
          ) : (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
              {assets.map((asset) => (
                <MediaCard
                  key={asset.id}
                  asset={asset}
                  onUse={() => handleUse(asset)}
                  onDelete={() => handleDelete(asset)}
                />
              ))}
            </div>
          )}
        </div>

        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 border-t border-gray-100 px-4 py-3 dark:border-gray-800">
            <button
              type="button"
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className="rounded px-2 py-1 text-sm disabled:opacity-40"
            >
              Previous
            </button>
            <span className="text-sm text-gray-500">
              Page {page} of {totalPages}
            </span>
            <button
              type="button"
              disabled={page >= totalPages}
              onClick={() => setPage((p) => p + 1)}
              className="rounded px-2 py-1 text-sm disabled:opacity-40"
            >
              Next
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function MediaCard({
  asset,
  onUse,
  onDelete,
}: {
  asset: MediaAsset;
  onUse: () => void;
  onDelete: () => void;
}) {
  const kind = inferMediaKind(asset);
  const name = asset.label || asset.url.split("/").pop() || "file";

  return (
    <div className="group flex flex-col overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-950">
      <div className="relative aspect-square bg-gray-50 dark:bg-gray-900">
        {kind === "image" ? (
          <img
            src={getImageUrl(asset.url)}
            alt={name}
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="flex h-full flex-col items-center justify-center gap-1 p-2 text-gray-500">
            <DocIcon kind={kind} />
            <span className="text-xs uppercase">{kind === "document" ? "PDF/DOC" : "File"}</span>
          </div>
        )}
      </div>
      <div className="flex flex-1 flex-col gap-1 p-2">
        <p className="truncate text-xs font-medium text-gray-800 dark:text-gray-200" title={name}>
          {name}
        </p>
        <div className="flex flex-wrap gap-1">
          <button
            type="button"
            onClick={onUse}
            className="flex-1 rounded bg-brand-500 px-2 py-1 text-xs text-white hover:bg-brand-600"
          >
            {kind === "image" ? "Insert" : "Link"}
          </button>
          <CopyUrlButton url={asset.url} />
        </div>
        <button
          type="button"
          onClick={onDelete}
          className="text-xs text-error-500 hover:underline"
        >
          Remove
        </button>
      </div>
    </div>
  );
}

function DocIcon({ kind }: { kind: MediaFileKind }) {
  if (kind !== "document") {
    return (
      <svg className="size-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
    );
  }
  return (
    <svg className="size-10 text-error-500" fill="currentColor" viewBox="0 0 24 24">
      <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8l-6-6zm-1 2l5 5h-5V4zM8 12h8v2H8v-2zm0 4h8v2H8v-2z" />
    </svg>
  );
}
