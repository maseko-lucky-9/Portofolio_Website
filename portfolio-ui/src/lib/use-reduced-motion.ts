/**
 * Reduced-motion preference hook (framework-agnostic, framer-motion-free).
 *
 * Replaces the `useReducedMotion` import we used to get from framer-motion.
 * Backed by `matchMedia` + `useSyncExternalStore` so it stays SSR-safe and
 * updates reactively when the OS preference toggles mid-session.
 *
 * Returns `true` when the user has set `prefers-reduced-motion: reduce`;
 * components observe this and skip animations entirely (CSS already
 * carries the static end-state via the `@media (prefers-reduced-motion)`
 * fallbacks in `src/index.css`).
 */
import { useSyncExternalStore } from "react";

const QUERY = "(prefers-reduced-motion: reduce)";

function subscribe(callback: () => void): () => void {
  if (typeof window === "undefined") return () => {};
  const mq = window.matchMedia(QUERY);
  mq.addEventListener("change", callback);
  return () => mq.removeEventListener("change", callback);
}

function getSnapshot(): boolean {
  if (typeof window === "undefined") return false;
  return window.matchMedia(QUERY).matches;
}

function getServerSnapshot(): boolean {
  return false;
}

export function useReducedMotion(): boolean {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
