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
