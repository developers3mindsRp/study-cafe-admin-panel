
export const getImageUrl = (value: string) => {
  if (!value) return "";

  // If path is already absolute, return it as is
  if (value.startsWith("http://") || value.startsWith("https://")) return value;

  const base =
    typeof import.meta !== "undefined" && import.meta.env?.VITE_API_BASE_URL
      ? String(import.meta.env.VITE_API_BASE_URL).replace(/\/$/, "")
      : "/api";

  const origin = base.replace(/\/api\/?$/, "");

  // Handle paths starting with /api/
  if (value.startsWith("/api/")) {
    // We've confirmed production requires the /api/ prefix
    return origin ? `${origin}${value}` : value;
  }

  // Handle paths starting with /uploads/
  if (value.startsWith("/uploads/")) {
    return origin ? `${origin}/api${value}` : `/api${value}`;
  }

  return `${origin}${value.startsWith("/") ? "" : "/"}${value}`;
};
