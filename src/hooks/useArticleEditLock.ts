import { useEffect, useRef, useState } from "react";
import {
  acquireArticleEditLock,
  releaseArticleEditLock,
  releaseArticleEditLockOnUnload,
  type ArticleEditLockInfo,
} from "../api/articles";

/** Renew (or, when someone else holds the lock, re-check) this often. */
const HEARTBEAT_MS = 30_000;
/**
 * Stop renewing after this long without any user input. The server-side TTL
 * (2 min) then expires the lock so the article is freed for other editors
 * even though this tab is still open.
 */
const INACTIVITY_LIMIT_MS = 10 * 60_000;

export type ArticleEditLockState =
  | { status: "checking"; lockedBy: null }
  | { status: "acquired"; lockedBy: null }
  | { status: "locked"; lockedBy: ArticleEditLockInfo }
  /** Lock API unreachable — editing proceeds unguarded rather than blocking the page. */
  | { status: "unavailable"; lockedBy: null };

/**
 * Holds an exclusive edit lock on an article while the component is mounted.
 *
 * - Acquires on mount, renews every 30s while the tab is visible and the user
 *   is active, and releases on unmount and on page unload (keepalive fetch).
 * - When another admin holds the lock, keeps polling; the lock is picked up
 *   automatically once they leave (state flips "locked" → "acquired").
 * - Crashed browsers / dead networks are covered by the server-side TTL.
 */
export function useArticleEditLock(articleId: string | undefined): ArticleEditLockState {
  const [state, setState] = useState<ArticleEditLockState>({ status: "checking", lockedBy: null });
  const heldRef = useRef(false);

  useEffect(() => {
    if (!articleId) return;

    let disposed = false;
    let lastActivityAt = Date.now();

    const markActivity = () => {
      lastActivityAt = Date.now();
    };

    const attempt = async () => {
      try {
        const result = await acquireArticleEditLock(articleId);
        if (disposed) {
          // Resolved after unmount — don't leave a ghost lock behind.
          if (result.acquired) void releaseArticleEditLock(articleId).catch(() => undefined);
          return;
        }
        heldRef.current = result.acquired;
        if (result.acquired) {
          setState({ status: "acquired", lockedBy: null });
        } else if (result.lock) {
          setState({ status: "locked", lockedBy: result.lock });
        } else {
          setState({ status: "unavailable", lockedBy: null });
        }
      } catch {
        if (!disposed) {
          heldRef.current = false;
          setState({ status: "unavailable", lockedBy: null });
        }
      }
    };

    const tick = () => {
      // No renewals (or takeover attempts) from hidden or idle tabs, so a
      // walked-away editor's lock expires and background tabs never grab a
      // freed lock the user isn't looking at.
      const idle = Date.now() - lastActivityAt > INACTIVITY_LIMIT_MS;
      if (idle || document.visibilityState === "hidden") return;
      void attempt();
    };

    const onVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        markActivity();
        void attempt();
      }
    };

    const onPageHide = () => {
      if (heldRef.current) {
        heldRef.current = false;
        releaseArticleEditLockOnUnload(articleId);
      }
    };

    void attempt();
    const interval = window.setInterval(tick, HEARTBEAT_MS);
    const activityEvents = ["mousedown", "keydown", "touchstart", "scroll"] as const;
    activityEvents.forEach((ev) => window.addEventListener(ev, markActivity, { passive: true }));
    document.addEventListener("visibilitychange", onVisibilityChange);
    window.addEventListener("pagehide", onPageHide);

    return () => {
      disposed = true;
      window.clearInterval(interval);
      activityEvents.forEach((ev) => window.removeEventListener(ev, markActivity));
      document.removeEventListener("visibilitychange", onVisibilityChange);
      window.removeEventListener("pagehide", onPageHide);
      if (heldRef.current) {
        heldRef.current = false;
        void releaseArticleEditLock(articleId).catch(() => undefined);
      }
    };
  }, [articleId]);

  return state;
}
