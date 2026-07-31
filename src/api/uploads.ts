/**
 * Upload API — images and documents (PDF, Office) to CDN (assets.studycafe.in/uploads/YYYY/MM/...).
 */

import { api } from "./axios";
import { isDocumentFile, isImageFile } from "../utils/media.utils";

export async function uploadImage(file: File): Promise<{ url: string }> {
  const formData = new FormData();
  formData.append("file", file);
  const res = await api.post<{ url: string }>("/admin/upload", formData);
  const body = res.data as any;
  const url = body?.data?.url || body?.url;
  if (!url || typeof url !== "string") throw new Error("Upload did not return a URL");
  return { url };
}

export async function uploadFile(
  file: File,
  onProgress?: (pct: number) => void,
): Promise<{ url: string }> {
  const formData = new FormData();
  formData.append("file", file);
  const res = await api.post<{ url: string }>("/admin/upload-file", formData, {
    onUploadProgress: onProgress
      ? (e) => {
          if (e.total) onProgress(Math.round((e.loaded * 100) / e.total));
        }
      : undefined,
  });
  const body = res.data as { url?: string; data?: { url?: string } };
  const url = body?.data?.url || body?.url;
  if (!url || typeof url !== "string") throw new Error("Upload did not return a URL");
  return { url };
}

/** Upload image or document; server registers library media when applicable. */
export async function uploadMedia(
  file: File,
  onProgress?: (pct: number) => void,
): Promise<{ url: string; mimeType?: string }> {
  if (isImageFile(file)) {
    const { url } = await uploadImage(file);
    return { url, mimeType: file.type || undefined };
  }
  if (isDocumentFile(file)) {
    const { url } = await uploadFile(file, onProgress);
    return { url, mimeType: file.type || undefined };
  }
  throw new Error("Unsupported file type. Use images (PNG, JPG, WebP, GIF, SVG), PDF/Office documents, or ZIP archives.");
}
