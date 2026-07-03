/**
 * ArticleContentRenderer - Renders TipTap JSON content as display-only HTML
 * Used for article preview and public-facing article pages.
 * Supports legacy content with [related id="123"] shortcodes when related_articles is provided.
 */

import type { ReactNode } from "react";
import type { JSONContent } from "@tiptap/core";
import { expandEmbedMarkersInHtml } from "./embedHtml";
import { ArticleHtmlBlock } from "./ArticleHtmlBlock";

export interface RelatedArticle {
  id: number;
  title: string;
  slug: string;
}

interface ArticleContentRendererProps {
  content: string;
  className?: string;
  /** Resolved from [related id="..."] in legacy content; used to render "Also Read" links */
  relatedArticles?: RelatedArticle[];
  /** Base URL for article links (e.g. "" for relative "/blogs/slug", or "https://studycafe.in") */
  articleUrlBase?: string;
  /** Whether to show a Table of Contents */
  showTableOfContents?: boolean;
}

interface TOCItem {
  id: string;
  text: string;
  level: number;
}

function extractText(node: JSONContent): string {
  if (node.type === "text" && node.text) return node.text;
  if (!node.content) return "";
  return node.content.map(extractText).join("");
}

function generateId(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .trim();
}

function TableOfContents({ items }: { items: TOCItem[] }) {
  if (items.length === 0) return null;

  return (
    <div className="my-8 rounded-xl border border-gray-200 bg-gray-50 p-6 dark:border-gray-800 dark:bg-white/[0.03]">
      <h3 className="mb-4 text-lg font-bold text-gray-900 dark:text-white">Table of Contents</h3>
      <nav>
        <ul className="space-y-2">
          {items.map((item) => (
            <li
              key={item.id}
              style={{ paddingLeft: `${(item.level - 2) * 1.5}rem` }}
              className="text-sm"
            >
              <a
                href={`#${item.id}`}
                className="text-blue-600 hover:underline dark:text-blue-400"
                onClick={(e) => {
                  e.preventDefault();
                  document.getElementById(item.id)?.scrollIntoView({ behavior: "smooth" });
                }}
              >
                {item.text}
              </a>
            </li>
          ))}
        </ul>
      </nav>
    </div>
  );
}

interface NodeAttrs {
  [key: string]: unknown;
}

function renderMark(text: string, marks?: { type: string; attrs?: NodeAttrs }[]): ReactNode {
  if (!marks || marks.length === 0) {
    return <>{text}</>;
  }

  let result: ReactNode = <>{text}</>;

  marks.forEach((mark) => {
    switch (mark.type) {
      case "bold":
        result = <strong>{result}</strong>;
        break;
      case "italic":
        result = <em>{result}</em>;
        break;
      case "underline":
        result = <u>{result}</u>;
        break;
      case "strike":
        result = <s>{result}</s>;
        break;
      case "code":
        result = <code className="rounded bg-gray-100 px-1.5 py-0.5 text-sm font-mono dark:bg-gray-800">{result}</code>;
        break;
      case "link":
        result = (
          <a
            href={(mark.attrs?.href as string) || "#"}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 underline hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
          >
            {result}
          </a>
        );
        break;
      case "highlight":
        result = <mark className="rounded bg-yellow-200 px-0.5 dark:bg-yellow-500/30">{result}</mark>;
        break;
      case "subscript":
        result = <sub>{result}</sub>;
        break;
      case "superscript":
        result = <sup>{result}</sup>;
        break;
    }
  });

  return result;
}

function renderTextContent(node: JSONContent): ReactNode[] {
  if (!node.content) return [];

  return node.content.map((child, idx) => {
    if (child.type === "text" && child.text) {
      return <span key={idx}>{renderMark(child.text, child.marks)}</span>;
    }
    if (child.type === "hardBreak") {
      return <br key={idx} />;
    }
    return <span key={idx}></span>;
  });
}

function getTextAlign(attrs?: NodeAttrs): string {
  if (!attrs?.textAlign) return "";
  switch (attrs.textAlign) {
    case "center":
      return "text-center";
    case "right":
      return "text-right";
    case "justify":
      return "text-justify";
    default:
      return "";
  }
}

// Custom block renderers
function AlsoReadBlock({ title, url }: { title: string; url: string }) {
  return (
    <div className="my-6 rounded-lg border-l-4 border-blue-500 bg-blue-50 p-4 dark:bg-blue-900/20">
      <div className="flex items-start gap-2">
        <span className="shrink-0 font-semibold text-blue-700 dark:text-blue-400">
          Also Read:
        </span>
        <a
          href={url || "#"}
          target="_blank"
          rel="noopener noreferrer"
          className="font-medium text-blue-600 underline hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
        >
          {title || "Untitled Article"}
        </a>
      </div>
    </div>
  );
}

function DownloadButtonBlock({ label, fileUrl }: { label: string; fileUrl: string }) {
  return (
    <div className="my-6 flex justify-center">
      <a
        href={fileUrl || "#"}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-2 rounded-lg bg-gray-800 px-6 py-3 text-sm font-medium text-white shadow-md transition hover:bg-gray-700 dark:bg-gray-700 dark:hover:bg-gray-600"
      >
        <svg className="size-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
          />
        </svg>
        {label || "Download"}
      </a>
    </div>
  );
}

function MembershipCTABlock({
  heading,
  description,
  buttonText,
  buttonUrl,
  style,
}: {
  heading: string;
  description: string;
  buttonText: string;
  buttonUrl: string;
  style: string;
}) {
  const bgClass =
    style === "gradient"
      ? "bg-gradient-to-r from-blue-600 to-blue-800"
      : "bg-blue-600";

  return (
    <div className={`my-6 rounded-xl ${bgClass} p-6 text-center text-white shadow-lg`}>
      <h3 className="mb-2 text-xl font-bold">{heading || "StudyCafe Membership"}</h3>
      {description && <p className="mb-4 text-sm text-blue-100">{description}</p>}
      <a
        href={buttonUrl || "#"}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-block rounded-lg bg-white px-6 py-2.5 text-sm font-semibold text-blue-600 shadow transition hover:bg-blue-50"
      >
        {buttonText || "Join Membership"}
      </a>
      <p className="mt-3 text-xs text-blue-200">
        In case of any Doubt regarding Membership you can mail us at contact@studycafe.in
      </p>
    </div>
  );
}

function CTABlock({
  variant,
  layout,
  title,
  description,
  buttonText,
  buttonUrl,
  imageUrl,
}: {
  variant: string;
  layout?: string;
  title: string;
  description: string;
  buttonText: string;
  buttonUrl: string;
  imageUrl: string;
}) {
  const bgColors: Record<string, string> = {
    promotion: "bg-gradient-to-r from-purple-600 to-indigo-600",
    course: "bg-gradient-to-r from-green-600 to-teal-600",
    membership: "bg-gradient-to-r from-blue-600 to-blue-800",
  };

  const isBanner = layout === "banner" && imageUrl;

  if (isBanner) {
    return (
      <div className="my-6 overflow-hidden rounded-xl border border-dashed border-gray-300 shadow-lg">
        <a
          href={buttonUrl || "#"}
          target="_blank"
          rel="noopener noreferrer"
          className="relative block min-h-[200px] w-full bg-gray-900"
        >
          <img
            src={imageUrl}
            alt=""
            className="absolute inset-0 h-full w-full object-cover opacity-90"
          />
          <div className="relative flex min-h-[200px] flex-col justify-end p-6 text-white">
            {title && (
              <p className="mb-1 text-sm font-medium uppercase tracking-wider text-white/90">
                {title}
              </p>
            )}
            {description && (
              <p className="mb-3 text-lg font-bold leading-tight">{description}</p>
            )}
            {buttonText && (
              <span className="inline-block max-w-fit rounded-lg bg-red-600 px-5 py-2.5 text-sm font-semibold text-white shadow transition hover:bg-red-700">
                {buttonText}
              </span>
            )}
          </div>
        </a>
      </div>
    );
  }

  return (
    <div className={`my-6 overflow-hidden rounded-xl ${bgColors[variant] || bgColors.promotion} shadow-lg`}>
      <div className="flex flex-col md:flex-row">
        {imageUrl && (
          <div className="md:w-1/3">
            <img src={imageUrl} alt="" className="h-48 w-full object-cover md:h-full" />
          </div>
        )}
        <div className={`p-6 text-white ${imageUrl ? "md:w-2/3" : "w-full"}`}>
          <p className="mb-1 text-xs font-medium uppercase tracking-wider text-white/70">
            {variant}
          </p>
          <h3 className="mb-2 text-xl font-bold">{title || "Special Offer"}</h3>
          {description && <p className="mb-4 text-sm text-white/90">{description}</p>}
          <a
            href={buttonUrl || "#"}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block rounded-lg bg-white px-5 py-2 text-sm font-semibold text-gray-900 shadow transition hover:bg-gray-100"
          >
            {buttonText || "Learn More"}
          </a>
        </div>
      </div>
    </div>
  );
}

function AdSlotBlock({ type }: { type: string }) {
  const sizes: Record<string, string> = {
    leaderboard: "h-24",
    rectangle: "h-64 max-w-sm mx-auto",
    sidebar: "h-64 max-w-xs mx-auto",
    inline: "h-20",
  };

  return (
    <div className={`my-6 flex items-center justify-center rounded-lg border-2 border-dashed border-gray-300 bg-gray-100 dark:border-gray-700 dark:bg-gray-800 ${sizes[type] || sizes.leaderboard}`}>
      <span className="text-sm text-gray-400 dark:text-gray-500">
        Ad: {type}
      </span>
    </div>
  );
}

function ImageWithLinkBlock({
  imageUrl,
  linkUrl,
  alt,
  caption,
}: {
  imageUrl: string;
  linkUrl?: string;
  alt?: string;
  caption?: string;
}) {
  const image = (
    <img
      src={imageUrl}
      alt={alt || ""}
      className="w-full rounded-lg object-cover"
    />
  );

  return (
    <figure className="my-6">
      {linkUrl ? (
        <a href={linkUrl} target="_blank" rel="noopener noreferrer">
          {image}
        </a>
      ) : (
        image
      )}
      {caption && (
        <figcaption className="mt-2 text-center text-sm text-gray-500 dark:text-gray-400">
          {caption}
        </figcaption>
      )}
    </figure>
  );
}

function renderNode(node: JSONContent, index: number): ReactNode {
  const key = `node-${index}`;
  const alignClass = getTextAlign(node.attrs as NodeAttrs);

  switch (node.type) {
    case "paragraph":
      return (
        <p key={key} className={`my-4 leading-relaxed text-gray-700 dark:text-gray-300 ${alignClass}`}>
          {renderTextContent(node)}
        </p>
      );

    case "heading": {
      const level = (node.attrs?.level as number) || 1;
      const headingClasses: Record<number, string> = {
        1: "text-2xl md:text-3xl font-bold mt-8 mb-4",
        2: "text-xl md:text-2xl font-bold mt-6 mb-3",
        3: "text-lg md:text-xl font-semibold mt-5 mb-2",
      };
      const baseClass = `text-gray-900 dark:text-white ${headingClasses[level] || headingClasses[2]} ${alignClass}`;
      const text = extractText(node);
      const id = generateId(text);
      const content = renderTextContent(node);

      if (level === 1) return <h1 key={key} id={id} className={baseClass}>{content}</h1>;
      if (level === 2) return <h2 key={key} id={id} className={baseClass}>{content}</h2>;
      return <h3 key={key} id={id} className={baseClass}>{content}</h3>;
    }

    case "bulletList":
      return (
        <ul key={key} className="my-4 list-disc space-y-2 pl-6 text-gray-700 dark:text-gray-300">
          {node.content?.map((item, idx) => renderNode(item, idx))}
        </ul>
      );

    case "orderedList":
      return (
        <ol key={key} className="my-4 list-decimal space-y-2 pl-6 text-gray-700 dark:text-gray-300">
          {node.content?.map((item, idx) => renderNode(item, idx))}
        </ol>
      );

    case "listItem":
      return (
        <li key={key} className="leading-relaxed">
          {node.content?.map((child, idx) => {
            if (child.type === "paragraph") {
              return <span key={idx}>{renderTextContent(child)}</span>;
            }
            return renderNode(child, idx);
          })}
        </li>
      );

    case "blockquote":
      return (
        <blockquote
          key={key}
          className="my-6 border-l-4 border-gray-300 bg-gray-50 py-4 pl-6 pr-4 italic text-gray-600 dark:border-gray-600 dark:bg-gray-800/50 dark:text-gray-400"
        >
          {node.content?.map((child, idx) => renderNode(child, idx))}
        </blockquote>
      );

    case "codeBlock":
      return (
        <pre
          key={key}
          className="my-4 overflow-x-auto rounded-lg bg-gray-900 p-4 text-sm text-gray-100 dark:bg-gray-950"
        >
          <code>{node.content?.map((c) => c.text).join("")}</code>
        </pre>
      );

    case "horizontalRule":
      return <hr key={key} className="my-8 border-gray-200 dark:border-gray-700" />;

    // Custom article blocks
    case "articleAlsoRead":
      return (
        <AlsoReadBlock
          key={key}
          title={(node.attrs?.title as string) || ""}
          url={(node.attrs?.url as string) || ""}
        />
      );

    case "articleDownloadButton":
      return (
        <DownloadButtonBlock
          key={key}
          label={(node.attrs?.label as string) || "Download"}
          fileUrl={(node.attrs?.fileUrl as string) || ""}
        />
      );

    case "articleMembershipCTA":
      return (
        <MembershipCTABlock
          key={key}
          heading={(node.attrs?.heading as string) || ""}
          description={(node.attrs?.description as string) || ""}
          buttonText={(node.attrs?.buttonText as string) || ""}
          buttonUrl={(node.attrs?.buttonUrl as string) || ""}
          style={(node.attrs?.style as string) || "gradient"}
        />
      );

    case "articleCTA":
      return (
        <CTABlock
          key={key}
          variant={(node.attrs?.variant as string) || "promotion"}
          layout={(node.attrs?.layout as string) || "default"}
          title={(node.attrs?.title as string) || ""}
          description={(node.attrs?.description as string) || ""}
          buttonText={(node.attrs?.buttonText as string) || ""}
          buttonUrl={(node.attrs?.buttonUrl as string) || ""}
          imageUrl={(node.attrs?.imageUrl as string) || ""}
        />
      );

    case "articleAdSlot":
      return (
        <AdSlotBlock
          key={key}
          type={(node.attrs?.type as string) || "leaderboard"}
        />
      );

    case "articleImageWithLink":
      return (
        <ImageWithLinkBlock
          key={key}
          imageUrl={(node.attrs?.imageUrl as string) || ""}
          linkUrl={(node.attrs?.linkUrl as string) || undefined}
          alt={(node.attrs?.alt as string) || undefined}
          caption={(node.attrs?.caption as string) || undefined}
        />
      );

    case "articleHtmlEmbed":
      return (
        <ArticleHtmlBlock
          key={key}
          html={(node.attrs?.html as string) || ""}
        />
      );

    default:
      return null;
  }
}

/** Regex to match legacy [related id="123"] shortcode */
const RELATED_SHORTCODE_REGEX = /\[related\s+id="(\d+)"\]/gi;

function renderLegacyContentWithRelated(
  content: string,
  relatedArticles: RelatedArticle[],
  articleUrlBase: string,
  showTableOfContents: boolean
): ReactNode {
  const mapById = new Map(relatedArticles.map((a) => [a.id, a]));
  const parts: ReactNode[] = [];
  let lastIndex = 0;
  let key = 0;

  const injectIds = (html: string) => {
    if (!showTableOfContents) return html;
    return html.replace(
      /<(h[23])(?:\s+[^>]*)?>([\s\S]*?)<\/h[23]>/gi,
      (_match, tag, inner) => {
        const rawText = inner.replace(/<[^>]*>?/gm, "").trim();
        const id = generateId(rawText);
        return `<${tag} id="${id}">${inner}</${tag}>`;
      }
    );
  };

  RELATED_SHORTCODE_REGEX.lastIndex = 0;
  let m: RegExpExecArray | null;
  while ((m = RELATED_SHORTCODE_REGEX.exec(content)) !== null) {
    const id = parseInt(m[1], 10);
    const before = content.slice(lastIndex, m.index);
    if (before) {
      parts.push(
        <ArticleHtmlBlock
          key={`html-${key++}`}
          html={injectIds(expandEmbedMarkersInHtml(before))}
        />
      );
    }
    const article = mapById.get(id);
    parts.push(
      <div key={`related-${key++}`} className="my-6 rounded-lg border-l-4 border-blue-500 bg-blue-50 p-4 dark:bg-blue-900/20">
        <div className="flex items-start gap-2">
          <span className="shrink-0 font-semibold text-blue-700 dark:text-blue-400">Also Read:</span>
          {article ? (
            <a
              href={articleUrlBase ? `${articleUrlBase}/blogs/${article.slug}` : `/blogs/${article.slug}`}
              target="_blank"
              rel="noopener noreferrer"
              className="font-medium text-blue-600 underline hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
            >
              {article.title || `Article #${id}`}
            </a>
          ) : (
            <span className="text-gray-500">Article #{id}</span>
          )}
        </div>
      </div>
    );
    lastIndex = RELATED_SHORTCODE_REGEX.lastIndex;
  }
  const tail = content.slice(lastIndex);
  if (tail) {
    parts.push(
      <ArticleHtmlBlock
        key={`html-${key++}`}
        html={injectIds(expandEmbedMarkersInHtml(tail))}
      />
    );
  }
  return parts;
}

export default function ArticleContentRenderer({
  content,
  className = "",
  relatedArticles = [],
  articleUrlBase = "",
  showTableOfContents = false,
}: ArticleContentRendererProps) {
  let doc: JSONContent | null = null;

  try {
    doc = JSON.parse(content) as JSONContent;
  } catch {
    if (typeof content === "string" && content.trim()) {
      const html = expandEmbedMarkersInHtml(content);
      const tocItems: TOCItem[] = [];

      if (showTableOfContents) {
        // Simple regex to find h2 and h3 in HTML
        const headingRegex = /<(h[23])(?:\s+[^>]*)?>([\s\S]*?)<\/h[23]>/gi;
        let match;
        while ((match = headingRegex.exec(html)) !== null) {
          const tag = match[1].toLowerCase();
          const level = tag === "h2" ? 2 : 3;
          // Strip HTML tags from heading text
          const rawText = match[2].replace(/<[^>]*>?/gm, "").trim();
          if (rawText) {
            tocItems.push({
              id: generateId(rawText),
              text: rawText,
              level,
            });
          }
        }
      }

      RELATED_SHORTCODE_REGEX.lastIndex = 0;
      const hasShortcode = RELATED_SHORTCODE_REGEX.test(html);
      RELATED_SHORTCODE_REGEX.lastIndex = 0;

      const htmlWithTocIds = showTableOfContents
        ? html.replace(
            /<(h[23])(?:\s+[^>]*)?>([\s\S]*?)<\/h[23]>/gi,
            (_match, tag, inner) => {
              const rawText = inner.replace(/<[^>]*>?/gm, "").trim();
              const id = generateId(rawText);
              return `<${tag} id="${id}">${inner}</${tag}>`;
            },
          )
        : html;

      return (
        <div className={`article-content ${className}`}>
          {showTableOfContents && <TableOfContents items={tocItems} />}
          {hasShortcode ? (
            renderLegacyContentWithRelated(content, relatedArticles, articleUrlBase, showTableOfContents)
          ) : (
            <ArticleHtmlBlock html={htmlWithTocIds} />
          )}
        </div>
      );
    }
    return (
      <div className="rounded-lg border border-dashed border-gray-300 bg-gray-50 p-6 text-center dark:border-gray-700 dark:bg-gray-900">
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Unable to parse content.
        </p>
      </div>
    );
  }

  if (!doc || doc.type !== "doc" || !doc.content) {
    return (
      <div className="rounded-lg border border-dashed border-gray-300 bg-gray-50 p-6 text-center dark:border-gray-700 dark:bg-gray-900">
        <p className="text-sm text-gray-500 dark:text-gray-400">No content.</p>
      </div>
    );
  }

  const tocItems: TOCItem[] = [];
  if (showTableOfContents) {
    doc.content.forEach((node) => {
      if (node.type === "heading") {
        const level = (node.attrs?.level as number) || 1;
        // Usually only include H2 and H3 in TOC
        if (level >= 2 && level <= 3) {
          const text = extractText(node);
          if (text.trim()) {
            tocItems.push({
              id: generateId(text),
              text,
              level,
            });
          }
        }
      }
    });
  }

  return (
    <div className={`article-content ${className}`}>
      {showTableOfContents && <TableOfContents items={tocItems} />}
      {doc.content.map((node, index) => renderNode(node, index))}
    </div>
  );
}
