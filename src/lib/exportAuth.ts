import { ensureValidAccessToken } from "../api/axios";
import { redirectToSignIn } from "./signInRedirect";

/** Block export when there is no valid session; redirects to sign-in. */
export async function requireAuthForExport(): Promise<void> {
  const token = await ensureValidAccessToken();
  if (!token) {
    redirectToSignIn();
    throw new ExportAuthRedirectError();
  }
}

export class ExportAuthRedirectError extends Error {
  constructor() {
    super("Unauthorized");
    this.name = "ExportAuthRedirectError";
  }
}

export function isExportAuthError(err: unknown): boolean {
  if (err instanceof ExportAuthRedirectError) return true;
  if (err && typeof err === "object" && "response" in err) {
    return (err as { response?: { status?: number } }).response?.status === 401;
  }
  return false;
}

export { redirectToSignIn } from "./signInRedirect";
