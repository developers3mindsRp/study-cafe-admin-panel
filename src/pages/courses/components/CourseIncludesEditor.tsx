import { getImageUrl } from "../../../utils/image.utils";
import Label from "../../../components/form/Label";
import Input from "../../../components/form/input/InputField";
import Button from "../../../components/ui/button/Button";
import { IconPicker } from "./IncludesInfoEditor";

export interface CourseIncludeItem {
  image: string;
  title: string;
}

interface CourseIncludesEditorProps {
  value: CourseIncludeItem[];
  onChange: (value: CourseIncludeItem[]) => void;
}

const DEFAULT_ITEM: CourseIncludeItem = { image: "", title: "" };

/**
 * Banner row "This course includes" — same icon picker as bonuses, but image + title only (no worth).
 */
export default function CourseIncludesEditor({ value, onChange }: CourseIncludesEditorProps) {
  const addItem = () => onChange([...value, { ...DEFAULT_ITEM }]);
  const removeItem = (i: number) => onChange(value.filter((_, idx) => idx !== i));
  const updateItem = (i: number, patch: Partial<CourseIncludeItem>) => {
    const next = [...value];
    next[i] = { ...next[i], ...patch };
    onChange(next);
  };

  return (
    <div className="space-y-4">
      <p className="text-xs text-gray-500 dark:text-gray-400">
        Shown in the course page banner as &quot;This course includes:&quot; — compact row with icon + text.
        (Exclusive bonuses below use a separate section.)
      </p>
      {value.map((item, i) => (
        <div
          key={i}
          className="border border-gray-200 dark:border-gray-700 rounded-xl p-4 bg-gray-50/50 dark:bg-white/[0.02] space-y-4"
        >
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">Include item {i + 1}</span>
            <button
              type="button"
              onClick={() => removeItem(i)}
              className="p-1.5 text-gray-400 hover:text-red-500 transition"
              title="Remove"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M3 6h18" />
                <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
                <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
              </svg>
            </button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-start">
            <div>
              <Label>Icon</Label>
              <IconPicker value={item.image} onChange={(v) => updateItem(i, { image: v })} />
            </div>
            <div>
              <Label>Label</Label>
              <Input
                value={item.title}
                onChange={(e) => updateItem(i, { title: e.target.value })}
                placeholder="e.g. Recording available for 1 year"
              />
            </div>
          </div>
          {(item.image || item.title) && (
            <div className="flex items-center gap-3 rounded-lg border border-dashed border-gray-300 dark:border-gray-600 bg-white dark:bg-white/[0.03] p-3">
              {item.image && (
                <img src={getImageUrl(item.image)} alt="" className="w-7 h-7 object-contain flex-shrink-0" />
              )}
              <span className="text-sm text-gray-800 dark:text-white/90">{item.title || <em className="text-gray-400">No label</em>}</span>
              <span className="text-[10px] text-gray-400 ml-auto">Banner preview</span>
            </div>
          )}
        </div>
      ))}
      <Button type="button" variant="outline" size="sm" onClick={addItem}>
        + Add include item
      </Button>
    </div>
  );
}
