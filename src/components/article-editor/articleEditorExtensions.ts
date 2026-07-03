import StarterKit from "@tiptap/starter-kit";
import Blockquote from "@tiptap/extension-blockquote";
import Placeholder from "@tiptap/extension-placeholder";
import Underline from "@tiptap/extension-underline";
import Link from "@tiptap/extension-link";
import Highlight from "@tiptap/extension-highlight";
import Subscript from "@tiptap/extension-subscript";
import Superscript from "@tiptap/extension-superscript";
import TextAlign from "@tiptap/extension-text-align";
import { Table } from "@tiptap/extension-table";
import TableRow from "@tiptap/extension-table-row";
import TableCell from "@tiptap/extension-table-cell";
import TableHeader from "@tiptap/extension-table-header";
import ImageResize from "tiptap-extension-resize-image";
import { LINK_EXTENSION_OPTIONS } from "../form/EditorLinkControls";
import { ArticleHtmlEmbed } from "./ArticleHtmlEmbed";
import { OEMBED_BLOCKQUOTE, isTwitterLikeBlockquote } from "./embedHtml";

/** Regular pull-quotes only — Twitter/social oembed blockquotes use ArticleHtmlEmbed. */
const ArticleBlockquote = Blockquote.extend({
  parseHTML() {
    return [
      {
        tag: "blockquote",
        getAttrs: (node) => {
          const el = node as HTMLElement;
          if (OEMBED_BLOCKQUOTE.test(el.className || "")) return false;
          if (isTwitterLikeBlockquote(el)) return false;
          return {};
        },
      },
    ];
  },
});

export function createArticleEditorExtensions(placeholder: string) {
  return [
    StarterKit.configure({
      blockquote: false,
    }),
    ArticleBlockquote,
    Placeholder.configure({ placeholder }),
    Underline,
    Link.configure(LINK_EXTENSION_OPTIONS),
    Highlight.configure({ multicolor: false }),
    Subscript,
    Superscript,
    TextAlign.configure({ types: ["heading", "paragraph", "image"] }),
    ImageResize,
    Table.configure({
      resizable: true,
      HTMLAttributes: { class: "article-table" },
    }),
    TableRow,
    TableHeader,
    TableCell,
    ArticleHtmlEmbed,
  ];
}
