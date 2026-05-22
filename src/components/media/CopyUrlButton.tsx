import { useState } from "react";

export function CopyUrlButton({ url, className = "" }: { url: string; className?: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      const el = document.createElement("textarea");
      el.value = url;
      document.body.appendChild(el);
      el.select();
      document.execCommand("copy");
      document.body.removeChild(el);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <button
      type="button"
      onClick={handleCopy}
      title={copied ? "Copied!" : "Copy link"}
      className={`inline-flex items-center justify-center gap-1 rounded-lg px-2 py-1.5 text-xs transition ${
        copied
          ? "bg-success-50 text-success-600 dark:bg-success-500/10 dark:text-success-400"
          : "text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800"
      } ${className}`}
    >
      {copied ? "Copied" : "Copy link"}
    </button>
  );
}
