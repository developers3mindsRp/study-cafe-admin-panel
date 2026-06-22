import { useState } from "react";
import type { MediaAsset } from "../../../api/mediaAssets";
import { inferMediaKind } from "../../../utils/media.utils";
import { getImageUrl } from "../../../utils/image.utils";
import { MediaPickerModal } from "./MediaPickerModal";

/** Subset stored in curriculum JSON — self-contained, no backend lookup needed. */
export interface CurriculumFile {
  id: number;
  url: string;
  label: string | null;
  mime_type: string | null;
  /** True for files that were saved as raw IDs before the media picker existed. */
  _legacy?: boolean;
}

interface Props {
  value: CurriculumFile[];
  onChange: (files: CurriculumFile[]) => void;
}

function fileExtFromUrl(url: string) {
  return url.split("?")[0].split(".").pop()?.toLowerCase() ?? "";
}

function DocThumb({ url }: { url: string }) {
  const ext = fileExtFromUrl(url);
  const map: Record<string, string> = {
    pdf: "text-red-600 bg-red-50",
    doc: "text-blue-600 bg-blue-50",
    docx: "text-blue-600 bg-blue-50",
    xls: "text-green-600 bg-green-50",
    xlsx: "text-green-600 bg-green-50",
    ppt: "text-orange-600 bg-orange-50",
    pptx: "text-orange-600 bg-orange-50",
  };
  const cls = map[ext] ?? "text-gray-500 bg-gray-50";
  return (
    <div className={`flex h-full w-full items-center justify-center rounded ${cls}`}>
      <span className="text-xs font-bold uppercase">{ext || "file"}</span>
    </div>
  );
}

/**
 * Media-library–backed file picker for curriculum days.
 * Stores full MediaAsset metadata (url + label) — no backend ID lookup required.
 */
export function FilePickerMultiSelect({ value, onChange }: Props) {
  const [modalOpen, setModalOpen] = useState(false);

  const selectedIdSet = new Set(value.map((f) => f.id));

  function handleConfirm(assets: MediaAsset[]) {
    // Merge newly picked assets with existing, avoiding duplicates
    const existingById = new Map(value.map((f) => [f.id, f]));
    for (const a of assets) {
      existingById.set(a.id, { id: a.id, url: a.url, label: a.label, mime_type: a.mime_type });
    }
    onChange([...existingById.values()]);
    setModalOpen(false);
  }

  function remove(id: number) {
    onChange(value.filter((f) => f.id !== id));
  }

  return (
    <div className="space-y-2">
      {/* ── Selected file cards ── */}
      {value.length > 0 && (
        <div className="space-y-2">
          {value.map((file, idx) => {
            const isLegacy = !!file._legacy || !file.url;

            if (isLegacy) {
              return (
                <div
                  key={`legacy-${file.id}`}
                  className="flex items-center gap-3 rounded-lg border border-gray-200 bg-white p-3 dark:border-gray-700 dark:bg-gray-900"
                >
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-gray-100 text-xs font-semibold text-gray-500 dark:bg-gray-800">
                    {idx + 1}
                  </span>
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-gray-800">
                    <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
                    </svg>
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-gray-800 dark:text-gray-100">
                      {file.label ?? `File #${file.id}`}
                    </p>
                    <p className="text-[11px] text-gray-400 dark:text-gray-500">ID: {file.id}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => remove(file.id)}
                    className="ml-auto shrink-0 rounded-md p-1 text-gray-400 transition hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-500/10"
                    aria-label="Remove file"
                  >
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              );
            }

            const kind = inferMediaKind({ url: file.url, mime_type: file.mime_type });
            const name = file.label || file.url.split("/").pop() || `File #${file.id}`;

            return (
              <div
                key={file.id}
                className="flex items-center gap-3 rounded-lg border border-gray-200 bg-white p-3 dark:border-gray-700 dark:bg-gray-900"
              >
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-gray-100 text-xs font-semibold text-gray-500 dark:bg-gray-800">
                  {idx + 1}
                </span>
                <div className="h-10 w-10 shrink-0 overflow-hidden rounded-lg border border-gray-200 dark:border-gray-700">
                  {kind === "image" ? (
                    <img src={getImageUrl(file.url)} alt={name} className="h-full w-full object-cover" />
                  ) : (
                    <DocThumb url={file.url} />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-gray-800 dark:text-gray-100" title={name}>
                    {name}
                  </p>
                  <p className="truncate text-[11px] text-gray-400 dark:text-gray-500" title={file.url}>
                    {file.url.replace(/^https?:\/\/[^/]+/, "")}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => remove(file.id)}
                  className="ml-auto shrink-0 rounded-md p-1 text-gray-400 transition hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-500/10"
                  aria-label="Remove file"
                >
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            );
          })}
        </div>
      )}

      {/* ── Open media picker ── */}
      <button
        type="button"
        onClick={() => setModalOpen(true)}
        className="inline-flex items-center gap-1.5 rounded-lg border border-dashed border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-600 transition hover:border-brand-400 hover:text-brand-600 dark:border-gray-600 dark:bg-gray-900 dark:text-gray-400 dark:hover:border-brand-500 dark:hover:text-brand-400"
      >
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
        </svg>
        {value.length > 0 ? "Add More Files" : "Select from Media Library"}
      </button>

      {/* ── Modal ── */}
      {modalOpen && (
        <MediaPickerModal
          selectedIds={selectedIdSet}
          onConfirm={handleConfirm}
          onClose={() => setModalOpen(false)}
        />
      )}
    </div>
  );
}
