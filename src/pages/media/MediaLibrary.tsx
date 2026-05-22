import { useCallback, useEffect, useRef, useState } from "react";
import { useDropzone } from "react-dropzone";
import { toast } from "react-toastify";
import PageMeta from "../../components/common/PageMeta";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import { CopyUrlButton } from "../../components/media/CopyUrlButton";
import {
  deleteMediaAsset,
  getMediaLibrary,
  type MediaAsset,
} from "../../api/mediaAssets";
import { uploadMedia } from "../../api/uploads";
import { getImageUrl } from "../../utils/image.utils";
import { inferMediaKind } from "../../utils/media.utils";

type FilterType = "all" | "image" | "document";

export default function MediaLibrary() {
  const [assets, setAssets] = useState<MediaAsset[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [filter, setFilter] = useState<FilterType>("all");
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getMediaLibrary({
        page,
        limit: 30,
        type: filter === "all" ? "all" : filter,
        search: search.trim() || undefined,
      });
      setAssets(res.data);
      setTotal(res.total);
      setTotalPages(res.totalPages || 1);
    } catch {
      setAssets([]);
      toast.error("Failed to load media");
    } finally {
      setLoading(false);
    }
  }, [filter, page, search]);

  useEffect(() => {
    load();
  }, [load]);

  const handleUpload = async (files: File[]) => {
    if (!files.length) return;
    setUploading(true);
    try {
      for (const file of files) {
        await uploadMedia(file);
      }
      toast.success(files.length > 1 ? `${files.length} files uploaded` : "File uploaded");
      setPage(1);
      await load();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  const { getRootProps, getInputProps, isDragActive, open } = useDropzone({
    onDrop: handleUpload,
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
    if (!confirm("Remove from media library? The file remains on the CDN.")) return;
    try {
      await deleteMediaAsset(asset.id);
      setAssets((prev) => prev.filter((a) => a.id !== asset.id));
      setTotal((t) => Math.max(0, t - 1));
      toast.success("Removed");
    } catch {
      toast.error("Failed to remove");
    }
  };

  return (
    <>
      <PageMeta title="Media Library | StudyCafe Admin" description="Upload and manage images, PDFs, and other assets" />
      <PageBreadcrumb pageTitle="Media Library" />

      <div className="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
        <div
          className={`border-b border-gray-200 p-4 dark:border-gray-800 ${isDragActive ? "bg-brand-50 dark:bg-brand-500/10" : ""}`}
          {...getRootProps()}
        >
          <input {...getInputProps()} />
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-lg font-semibold text-gray-800 dark:text-white">Media</h2>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                Upload images and PDFs. Files are stored at{" "}
                <code className="text-xs">assets.studycafe.in/uploads/YYYY/MM/…</code> — copy links for articles and pages.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                disabled={uploading}
                onClick={open}
                className="rounded-lg bg-brand-500 px-4 py-2 text-sm font-medium text-white hover:bg-brand-600 disabled:opacity-50"
              >
                {uploading ? "Uploading…" : "Upload files"}
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
          </div>
          {isDragActive && (
            <p className="mt-3 text-center text-sm font-medium text-brand-600 dark:text-brand-400">
              Drop files to upload
            </p>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2 border-b border-gray-100 px-4 py-3 dark:border-gray-800">
          <input
            type="search"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                setSearch(searchInput);
                setPage(1);
              }
            }}
            placeholder="Search by name or URL…"
            className="h-9 min-w-[200px] flex-1 rounded-lg border border-gray-200 px-3 text-sm dark:border-gray-700 dark:bg-gray-950 dark:text-white"
          />
          <button
            type="button"
            onClick={() => {
              setSearch(searchInput);
              setPage(1);
            }}
            className="rounded-lg border border-gray-200 px-3 py-1.5 text-sm dark:border-gray-700"
          >
            Search
          </button>
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
          <span className="ml-auto text-sm text-gray-500">{total} item{total !== 1 ? "s" : ""}</span>
        </div>

        <div className="p-4">
          {loading ? (
            <p className="py-12 text-center text-sm text-gray-500">Loading media…</p>
          ) : assets.length === 0 ? (
            <div className="py-12 text-center">
              <p className="text-sm text-gray-500">No files yet.</p>
              <button
                type="button"
                onClick={open}
                className="mt-3 text-sm font-medium text-brand-500 hover:underline"
              >
                Upload your first file
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
              {assets.map((asset) => {
                const kind = inferMediaKind(asset);
                const name = asset.label || asset.url.split("/").pop() || "file";
                return (
                  <div
                    key={asset.id}
                    className="flex flex-col overflow-hidden rounded-xl border border-gray-200 dark:border-gray-800"
                  >
                    <a
                      href={asset.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="relative aspect-square bg-gray-50 dark:bg-gray-900"
                    >
                      {kind === "image" ? (
                        <img
                          src={getImageUrl(asset.url)}
                          alt={name}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <div className="flex h-full flex-col items-center justify-center text-gray-400">
                          <span className="text-3xl font-bold text-error-500">PDF</span>
                          <span className="mt-1 text-xs uppercase text-gray-500">Document</span>
                        </div>
                      )}
                    </a>
                    <div className="space-y-2 p-2">
                      <p
                        className="truncate text-xs font-medium text-gray-800 dark:text-gray-200"
                        title={name}
                      >
                        {name}
                      </p>
                      <p className="truncate text-[10px] text-gray-400" title={asset.url}>
                        {asset.url.replace(/^https?:\/\/[^/]+/, "")}
                      </p>
                      <div className="flex flex-wrap gap-1">
                        <CopyUrlButton url={asset.url} className="flex-1" />
                        <button
                          type="button"
                          onClick={() => handleDelete(asset)}
                          className="rounded-lg px-2 py-1.5 text-xs text-error-500 hover:bg-error-50 dark:hover:bg-error-500/10"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {totalPages > 1 && (
            <div className="mt-6 flex items-center justify-center gap-3">
              <button
                type="button"
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="rounded-lg border border-gray-200 px-3 py-1.5 text-sm disabled:opacity-40 dark:border-gray-700"
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
                className="rounded-lg border border-gray-200 px-3 py-1.5 text-sm disabled:opacity-40 dark:border-gray-700"
              >
                Next
              </button>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
