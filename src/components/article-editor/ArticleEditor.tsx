import { useEffect, useRef, useState } from "react";
import { toast } from "react-toastify";
import { useEditor, EditorContent } from "@tiptap/react";
import { uploadMedia } from "../../api/uploads";
import MediaPickerModal from "../media/MediaPickerModal";
import type { Editor } from "@tiptap/core";
import { LinkBubbleMenu, LinkToolbarButton } from "../form/EditorLinkControls";
import { ArticleBodyJSON } from "./types";
import { createArticleEditorExtensions } from "./articleEditorExtensions";
import {
  compactEmbedsToMarkersInHtml,
  canonicalizeEmbedHtml,
  extractEmbedHtmlFromPaste,
  extractEmbedHtmlFromPlainText,
  prepareArticleContentForStorage,
  tsvToTableHtml,
} from "./embedHtml";

/** Matches legacy [related id="123"] shortcodes — same pattern as public ArticleBody. */
const RELATED_SHORTCODE_REGEX = /\[related\s+id=['"](\d+)['"]\]/gi;

/**
 * Detect legacy migrated HTML that has no block-level elements (flat inline HTML).
 * Such content was migrated from other CMSes and stored without <p> wrappers.
 * TipTap would load it as one single paragraph — this preprocessor splits it into
 * proper paragraphs using [related id="..."] shortcodes (bare or span-wrapped) as
 * natural boundary markers, and also splits on double <br> patterns.
 */
function addParagraphStructureIfNeeded(html: string): string {
  if (!html?.trim()) return html;

  // Already has block-level structure — no preprocessing needed
  if (/<(p|h[1-6]|ul|ol|blockquote|pre|table|div|hr)\b/i.test(html)) {
    return html;
  }

  const isRelatedShortcode = (text: string) =>
    /^\s*\[related\s+id=['"]\d+['"]\]\s*$/i.test(text);

  // Flat inline HTML detected. Use [related id="..."] shortcodes as paragraph separators.
  let processed = html
    // Normalize <br />, <BR>, etc. to <br>
    .replace(/<br\s*\/?>/gi, "<br>")
    // Double <br> → paragraph separator marker
    .replace(/<br><br>/g, "||PARA_BREAK||")
    // Span-wrapped shortcodes → normalize to bare shortcode between markers
    .replace(
      /<span[^>]*>(\[related\s+id=['"]\d+['"]\])<\/span>/gi,
      "||PARA_BREAK||$1||PARA_BREAK||",
    )
    // Bare shortcodes (e.g. migrated articles without span wrapper)
    .replace(
      RELATED_SHORTCODE_REGEX,
      "||PARA_BREAK||[related id=\"$1\"]||PARA_BREAK||",
    );

  const parts = processed.split("||PARA_BREAK||");

  const paragraphs = parts
    .map((part) => {
      const trimmed = part.trim();
      if (!trimmed) return "";
      // Shortcode — keep as a bare block, not wrapped in <p>
      if (isRelatedShortcode(trimmed)) {
        return trimmed;
      }
      // Remove any leading/trailing single <br>
      const cleaned = trimmed.replace(/^<br>|<br>$/g, "").trim();
      return cleaned ? `<p>${cleaned}</p>` : "";
    })
    .filter(Boolean);

  return paragraphs.join("\n") || html;
}

interface ArticleEditorProps {
  value?: string;
  onChange?: (html: string) => void;
  placeholder?: string;
  minHeight?: string | number;
  editable?: boolean;
  className?: string;
}

function Toolbar({ editor }: { editor: Editor | null }) {
  const [mediaOpen, setMediaOpen] = useState(false);
  const [imageUploading, setImageUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!editor) return null;

  const addImage = () => {
    // Prompt the user for a choice: URL or Upload?
    // A simple way is to just trigger the file picker, but if they cancel we could ask for URL,
    // or we just rely on file upload for the button and keep URL for pasting.
    // Let's open the file picker.
    fileInputRef.current?.click();
  };

  const insertImage = (url: string) => {
    // @ts-ignore - tiptap-extension-resize-image doesn't extend ChainedCommands properly
    editor.chain().focus().setImage({ src: url }).run();
  };

  const insertDocumentLink = (url: string, label?: string) => {
    const text = label || url.split("/").pop() || "Download";
    editor
      .chain()
      .focus()
      .insertContent(`<a href="${url}" target="_blank" rel="noopener noreferrer">${text}</a>`)
      .run();
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = "";
    setImageUploading(true);
    try {
      const { url } = await uploadMedia(file);
      insertImage(url);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setImageUploading(false);
    }
  };

  const insertEmbedCode = () => {
    const raw = window.prompt(
      "Paste embed code (iframe, YouTube, Twitter, etc.):",
      "",
    );
    if (!raw?.trim()) return;
    const html = extractEmbedHtmlFromPlainText(raw) ?? extractEmbedHtmlFromPaste(raw);
    if (!html || !/^<(?:iframe|blockquote)\b/i.test(html)) {
      toast.error("Could not read embed code. Paste a full <iframe> or Twitter/Instagram blockquote.");
      return;
    }
    const canonical = canonicalizeEmbedHtml(html);
    editor
      .chain()
      .focus()
      .insertContent({ type: "articleHtmlEmbed", attrs: { html: canonical } })
      .run();
  };

  // const insertTable = () => {
  //   editor
  //     .chain()
  //     .focus()
  //     .insertTable({ rows: 3, cols: 3, withHeaderRow: true })
  //     .run();
  // };

  return (
    <>
    <MediaPickerModal
      open={mediaOpen}
      onClose={() => setMediaOpen(false)}
      onSelectImage={insertImage}
      onSelectLink={insertDocumentLink}
    />
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
          className={`rounded px-2 py-1 text-sm font-medium transition ${editor.isActive("heading", { level: level as 1 | 2 | 3 })
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
        className={`rounded p-1.5 transition ${editor.isActive("bulletList")
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
        className={`rounded p-1.5 transition ${editor.isActive("orderedList")
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
        className={`rounded px-2 py-1 text-sm font-medium transition ${editor.isActive("bold")
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
        className={`rounded px-2 py-1 text-sm font-medium transition italic ${editor.isActive("italic")
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
        className={`rounded px-2 py-1 text-sm font-medium transition line-through ${editor.isActive("strike")
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
        className={`rounded px-2 py-1 font-mono text-sm transition ${editor.isActive("code")
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
        className={`rounded px-2 py-1 text-sm font-medium underline transition ${editor.isActive("underline")
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
        className={`rounded px-2 py-1 text-sm font-medium transition ${editor.isActive("highlight")
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

      {/* Image upload + Media library */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleImageUpload}
        accept="image/png, image/gif, image/jpeg, image/webp, image/svg+xml"
        className="hidden"
      />
      <button
        type="button"
        onClick={addImage}
        disabled={imageUploading}
        className="rounded p-1.5 text-gray-600 transition hover:bg-gray-200 disabled:opacity-40 dark:text-gray-400 dark:hover:bg-white/10"
        title="Upload image to CDN"
      >
        <svg className="size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      </button>
      <button
        type="button"
        onClick={() => setMediaOpen(true)}
        className="rounded px-2 py-1 text-xs font-medium text-gray-600 transition hover:bg-gray-200 dark:text-gray-400 dark:hover:bg-white/10"
        title="Media library — images, PDFs, copy link"
      >
        Media
      </button>

      <button
        type="button"
        onClick={() => editor.chain().focus().toggleSubscript().run()}
        className={`rounded px-2 py-1 text-xs transition ${editor.isActive("subscript")
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
        className={`rounded px-2 py-1 text-xs transition ${editor.isActive("superscript")
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
          className={`rounded p-1.5 transition ${editor.isActive({ textAlign: align })
            ? "bg-brand-100 text-brand-600 dark:bg-brand-500/20 dark:text-brand-400"
            : "text-gray-600 hover:bg-gray-200 dark:text-gray-400 dark:hover:bg-white/10"
            }`}
          title={`Align ${align}`}
        >
          {align === "left" && (
            <svg className="size-4" fill="currentColor" viewBox="0 0 24 24">
              <path d="M4 5h16v2H4V5zm0 4h12v2H4V9zm0 4h16v2H4v-2zm0 4h16v2H4v-2z" />
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

      {/* <button
        type="button"
        onClick={insertTable}
        className="rounded px-2 py-1 text-xs font-medium text-gray-600 transition hover:bg-gray-200 dark:text-gray-400 dark:hover:bg-white/10"
        title="Insert table"
      >
        Table
      </button> */}
      <button
        type="button"
        onClick={insertEmbedCode}
        className="rounded px-2 py-1 text-xs font-medium text-gray-600 transition hover:bg-gray-200 dark:text-gray-400 dark:hover:bg-white/10"
        title="Paste iframe / embed code"
      >
        Embed
      </button>
      <span className="mx-0.5 w-px self-stretch bg-gray-200 dark:bg-gray-700" />

      {/* Blockquote */}
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleBlockquote().run()}
        className={`rounded p-1.5 transition ${editor.isActive("blockquote")
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
    </>
  );
}

export default function ArticleEditor({
  value = "",
  onChange,
  placeholder = "Write your article… Paste from Word, Google Docs, or any editor.",
  minHeight = "400px",
  editable = true,
  className = "",
}: ArticleEditorProps) {
  const [initialSyncDone, setInitialSyncDone] = useState(false);
  const editorRef = useRef<Editor | null>(null);

  const editor = useEditor({
    extensions: createArticleEditorExtensions(placeholder),
    content: "",
    editable,
    immediatelyRender: false,
    onUpdate: ({ editor: e }) => {
      onChange?.(prepareArticleContentForStorage(e.getHTML()));
    },
    editorProps: {
      attributes: {
        class: "tiptap px-4 py-3 min-h-[200px] focus:outline-none",
      },
      handlePaste: (_view, event) => {
        const ed = editorRef.current;
        if (!ed) return false;
        const html = event.clipboardData?.getData("text/html") || "";
        const text = event.clipboardData?.getData("text/plain") || "";

        const embedHtml =
          (html && extractEmbedHtmlFromPaste(html)) ||
          extractEmbedHtmlFromPlainText(text);
        if (embedHtml) {
          const canonical = canonicalizeEmbedHtml(embedHtml);
          ed
            .chain()
            .focus()
            .insertContent({ type: "articleHtmlEmbed", attrs: { html: canonical } })
            .run();
          return true;
        }

        if (!html && text.includes("\t") && text.includes("\n")) {
          const tableHtml = tsvToTableHtml(text);
          if (tableHtml) {
            ed.chain().focus().insertContent(tableHtml).run();
            return true;
          }
        }

        return false;
      },
    },
  });

  useEffect(() => {
    editorRef.current = editor;
  }, [editor]);

  // Sync value when it changes externally
  useEffect(() => {
    if (!editor || value === undefined) return;
    const trimmed = typeof value === "string" ? value.trim() : "";

    // First time loading content into the editor
    if (!initialSyncDone) {
      if (!trimmed) {
        setInitialSyncDone(true);
        return;
      }

      try {
        if (trimmed.startsWith("{")) {
          const parsed = JSON.parse(trimmed) as ArticleBodyJSON;
          if (parsed && typeof parsed === "object" && parsed.type === "doc") {
            // It's a legacy JSON doc, load it
            editor.commands.setContent(parsed, { emitUpdate: false });
            // Let the parent know we've converted to HTML so they can save it
            setTimeout(() => {
              onChange?.(prepareArticleContentForStorage(editor.getHTML()));
            }, 0);
            setInitialSyncDone(true);
            return;
          }
        }
      } catch {
        // Not JSON
      }

      // Load as HTML — compact legacy expanded embeds into markers, then restore paragraphs
      const withEmbeds = compactEmbedsToMarkersInHtml(trimmed);
      const processedHtml = addParagraphStructureIfNeeded(withEmbeds);
      editor.commands.setContent(processedHtml, { emitUpdate: false });
      setInitialSyncDone(true);

      if (withEmbeds !== trimmed) {
        setTimeout(() => {
          onChange?.(prepareArticleContentForStorage(editor.getHTML()));
        }, 0);
      } else if (processedHtml !== trimmed) {
        setTimeout(() => {
          onChange?.(prepareArticleContentForStorage(editor.getHTML()));
        }, 0);
      }
      return;
    }

    // Subsequent updates (e.g., from form resets)
    if (initialSyncDone) {
      // Don't update if it's deeply equal to avoid infinite loops,
      // but if the parent pushes an entirely new HTML string, we should respect it
      const currentHtml = editor.getHTML();
      if (trimmed !== currentHtml && trimmed !== "<p></p>" && !trimmed.startsWith("{")) {
        editor.commands.setContent(compactEmbedsToMarkersInHtml(trimmed), { emitUpdate: false });
      }
    }
  }, [value, editor, initialSyncDone, onChange]);

  return (
    <div
      className={`overflow-hidden rounded-lg border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-900 ${className}`}
    >
      {editable && <Toolbar editor={editor} />}
      <div
        className="rich-text-editor-content"
        style={{
          minHeight: typeof minHeight === "number" ? `${minHeight}px` : minHeight,
        }}
      >
        <EditorContent editor={editor} />
        {editable && <LinkBubbleMenu editor={editor} />}
      </div>
    </div>
  );
}
