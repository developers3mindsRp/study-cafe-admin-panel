import { useRef } from "react";
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
import Label from "../../../components/form/Label";
import Input from "../../../components/form/input/InputField";
import ArticleEditor from "../../../components/article-editor/ArticleEditor";
import type { ArticleSection } from "../ArticleForm";

interface ArticleSectionsEditorProps {
  value: ArticleSection[];
  onChange: (sections: ArticleSection[]) => void;
}

interface SortableSectionProps {
  id: string;
  index: number;
  section: ArticleSection;
  isLast: boolean;
  onUpdate: (patch: Partial<ArticleSection>) => void;
  onMove: (dir: -1 | 1) => void;
  onRemove: () => void;
}

/** One section card, draggable by the grip in its header. */
function SortableSection({
  id,
  index,
  section,
  isLast,
  onUpdate,
  onMove,
  onRemove,
}: SortableSectionProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    setActivatorNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-transparent ${
        isDragging ? "z-10 opacity-80 shadow-lg" : ""
      }`}
    >
      <div className="mb-3 flex items-center justify-between gap-2">
        <div className="flex items-center gap-1">
          <div
            ref={setActivatorNodeRef}
            {...attributes}
            {...listeners}
            className="cursor-grab touch-none rounded p-1.5 text-gray-400 transition hover:bg-gray-100 hover:text-gray-600 active:cursor-grabbing dark:hover:bg-white/10 dark:hover:text-gray-300"
            title="Drag to reorder"
          >
            <svg className="size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8h16M4 16h16" />
            </svg>
          </div>
          <span className="text-xs font-medium text-gray-500 dark:text-gray-400">
            Section {index + 1}
          </span>
        </div>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => onMove(-1)}
            disabled={index === 0}
            title="Move up"
            className="rounded p-1.5 text-gray-600 transition hover:bg-gray-200 disabled:opacity-30 dark:text-gray-400 dark:hover:bg-white/10"
          >
            <svg className="size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
            </svg>
          </button>
          <button
            type="button"
            onClick={() => onMove(1)}
            disabled={isLast}
            title="Move down"
            className="rounded p-1.5 text-gray-600 transition hover:bg-gray-200 disabled:opacity-30 dark:text-gray-400 dark:hover:bg-white/10"
          >
            <svg className="size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
          <button
            type="button"
            onClick={onRemove}
            title="Delete section"
            className="rounded p-1.5 text-error-500 transition hover:bg-error-50 dark:hover:bg-error-500/10"
          >
            <svg className="size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        </div>
      </div>
      <div className="space-y-3">
        <div>
          <Label>Title</Label>
          <Input
            value={section.title}
            onChange={(e) => onUpdate({ title: e.target.value })}
            placeholder="Section title (shown in Table of Contents)"
          />
        </div>
        <div>
          <Label>Content</Label>
          <ArticleEditor
            value={section.content}
            onChange={(content) => onUpdate({ content })}
            placeholder="Write this section… Paste from Word, Google Docs, or any editor."
            minHeight="240px"
          />
        </div>
      </div>
    </div>
  );
}

/**
 * Repeatable sections editor for an article: each section has a Title + a rich text editor
 * (the same ArticleEditor used for the article body, so `[related id="..."]` shortcodes work).
 * Sections drive the public Table of Contents and the composed article body on the backend.
 * List order is the saved order — the backend stores `sort_order` from the array index.
 */
export default function ArticleSectionsEditor({
  value,
  onChange,
}: ArticleSectionsEditorProps) {
  const sections = value ?? [];

  // Sections are deleted and re-created on every save, so their `id` is not stable across
  // saves and unsaved sections have none. Keep a parallel list of client-side keys so a
  // reorder moves the card without remounting its editor (which would lose focus/undo).
  const keysRef = useRef<string[]>([]);
  const keySeq = useRef(0);
  if (keysRef.current.length !== sections.length) {
    const next = keysRef.current.slice(0, sections.length);
    while (next.length < sections.length) next.push(`section-${keySeq.current++}`);
    keysRef.current = next;
  }
  const keys = keysRef.current;

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const updateSection = (index: number, patch: Partial<ArticleSection>) => {
    onChange(sections.map((s, i) => (i === index ? { ...s, ...patch } : s)));
  };

  const addSection = () => {
    keysRef.current = [...keys, `section-${keySeq.current++}`];
    onChange([...sections, { title: "", content: "" }]);
  };

  const removeSection = (index: number) => {
    keysRef.current = keys.filter((_, i) => i !== index);
    onChange(sections.filter((_, i) => i !== index));
  };

  const moveSection = (index: number, dir: -1 | 1) => {
    const target = index + dir;
    if (target < 0 || target >= sections.length) return;
    keysRef.current = arrayMove(keys, index, target);
    onChange(arrayMove(sections, index, target));
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = keys.indexOf(String(active.id));
    const newIndex = keys.indexOf(String(over.id));
    if (oldIndex === -1 || newIndex === -1) return;
    keysRef.current = arrayMove(keys, oldIndex, newIndex);
    onChange(arrayMove(sections, oldIndex, newIndex));
  };

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] sm:p-6">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">
          Sections
        </h3>
        <button
          type="button"
          onClick={addSection}
          className="inline-flex items-center justify-center gap-1 rounded-lg bg-brand-500 px-3 py-2 text-sm font-medium text-white shadow-theme-xs transition hover:bg-brand-600"
        >
          + Add section
        </button>
      </div>
      <p className="mb-4 text-xs text-gray-500 dark:text-gray-400">
        Each section title appears in the article's Table of Contents and as a heading in the
        published article. Section content supports the same editor and{" "}
        <code>[related id="123"]</code> links as the main content. Drag a section by its handle
        to reorder — the Table of Contents follows this order.
      </p>

      {sections.length === 0 ? (
        <p className="rounded-lg border border-dashed border-gray-300 px-4 py-6 text-center text-sm text-gray-500 dark:border-gray-700 dark:text-gray-400">
          No sections yet. Click "Add section" to build the Table of Contents.
        </p>
      ) : (
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={keys} strategy={verticalListSortingStrategy}>
            <div className="space-y-5">
              {sections.map((section, index) => (
                <SortableSection
                  key={keys[index]}
                  id={keys[index]}
                  index={index}
                  section={section}
                  isLast={index === sections.length - 1}
                  onUpdate={(patch) => updateSection(index, patch)}
                  onMove={(dir) => moveSection(index, dir)}
                  onRemove={() => removeSection(index)}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      )}
    </div>
  );
}
