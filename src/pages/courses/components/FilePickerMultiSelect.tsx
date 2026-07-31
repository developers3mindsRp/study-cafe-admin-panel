import { useState } from "react";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
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
 * One selected file, draggable by its handle.
 * The array order is the order learners see, so the index badge doubles as the order number.
 */
function SortableFileRow({
  file,
  index,
  onRemove,
}: {
  file: CurriculumFile;
  index: number;
  onRemove: () => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    setActivatorNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: file.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const isLegacy = !!file._legacy || !file.url;
  const kind = isLegacy ? null : inferMediaKind({ url: file.url, mime_type: file.mime_type });
  const name = isLegacy
    ? file.label ?? `File #${file.id}`
    : file.label || file.url.split("/").pop() || `File #${file.id}`;

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`flex items-center gap-2 rounded-lg border border-gray-200 bg-white p-3 dark:border-gray-700 dark:bg-gray-900 ${
        isDragging ? "z-10 opacity-80 shadow-lg" : ""
      }`}
    >
      <div
        ref={setActivatorNodeRef}
        {...attributes}
        {...listeners}
        className="shrink-0 cursor-grab touch-none rounded p-1 text-gray-400 transition hover:bg-gray-100 hover:text-gray-600 active:cursor-grabbing dark:hover:bg-gray-800 dark:hover:text-gray-300"
        title="Drag to reorder"
      >
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M4 8h16M4 16h16" />
        </svg>
      </div>
      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-gray-100 text-xs font-semibold text-gray-500 dark:bg-gray-800">
        {index + 1}
      </span>
      {isLegacy ? (
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-gray-800">
          <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
          </svg>
        </div>
      ) : (
        <div className="h-10 w-10 shrink-0 overflow-hidden rounded-lg border border-gray-200 dark:border-gray-700">
          {kind === "image" ? (
            <img src={getImageUrl(file.url)} alt={name} className="h-full w-full object-cover" />
          ) : (
            <DocThumb url={file.url} />
          )}
        </div>
      )}
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-gray-800 dark:text-gray-100" title={name}>
          {name}
        </p>
        {isLegacy ? (
          <p className="text-[11px] text-gray-400 dark:text-gray-500">ID: {file.id}</p>
        ) : (
          <p className="truncate text-[11px] text-gray-400 dark:text-gray-500" title={file.url}>
            {file.url.replace(/^https?:\/\/[^/]+/, "")}
          </p>
        )}
      </div>
      <button
        type="button"
        onClick={onRemove}
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

/**
 * Media-library–backed file picker for curriculum days.
 * Stores full MediaAsset metadata (url + label) — no backend ID lookup required.
 * Files are saved in list order; drag a row's handle to change that order.
 */
export function FilePickerMultiSelect({ value, onChange }: Props) {
  const [modalOpen, setModalOpen] = useState(false);

  const selectedIdSet = new Set(value.map((f) => f.id));

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = value.findIndex((f) => f.id === active.id);
    const newIndex = value.findIndex((f) => f.id === over.id);
    if (oldIndex === -1 || newIndex === -1) return;
    onChange(arrayMove(value, oldIndex, newIndex));
  }

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
      {/* ── Selected file cards (drag handle reorders; list order is saved order) ── */}
      {value.length > 0 && (
        <>
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            <SortableContext items={value.map((f) => f.id)} strategy={verticalListSortingStrategy}>
              <div className="space-y-2">
                {value.map((file, idx) => (
                  <SortableFileRow
                    key={file.id}
                    file={file}
                    index={idx}
                    onRemove={() => remove(file.id)}
                  />
                ))}
              </div>
            </SortableContext>
          </DndContext>
          {value.length > 1 && (
            <p className="text-[11px] text-gray-400 dark:text-gray-500">
              Drag the handle to reorder — students see the files in this order.
            </p>
          )}
        </>
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
