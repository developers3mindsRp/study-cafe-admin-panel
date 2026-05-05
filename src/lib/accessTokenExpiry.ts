/**
 * Read JWT `exp` (seconds since epoch) without verifying — matches server-side decode for session UX only.
 */
export function accessTokenExpiryMs(token: string): number | undefined {
  try {
    const seg = token.split(".")[1];
    if (!seg) return undefined;
    const json = JSON.parse(atob(seg.replace(/-/g, "+").replace(/_/g, "/"))) as {
      exp?: number;
    };
    if (typeof json.exp !== "number") return undefined;
    return json.exp * 1000;
  } catch {
    return undefined;
  }
}
