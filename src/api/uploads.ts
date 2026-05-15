/**
 * Image upload API. Uploads file to backend, returns public URL.
 */

import { api } from "./axios";

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
  const url =
    res.data && typeof res.data === "object" && "url" in res.data
      ? (res.data as { url: string }).url
      : null;
  if (!url || typeof url !== "string") throw new Error("Upload did not return a URL");
  return { url };
}
