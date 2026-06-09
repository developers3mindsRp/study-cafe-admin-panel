import { useEffect, useRef, useState } from "react";
import { BubbleMenu } from "@tiptap/react/menus";
import type { Editor } from "@tiptap/core";

export const LINK_EXTENSION_OPTIONS = {
  openOnClick: false,
  enableClickSelection: true,
  autolink: true,
  linkOnPaste: true,
  defaultProtocol: "https",
  HTMLAttributes: { target: "_blank", rel: "noopener noreferrer" },
} as const;

function removeLink(editor: Editor) {
  editor.chain().focus().extendMarkRange("link").unsetLink().run();
}

function applyLink(editor: Editor, url: string) {
  const trimmed = url.trim();
  if (!trimmed) {
    removeLink(editor);
    return;
  }
  editor.chain().focus().extendMarkRange("link").setLink({ href: trimmed }).run();
}

function getActiveLinkHref(editor: Editor) {
  return (editor.getAttributes("link").href as string | undefined) || "";
}

interface LinkToolbarButtonProps {
  editor: Editor;
}

export function LinkToolbarButton({ editor }: LinkToolbarButtonProps) {
  const [linkUrl, setLinkUrl] = useState("");
  const [showLinkInput, setShowLinkInput] = useState(false);
  const linkInputRef = useRef<HTMLDivElement>(null);
  const isLinkActive = editor.isActive("link");
  const activeHref = getActiveLinkHref(editor);

  useEffect(() => {
    if (!showLinkInput) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (linkInputRef.current && !linkInputRef.current.contains(e.target as Node)) {
        setShowLinkInput(false);
      }
    };
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") setShowLinkInput(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [showLinkInput]);

  const openPopover = () => {
    setLinkUrl(getActiveLinkHref(editor));
    setShowLinkInput(true);
  };

  const handleApply = () => {
    applyLink(editor, linkUrl);
    setShowLinkInput(false);
    setLinkUrl("");
  };

  const handleRemove = () => {
    removeLink(editor);
    setShowLinkInput(false);
    setLinkUrl("");
  };

  return (
    <div className="relative" ref={linkInputRef}>
      <button
        type="button"
        onClick={() => (showLinkInput ? setShowLinkInput(false) : openPopover())}
        className={`rounded p-1.5 transition ${
          isLinkActive
            ? "bg-brand-100 text-brand-600 dark:bg-brand-500/20 dark:text-brand-400"
            : "text-gray-600 hover:bg-gray-200 dark:text-gray-400 dark:hover:bg-white/10"
        }`}
        title={isLinkActive ? "Edit link" : "Add link"}
      >
        <svg className="size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"
          />
        </svg>
      </button>
      {showLinkInput && (
        <div className="absolute left-0 top-full z-20 mt-1 min-w-[18rem] rounded-lg border border-gray-200 bg-white p-2 shadow-lg dark:border-gray-700 dark:bg-gray-800">
          <label className="mb-1 block text-xs font-medium text-gray-500 dark:text-gray-400">
            {isLinkActive ? "Edit link URL" : "Link URL"}
          </label>
          <div className="flex gap-1">
            <input
              type="url"
              value={linkUrl}
              onChange={(e) => setLinkUrl(e.target.value)}
              placeholder="https://"
              className="h-8 min-w-0 flex-1 rounded border border-gray-200 px-2 text-sm dark:border-gray-600 dark:bg-gray-900 dark:text-white"
              onKeyDown={(e) => {
                if (e.key === "Enter") handleApply();
                if (e.key === "Escape") setShowLinkInput(false);
              }}
              autoFocus
            />
            <button
              type="button"
              onClick={handleApply}
              className="shrink-0 rounded bg-brand-500 px-2 py-1 text-sm text-white hover:bg-brand-600"
            >
              Apply
            </button>
          </div>
          {isLinkActive && (
            <div className="mt-2 flex flex-wrap items-center gap-2 border-t border-gray-100 pt-2 dark:border-gray-700">
              <button
                type="button"
                onClick={handleRemove}
                className="rounded px-2 py-1 text-xs font-medium text-red-600 transition hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-500/10"
              >
                Remove link
              </button>
              {activeHref && (
                <a
                  href={activeHref}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="rounded px-2 py-1 text-xs font-medium text-brand-600 transition hover:bg-brand-50 dark:text-brand-400 dark:hover:bg-brand-500/10"
                >
                  Open link ↗
                </a>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

interface LinkBubbleMenuProps {
  editor: Editor | null;
}

export function LinkBubbleMenu({ editor }: LinkBubbleMenuProps) {
  const [editing, setEditing] = useState(false);
  const [linkUrl, setLinkUrl] = useState("");

  if (!editor) return null;

  const activeHref = getActiveLinkHref(editor);

  const handleApply = () => {
    applyLink(editor, linkUrl);
    setEditing(false);
    setLinkUrl("");
  };

  const handleRemove = () => {
    removeLink(editor);
    setEditing(false);
    setLinkUrl("");
  };

  return (
    <BubbleMenu
      editor={editor}
      pluginKey="linkBubbleMenu"
      shouldShow={({ editor: e }) => e.isActive("link")}
      options={{
        onHide: () => {
          setEditing(false);
          setLinkUrl("");
        },
      }}
      className="flex items-center gap-1 rounded-lg border border-gray-200 bg-white px-1 py-1 shadow-lg dark:border-gray-700 dark:bg-gray-800"
    >
      {editing ? (
        <>
          <input
            type="url"
            value={linkUrl}
            onChange={(e) => setLinkUrl(e.target.value)}
            placeholder="https://"
            className="h-7 w-52 rounded border border-gray-200 px-2 text-xs dark:border-gray-600 dark:bg-gray-900 dark:text-white"
            onKeyDown={(e) => {
              if (e.key === "Enter") handleApply();
              if (e.key === "Escape") setEditing(false);
            }}
            autoFocus
          />
          <button
            type="button"
            onClick={handleApply}
            className="rounded px-2 py-1 text-xs font-medium text-brand-600 hover:bg-brand-50 dark:text-brand-400 dark:hover:bg-brand-500/10"
          >
            Save
          </button>
        </>
      ) : (
        <>
          <span
            className="max-w-[12rem] truncate px-1 text-xs text-gray-600 dark:text-gray-300"
            title={activeHref}
          >
            {activeHref}
          </span>
          <button
            type="button"
            onClick={() => {
              setLinkUrl(activeHref);
              setEditing(true);
            }}
            className="rounded px-2 py-1 text-xs font-medium text-gray-700 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-white/10"
          >
            Edit
          </button>
          <button
            type="button"
            onClick={handleRemove}
            className="rounded px-2 py-1 text-xs font-medium text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-500/10"
          >
            Remove
          </button>
          {activeHref && (
            <a
              href={activeHref}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded px-2 py-1 text-xs font-medium text-brand-600 hover:bg-brand-50 dark:text-brand-400 dark:hover:bg-brand-500/10"
              title="Open in new tab"
            >
              ↗
            </a>
          )}
        </>
      )}
    </BubbleMenu>
  );
}
