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

export function getWebsiteUrl(): string {
  const v = import.meta.env["VITE_WEBSITE_URL"];
  if (!v || String(v).trim() === "") return "https://studycafe.in";
  return String(v).trim().replace(/\/$/, "");
}
