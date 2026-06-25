function requiredViteEnv(name: string): string {
  const v = import.meta.env[name];
  if (v === undefined || v === null || String(v).trim() === "") {
    throw new Error(`Missing required environment variable: ${name}. Set it in .env (see .env.example).`);
  }
  return String(v).trim().replace(/\/$/, "");
}

export function getApiBaseUrl(): string {
  return requiredViteEnv("VITE_API_BASE_URL");
}

/**
 * Absolute URL for browser navigation (e.g. export download links).
 * VITE_API_BASE_URL is often relative (/api) in dev — `new URL("/api/...")` throws without a base.
 */
export function resolveApiAbsoluteUrl(pathFromApiRoot: string): URL {
  const base = getApiBaseUrl().replace(/\/$/, "");
  const segment = pathFromApiRoot.replace(/^\//, "");
  const href = `${base}/${segment}`;

  if (/^https?:\/\//i.test(href)) {
    return new URL(href);
  }

  const origin =
    typeof window !== "undefined" && window.location?.origin
      ? window.location.origin
      : "http://localhost";
  return new URL(href.startsWith("/") ? href : `/${href}`, origin);
}

export function getWebsiteUrl(): string {
  const v = import.meta.env["VITE_WEBSITE_URL"];
  if (!v || String(v).trim() === "") return "https://studycafe.in";
  return String(v).trim().replace(/\/$/, "");
}
