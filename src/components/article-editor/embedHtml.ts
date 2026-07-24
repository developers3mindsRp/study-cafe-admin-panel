/** Encode embed HTML for safe storage inside a data attribute (editor round-trip). */
export function encodeEmbedHtml(html: string): string {
  try {
    return btoa(unescape(encodeURIComponent(html)));
  } catch {
    return "";
  }
}

export function decodeEmbedHtml(encoded: string): string {
  try {
    return decodeURIComponent(escape(atob(encoded)));
  } catch {
    return "";
  }
}

export const OEMBED_BLOCKQUOTE =
  /twitter-tweet|instagram-media|tiktok-embed|youtube|linkedin|facebook/i;

const TWITTER_STATUS_RE = /(?:twitter\.com|x\.com)\/\w+\/status\/\d+/i;

const EMBED_MARKER_RE =
  /<div[^>]*\bdata-article-embed-b64="([^"]*)"[^>]*>\s*<\/div>/gi;

export function isTwitterLikeBlockquote(el: Element): boolean {
  if (OEMBED_BLOCKQUOTE.test((el as HTMLElement).className || "")) return true;
  const html = (el as HTMLElement).innerHTML || "";
  return TWITTER_STATUS_RE.test(html) || /pic\.twitter\.com|t\.co\//i.test(html);
}

/**
 * Browsers often wrap a copied fragment with phantom empty content at the
 * start/end of the clipboard HTML — either a bare `<br>` (which ProseMirror's
 * parser then auto-wraps into an empty paragraph) or an already-wrapped
 * `<p><br></p>` — so copying a paragraph and pasting it right after itself
 * leaves stray blank lines around it. Strip leading/trailing nodes that carry
 * no real content (whitespace text, comments, bare `<br>`s, or block elements
 * containing only those).
 */
export function cleanPastedHtml(html: string): string {
  if (!html) return html;

  const doc = new DOMParser().parseFromString(html, "text/html");
  const body = doc.body;

  const isEmptyNode = (node: ChildNode): boolean => {
    if (node.nodeType === Node.COMMENT_NODE) return true;
    if (node.nodeType === Node.TEXT_NODE) return !node.textContent?.trim();
    if (node.nodeType === Node.ELEMENT_NODE) {
      const el = node as Element;
      if (el.tagName === "BR") return true;
      if (el.tagName === "P" || el.tagName === "DIV") {
        return Array.from(el.childNodes).every(isEmptyNode);
      }
      return false;
    }
    return false;
  };

  while (body.firstChild && isEmptyNode(body.firstChild)) {
    body.removeChild(body.firstChild);
  }
  while (body.lastChild && isEmptyNode(body.lastChild)) {
    body.removeChild(body.lastChild);
  }

  return body.innerHTML || html;
}

/** Strip TipTap link attrs and rebuild canonical twitter-tweet markup for storage / widgets.js. */
export function canonicalizeTwitterEmbedHtml(rawHtml: string): string {
  const doc = new DOMParser().parseFromString(`<body>${rawHtml}</body>`, "text/html");
  const bq = doc.body.querySelector("blockquote");
  if (!bq) return rawHtml;

  const statusLink = Array.from(bq.querySelectorAll("a[href]")).find((a) =>
    TWITTER_STATUS_RE.test(a.getAttribute("href") || ""),
  );
  if (!statusLink) {
    return bq.classList.contains("twitter-tweet") ? bq.outerHTML : rawHtml;
  }

  const statusHref = statusLink.getAttribute("href") || "";
  const dateText = statusLink.textContent?.trim() || "";

  const clone = bq.cloneNode(true) as HTMLElement;
  clone.querySelectorAll("a[href]").forEach((a) => {
    a.removeAttribute("target");
    a.removeAttribute("rel");
  });

  const paragraphs = Array.from(clone.querySelectorAll(":scope > p"));
  let tweetBodyHtml = "";
  let authorLine = "";

  if (paragraphs.length >= 2) {
    tweetBodyHtml = paragraphs[0].innerHTML.trim();
    authorLine = paragraphs
      .slice(1)
      .map((p) => p.innerHTML.trim())
      .join(" ");
  } else if (paragraphs.length === 1) {
    const html = paragraphs[0].innerHTML;
    const dashIdx = html.search(/(?:—|&mdash;)/);
    if (dashIdx >= 0) {
      tweetBodyHtml = html.slice(0, dashIdx).trim();
      authorLine = html.slice(dashIdx).trim();
    } else {
      tweetBodyHtml = html;
    }
  } else {
    const html = clone.innerHTML;
    const dashIdx = html.search(/(?:—|&mdash;)/);
    if (dashIdx >= 0) {
      tweetBodyHtml = html.slice(0, dashIdx).trim();
      authorLine = html.slice(dashIdx).trim();
    } else {
      tweetBodyHtml = html;
    }
  }

  authorLine = authorLine
    .replace(/^—\s*/, "")
    .replace(/^&mdash;\s*/, "")
    .replace(statusLink.outerHTML, "")
    .replace(/\s*<a[^>]*>[\s\S]*?<\/a>\s*$/i, "")
    .trim();

  const out = doc.createElement("blockquote");
  out.className = "twitter-tweet";

  const p = doc.createElement("p");
  p.setAttribute("lang", "en");
  p.setAttribute("dir", "ltr");
  p.innerHTML = tweetBodyHtml;
  out.appendChild(p);

  if (authorLine || dateText) {
    out.insertAdjacentHTML(
      "beforeend",
      `&mdash; ${authorLine}${authorLine ? " " : ""}<a href="${statusHref}">${dateText}</a>`,
    );
  }

  return out.outerHTML;
}

/** Normalize any embed HTML before it is stored inside a marker. */
export function canonicalizeEmbedHtml(rawHtml: string): string {
  const trimmed = rawHtml?.trim() || "";
  if (!trimmed) return trimmed;
  if (TWITTER_STATUS_RE.test(trimmed) || /twitter-tweet/i.test(trimmed)) {
    return canonicalizeTwitterEmbedHtml(trimmed);
  }
  return trimmed;
}

function wrapInMarker(doc: Document, el: Element, embedHtml: string): void {
  const marker = doc.createElement("div");
  marker.setAttribute("data-article-embed-b64", encodeEmbedHtml(canonicalizeEmbedHtml(embedHtml)));
  marker.className = "article-html-embed-marker";
  el.replaceWith(marker);
}

/** Pull iframe or social oembed blockquote from pasted HTML (scripts stripped). */
export function extractEmbedHtmlFromPaste(html: string): string | null {
  const doc = new DOMParser().parseFromString(html, "text/html");
  doc.querySelectorAll("script").forEach((s) => s.remove());

  const iframe = doc.querySelector("iframe");
  if (iframe) return iframe.outerHTML;

  const blockquote = Array.from(doc.querySelectorAll("blockquote")).find(
    (el) => OEMBED_BLOCKQUOTE.test(el.className || "") || isTwitterLikeBlockquote(el),
  );
  if (blockquote) return canonicalizeEmbedHtml(blockquote.outerHTML);

  const embedDiv = doc.querySelector("[data-oembed-url], .wp-block-embed__wrapper");
  if (embedDiv?.innerHTML.trim()) {
    const innerIframe = embedDiv.querySelector("iframe");
    if (innerIframe) return innerIframe.outerHTML;
    const innerBq = Array.from(embedDiv.querySelectorAll("blockquote")).find(
      (el) => OEMBED_BLOCKQUOTE.test(el.className || "") || isTwitterLikeBlockquote(el),
    );
    if (innerBq) return canonicalizeEmbedHtml(innerBq.outerHTML);
    return embedDiv.innerHTML.trim();
  }

  return null;
}

/** Plain-text clipboard that is only an iframe / embed tag. */
export function extractEmbedHtmlFromPlainText(text: string): string | null {
  const trimmed = text.trim();
  if (!/^<(?:iframe|blockquote)\b/i.test(trimmed)) return null;
  return extractEmbedHtmlFromPaste(trimmed) ?? canonicalizeEmbedHtml(trimmed);
}

/** Expand storage markers → raw embed HTML for display on site / admin view. */
export function expandEmbedMarkersInHtml(html: string): string {
  if (!html?.includes("data-article-embed-b64")) return html;
  return html.replace(EMBED_MARKER_RE, (_, b64: string) => decodeEmbedHtml(b64) || "");
}

/**
 * Wrap raw iframe / social blockquotes in storage markers so TipTap does not
 * re-parse them as regular blockquotes (which breaks Twitter embeds on reload).
 */
export function compactEmbedsToMarkersInHtml(html: string): string {
  if (!html?.trim() || typeof document === "undefined") return html;

  const doc = new DOMParser().parseFromString(`<body>${html}</body>`, "text/html");
  let changed = false;

  const blockquotes = Array.from(doc.body.querySelectorAll("blockquote")).filter(
    (el) => !el.closest("[data-article-embed-b64]") && isTwitterLikeBlockquote(el),
  );
  for (const el of blockquotes) {
    wrapInMarker(doc, el, el.outerHTML);
    changed = true;
  }

  const oembedBlockquotes = Array.from(doc.body.querySelectorAll("blockquote")).filter(
    (el) =>
      !el.closest("[data-article-embed-b64]") &&
      OEMBED_BLOCKQUOTE.test(el.className || "") &&
      !isTwitterLikeBlockquote(el),
  );
  for (const el of oembedBlockquotes) {
    wrapInMarker(doc, el, el.outerHTML);
    changed = true;
  }

  const iframes = Array.from(doc.body.querySelectorAll("iframe")).filter(
    (el) => !el.closest("[data-article-embed-b64]"),
  );
  for (const el of iframes) {
    wrapInMarker(doc, el, el.outerHTML);
    changed = true;
  }

  return changed ? doc.body.innerHTML : html;
}

/** Normalize editor HTML before persisting to the API (markers only, never raw embeds). */
export function prepareArticleContentForStorage(html: string): string {
  return compactEmbedsToMarkersInHtml(html);
}

/** Convert Excel / Sheets tab-separated paste into an HTML table. */
export function tsvToTableHtml(tsv: string): string {
  const rows = tsv
    .trim()
    .split(/\r?\n/)
    .map((line) => line.split("\t").map((cell) => cell.trim()));
  if (rows.length === 0) return "";

  const body = rows
    .map(
      (cells, rowIdx) =>
        `<tr>${cells
          .map((cell) => {
            const tag = rowIdx === 0 ? "th" : "td";
            const escaped = cell
              .replace(/&/g, "&amp;")
              .replace(/</g, "&lt;")
              .replace(/>/g, "&gt;");
            return `<${tag}>${escaped}</${tag}>`;
          })
          .join("")}</tr>`,
    )
    .join("");

  return `<table><tbody>${body}</tbody></table>`;
}
