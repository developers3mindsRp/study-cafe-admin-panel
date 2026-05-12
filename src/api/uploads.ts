/**
 * Image upload API. Uploads file to backend, returns public URL.
 */

import { api } from "./axios";

export async function uploadImage(file: File): Promise<{ url: string }> {
  const formData = new FormData();
  formData.append("file", file);
  const res = await api.post<{ url: string }>("/admin/upload", formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });
  const body = res.data as any;
  const url = body?.data?.url || body?.url;
  if (!url || typeof url !== "string") throw new Error("Upload did not return a URL");
  return { url };
}
