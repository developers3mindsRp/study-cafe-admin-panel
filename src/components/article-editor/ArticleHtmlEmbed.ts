import { Node, mergeAttributes } from "@tiptap/core";
import { encodeEmbedHtml, decodeEmbedHtml, OEMBED_BLOCKQUOTE, isTwitterLikeBlockquote, canonicalizeEmbedHtml } from "./embedHtml";

/**
 * Atomic block for pasted iframe / oembed HTML.
 * Editor shows a live preview; saved HTML uses a marker expanded on export.
 */
export const ArticleHtmlEmbed = Node.create({
  name: "articleHtmlEmbed",
  group: "block",
  atom: true,
  draggable: true,

  addAttributes() {
    return {
      html: {
        default: "",
      },
    };
  },

  parseHTML() {
    return [
      {
        tag: "div[data-article-embed-b64]",
        priority: 100,
        getAttrs: (el) => {
          const b64 = (el as HTMLElement).getAttribute("data-article-embed-b64") || "";
          return { html: b64 ? decodeEmbedHtml(b64) : "" };
        },
      },
      {
        tag: "blockquote",
        priority: 100,
        getAttrs: (el) => {
          const node = el as HTMLElement;
          const cls = node.className || "";
          if (OEMBED_BLOCKQUOTE.test(cls) || isTwitterLikeBlockquote(node)) {
            return { html: canonicalizeEmbedHtml(node.outerHTML) };
          }
          return false;
        },
      },
      {
        tag: "iframe",
        priority: 100,
        getAttrs: (el) => ({ html: (el as HTMLElement).outerHTML }),
      },
    ];
  },

  renderHTML({ node }) {
    const encoded = encodeEmbedHtml(node.attrs.html || "");
    return [
      "div",
      mergeAttributes({
        "data-article-embed-b64": encoded,
        class: "article-html-embed-marker",
      }),
    ];
  },

  addNodeView() {
    return ({ node }) => {
      const dom = document.createElement("div");
      dom.className = "article-html-embed article-html-embed--editor";
      dom.contentEditable = "false";

      const label = document.createElement("div");
      label.className = "article-html-embed__label";
      label.textContent = "Embed";

      const preview = document.createElement("div");
      preview.className = "article-html-embed__preview";
      preview.innerHTML = node.attrs.html || "";

      dom.append(label, preview);
      return { dom };
    };
  },
});
