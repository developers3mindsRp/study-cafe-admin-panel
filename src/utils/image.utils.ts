import { getApiBaseUrl } from "../config/env";

export const getImageUrl = (value: string) => {
  if (!value) return "";

  if (value.startsWith("http://") || value.startsWith("https://")) return value;

  const base = getApiBaseUrl();
  const origin = base.replace(/\/api\/?$/, "");

  if (value.startsWith("/api/")) {
    return `${origin}${value}`;
  }

  if (value.startsWith("/uploads/")) {
    return `${origin}/api${value}`;
  }

  return `${origin}${value.startsWith("/") ? "" : "/"}${value}`;
};
