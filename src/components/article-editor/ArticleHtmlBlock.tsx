import { useEffect, useRef } from "react";
import { hydrateSocialEmbeds } from "./socialEmbeds";

interface ArticleHtmlBlockProps {
  html: string;
  className?: string;
}

/** Renders stored article HTML (including iframe / Twitter oembed) and hydrates social widgets. */
export function ArticleHtmlBlock({ html, className = "" }: ArticleHtmlBlockProps) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el || !html.trim()) return;
    void hydrateSocialEmbeds(el);
  }, [html]);

  if (!html.trim()) return null;

  return (
    <div
      ref={ref}
      className={`article-content-preview max-w-none text-gray-800 dark:text-white/90 ${className}`.trim()}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
