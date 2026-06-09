import { useEffect } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import Underline from "@tiptap/extension-underline";
import Link from "@tiptap/extension-link";
import Highlight from "@tiptap/extension-highlight";
import Subscript from "@tiptap/extension-subscript";
import Superscript from "@tiptap/extension-superscript";
import TextAlign from "@tiptap/extension-text-align";
import type { Editor } from "@tiptap/core";
import { LinkBubbleMenu, LinkToolbarButton, LINK_EXTENSION_OPTIONS } from "./EditorLinkControls";

interface RichTextEditorProps {
  value?: string;
  onChange?: (html: string) => void;
  placeholder?: string;
  minHeight?: string | number;
  editable?: boolean;
  className?: string;
}

function Toolbar({ editor }: { editor: Editor | null }) {
  if (!editor) return null;

  return (
    <div className="flex flex-wrap items-center gap-1 border-b border-gray-200 bg-gray-50 p-2 dark:border-gray-800 dark:bg-white/[0.03]">
      {/* Undo / Redo */}
      <button
        type="button"
        onClick={() => editor.chain().focus().undo().run()}
        disabled={!editor.can().undo()}
        className="rounded p-1.5 text-gray-600 transition hover:bg-gray-200 disabled:opacity-40 dark:text-gray-400 dark:hover:bg-white/10"
        title="Undo"
      >
        <svg className="size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
        </svg>
      </button>
      <button
        type="button"
        onClick={() => editor.chain().focus().redo().run()}
        disabled={!editor.can().redo()}
        className="rounded p-1.5 text-gray-600 transition hover:bg-gray-200 disabled:opacity-40 dark:text-gray-400 dark:hover:bg-white/10"
        title="Redo"
      >
        <svg className="size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 10h-10a8 8 0 00-8 8v2M21 10l-6 6m6-6l-6-6" />
        </svg>
      </button>
      <span className="mx-0.5 w-px self-stretch bg-gray-200 dark:bg-gray-700" />

      {/* Headings */}
      {[1, 2, 3].map((level) => (
        <button
          key={level}
          type="button"
          onClick={() => editor.chain().focus().toggleHeading({ level: level as 1 | 2 | 3 }).run()}
          className={`rounded px-2 py-1 text-sm font-medium transition ${
            editor.isActive("heading", { level: level as 1 | 2 | 3 })
              ? "bg-brand-100 text-brand-600 dark:bg-brand-500/20 dark:text-brand-400"
              : "text-gray-600 hover:bg-gray-200 dark:text-gray-400 dark:hover:bg-white/10"
          }`}
          title={`Heading ${level}`}
        >
          H{level}
        </button>
      ))}
      <span className="mx-0.5 w-px self-stretch bg-gray-200 dark:bg-gray-700" />

      {/* Lists */}
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleBulletList().run()}
        className={`rounded p-1.5 transition ${
          editor.isActive("bulletList")
            ? "bg-brand-100 text-brand-600 dark:bg-brand-500/20 dark:text-brand-400"
            : "text-gray-600 hover:bg-gray-200 dark:text-gray-400 dark:hover:bg-white/10"
        }`}
        title="Bullet list"
      >
        <svg className="size-4" fill="currentColor" viewBox="0 0 24 24">
          <path d="M4 6h2v2H4V6zm0 5h2v2H4v-2zm0 5h2v2H4v-2zm4-10h12v2H8V6zm0 5h12v2H8v-2zm0 5h12v2H8v-2z" />
        </svg>
      </button>
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
        className={`rounded p-1.5 transition ${
          editor.isActive("orderedList")
            ? "bg-brand-100 text-brand-600 dark:bg-brand-500/20 dark:text-brand-400"
            : "text-gray-600 hover:bg-gray-200 dark:text-gray-400 dark:hover:bg-white/10"
        }`}
        title="Ordered list"
      >
        <svg className="size-4" fill="currentColor" viewBox="0 0 24 24">
          <path d="M3 5h2v2H3V5zm0 5h2v2H3v-2zm0 5h2v2H3v-2zm4-8h14v2H7V2zm0 5h14v2H7V7zm0 5h14v2H7v-2z" />
        </svg>
      </button>
      <span className="mx-0.5 w-px self-stretch bg-gray-200 dark:bg-gray-700" />

      {/* Text formatting */}
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleBold().run()}
        className={`rounded px-2 py-1 text-sm font-medium transition ${
          editor.isActive("bold")
            ? "bg-brand-100 text-brand-600 dark:bg-brand-500/20 dark:text-brand-400"
            : "text-gray-600 hover:bg-gray-200 dark:text-gray-400 dark:hover:bg-white/10"
        }`}
        title="Bold"
      >
        B
      </button>
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleItalic().run()}
        className={`rounded px-2 py-1 text-sm font-medium transition italic ${
          editor.isActive("italic")
            ? "bg-brand-100 text-brand-600 dark:bg-brand-500/20 dark:text-brand-400"
            : "text-gray-600 hover:bg-gray-200 dark:text-gray-400 dark:hover:bg-white/10"
        }`}
        title="Italic"
      >
        I
      </button>
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleStrike().run()}
        className={`rounded px-2 py-1 text-sm font-medium transition line-through ${
          editor.isActive("strike")
            ? "bg-brand-100 text-brand-600 dark:bg-brand-500/20 dark:text-brand-400"
            : "text-gray-600 hover:bg-gray-200 dark:text-gray-400 dark:hover:bg-white/10"
        }`}
        title="Strike"
      >
        S
      </button>
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleCode().run()}
        className={`rounded px-2 py-1 font-mono text-sm transition ${
          editor.isActive("code")
            ? "bg-brand-100 text-brand-600 dark:bg-brand-500/20 dark:text-brand-400"
            : "text-gray-600 hover:bg-gray-200 dark:text-gray-400 dark:hover:bg-white/10"
        }`}
        title="Code"
      >
        &lt;/&gt;
      </button>
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleUnderline().run()}
        className={`rounded px-2 py-1 text-sm font-medium underline transition ${
          editor.isActive("underline")
            ? "bg-brand-100 text-brand-600 dark:bg-brand-500/20 dark:text-brand-400"
            : "text-gray-600 hover:bg-gray-200 dark:text-gray-400 dark:hover:bg-white/10"
        }`}
        title="Underline"
      >
        U
      </button>
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleHighlight().run()}
        className={`rounded px-2 py-1 text-sm font-medium transition ${
          editor.isActive("highlight")
            ? "bg-brand-100 text-brand-600 dark:bg-brand-500/20 dark:text-brand-400"
            : "text-gray-600 hover:bg-gray-200 dark:text-gray-400 dark:hover:bg-white/10"
        }`}
        title="Highlight"
      >
        <svg className="size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
        </svg>
      </button>
      <LinkToolbarButton editor={editor} />
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleSubscript().run()}
        className={`rounded px-2 py-1 text-xs transition ${
          editor.isActive("subscript")
            ? "bg-brand-100 text-brand-600 dark:bg-brand-500/20 dark:text-brand-400"
            : "text-gray-600 hover:bg-gray-200 dark:text-gray-400 dark:hover:bg-white/10"
        }`}
        title="Subscript"
      >
        x₂
      </button>
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleSuperscript().run()}
        className={`rounded px-2 py-1 text-xs transition ${
          editor.isActive("superscript")
            ? "bg-brand-100 text-brand-600 dark:bg-brand-500/20 dark:text-brand-400"
            : "text-gray-600 hover:bg-gray-200 dark:text-gray-400 dark:hover:bg-white/10"
        }`}
        title="Superscript"
      >
        x²
      </button>
      <span className="mx-0.5 w-px self-stretch bg-gray-200 dark:bg-gray-700" />

      {/* Text alignment */}
      {(["left", "center", "right", "justify"] as const).map((align) => (
        <button
          key={align}
          type="button"
          onClick={() => editor.chain().focus().setTextAlign(align).run()}
          className={`rounded p-1.5 transition ${
            editor.isActive({ textAlign: align })
              ? "bg-brand-100 text-brand-600 dark:bg-brand-500/20 dark:text-brand-400"
              : "text-gray-600 hover:bg-gray-200 dark:text-gray-400 dark:hover:bg-white/10"
          }`}
          title={`Align ${align}`}
        >
          {align === "left" && (
            <svg className="size-4" fill="currentColor" viewBox="0 0 24 24">
              <path d="M4 5h16v2H4V5zm0 4h12v2H4V9zm0 4h16v2H4v-2zm0 4h12v2H4v-2z" />
            </svg>
          )}
          {align === "center" && (
            <svg className="size-4" fill="currentColor" viewBox="0 0 24 24">
              <path d="M4 5h16v2H4V5zm2 4h12v2H6V9zm-2 4h16v2H4v-2zm2 4h12v2H6v-2z" />
            </svg>
          )}
          {align === "right" && (
            <svg className="size-4" fill="currentColor" viewBox="0 0 24 24">
              <path d="M4 5h16v2H4V5zm4 4h12v2H8V9zm-4 4h16v2H4v-2zm4 4h12v2H8v-2z" />
            </svg>
          )}
          {align === "justify" && (
            <svg className="size-4" fill="currentColor" viewBox="0 0 24 24">
              <path d="M4 5h16v2H4V5zm0 4h16v2H4V9zm0 4h16v2H4v-2zm0 4h16v2H4v-2z" />
            </svg>
          )}
        </button>
      ))}
      <span className="mx-0.5 w-px self-stretch bg-gray-200 dark:bg-gray-700" />

      {/* Blockquote */}
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleBlockquote().run()}
        className={`rounded p-1.5 transition ${
          editor.isActive("blockquote")
            ? "bg-brand-100 text-brand-600 dark:bg-brand-500/20 dark:text-brand-400"
            : "text-gray-600 hover:bg-gray-200 dark:text-gray-400 dark:hover:bg-white/10"
        }`}
        title="Blockquote"
      >
        <svg className="size-4" fill="currentColor" viewBox="0 0 24 24">
          <path d="M6 17h3l2-4V7H5v6h3l-2 4zm8 0h3l2-4V7h-6v6h3l-2 4z" />
        </svg>
      </button>
    </div>
  );
}

export default function RichTextEditor({
  value = "",
  onChange,
  placeholder = "Write something…",
  minHeight = "150px",
  editable = true,
  className = "",
}: RichTextEditorProps) {
  const editor = useEditor({
    extensions: [
      StarterKit,
      Placeholder.configure({ placeholder }),
      Underline,
      Link.configure(LINK_EXTENSION_OPTIONS),
      Highlight.configure({ multicolor: false }),
      Subscript,
      Superscript,
      TextAlign.configure({ types: ["heading", "paragraph"] }),
    ],
    content: value || "",
    editable,
    immediatelyRender: false,
    onUpdate: ({ editor }) => {
      onChange?.(editor.getHTML());
    },
    editorProps: {
      attributes: {
        class: "px-4 py-3 min-h-[120px] focus:outline-none",
      },
    },
  });

  // Sync value when it changes externally (e.g. after loading from API)
  useEffect(() => {
    if (!editor || value === undefined) return;
    const currentHtml = editor.getHTML();
    if (value !== currentHtml) {
      editor.commands.setContent(value, { emitUpdate: false });
    }
  }, [value, editor]);

  return (
    <div
      className={`overflow-hidden rounded-lg border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-900 ${className}`}
    >
      <Toolbar editor={editor} />
      <div
        className="rich-text-editor-content"
        style={{ minHeight: typeof minHeight === "number" ? `${minHeight}px` : minHeight }}
      >
        <EditorContent editor={editor} />
        {editable && <LinkBubbleMenu editor={editor} />}
      </div>
    </div>
  );
}
