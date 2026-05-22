import type { MediaAsset } from "../api/mediaAssets";

const IMAGE_EXT = /\.(jpe?g|png|gif|webp|svg)(\?.*)?$/i;
const DOC_EXT = /\.(pdf|doc|docx|xls|xlsx|ppt|pptx)(\?.*)?$/i;

export type MediaFileKind = "image" | "document" | "other";

export function inferMediaKind(asset: Pick<MediaAsset, "url" | "mime_type">): MediaFileKind {
  const mime = (asset.mime_type || "").toLowerCase();
  if (mime.startsWith("image/")) return "image";
  if (
    mime === "application/pdf" ||
    mime.startsWith("application/vnd.") ||
    mime === "application/msword"
  ) {
    return "document";
  }
  const url = asset.url || "";
  if (IMAGE_EXT.test(url)) return "image";
  if (DOC_EXT.test(url)) return "document";
  return "other";
}

export function isImageFile(file: File): boolean {
  return file.type.startsWith("image/") || IMAGE_EXT.test(file.name);
}

export function isDocumentFile(file: File): boolean {
  return (
    file.type === "application/pdf" ||
    file.type.startsWith("application/vnd.") ||
    file.type === "application/msword" ||
    DOC_EXT.test(file.name)
  );
}

export function fileLabel(file: File): string {
  return file.name.replace(/\.[^.]+$/, "").replace(/[-_]/g, " ").trim() || file.name;
}
