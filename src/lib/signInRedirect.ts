import { clearStoredAuth } from "./authStorage";

/** Redirect to sign-in, preserving current page for return after login. */
export function redirectToSignIn(): void {
  if (typeof window === "undefined") return;
  clearStoredAuth();
  const redirect = encodeURIComponent(window.location.pathname + window.location.search);
  window.location.href = `/signin?redirect=${redirect}`;
}
