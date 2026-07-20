/**
 * Motion grammar — central source of truth for durations, easings, springs,
 * and reusable animation factories. Pairs with the CSS motion tokens in
 * `src/index.css` so the same easing curves apply to plain CSS transitions
 * and to JS-controlled animations.
 *
 * History:
 *   - Plan 3 of the v2 ladder: micro-interactions only (framer-motion era).
 *   - 2026-05-19: dropped framer-motion dependency in favour of anime.js v4.
 *     `useReducedMotion` now comes from `./use-reduced-motion` (matchMedia
 *     hook, no library binding). `SPRING_*` objects retained in
 *     framer-compatible shape until Phase F of the anime.js migration
 *     removes their last consumers — see
 *     `~/.claude/plans/atomic-toasting-locket.md`. New `*Anim()` factories
 *     replace the `Variants` exports for migrated components.
 *
 * Conventions for new code:
 *   - Animations live inside a `useAnime(ref, factory, deps)` hook from
 *     `./use-anime`. The factory reads `scope.matches.reducedMotion` and
 *     skips animations under that condition.
 *   - Tag animatable descendants with `data-anime="<role>"` so factory
 *     selectors stay decoupled from styling classes.
 *   - Durations in this file are seconds (CSS-friendly). anime.js consumers
 *     multiply by 1000 at the call site, or use the `*Anim()` factories
 *     which already convert.
 */
import { useEffect, useRef, useSyncExternalStore, type RefObject } from "react";
import { cubicBezier, spring } from "animejs";
import { useReducedMotion } from "./use-reduced-motion";

// ─── Duration scale (seconds) ────────────────────────────────────────
// Mirrors the --duration-* CSS vars. Numbers (not strings) so consumers
// can do arithmetic — anime.js needs ms (multiply by 1000), CSS needs s.
export const DURATION = {
  instant: 0.1,
  fast: 0.18,
  base: 0.28,
  slow: 0.48,
} as const;

// ─── Easing curves ──────────────────────────────────────────────────
// Raw 4-tuple cubic-bezier coefficients. Use `EASE_FN.*` for anime.js
// `ease:` fields (pre-wrapped with cubicBezier). Use `EASE.*` for any
// downstream that wants raw tuples (CSS or framer-motion holdovers).
// Reference: Linear / Stripe / Material 3 style.
export const EASE = {
  spring: [0.16, 1, 0.3, 1],
  out: [0, 0, 0.2, 1],
  emphasized: [0.2, 0, 0, 1],
  decelerate: [0, 0, 0.2, 1],
  accelerate: [0.4, 0, 1, 1],
} as const;

export const EASE_FN = {
  spring: cubicBezier(...EASE.spring),
  out: cubicBezier(...EASE.out),
  emphasized: cubicBezier(...EASE.emphasized),
  decelerate: cubicBezier(...EASE.decelerate),
  accelerate: cubicBezier(...EASE.accelerate),
} as const;

// ─── Spring presets ─────────────────────────────────────────────────
// Two parallel exports during the framer→anime migration:
//   - `SPRING_*` (uppercase) — framer-compatible object literals; still
//     consumed by un-migrated components in B–E. Removed in Phase F.
//   - `springAnime*` (camelCase) — anime.js spring instances built via
//     `spring({ stiffness, damping })`. Used by migrated components.
//
// Stiffness/damping values are the audit-remediation pass's tuned defaults
// (see git history 2026-05-18 audit-remediation merge).
const SPRING_PARAMS = {
  default: { stiffness: 260, damping: 26 },
  hero: { stiffness: 260, damping: 24 },
  skills: { stiffness: 280, damping: 26 },
} as const;

// Framer-compatible (no `as Transition` annotation; framer-motion accepts
// the structural shape and we no longer import its types).
export const SPRING_DEFAULT = { type: "spring", ...SPRING_PARAMS.default } as const;
export const SPRING_HERO = { type: "spring", ...SPRING_PARAMS.hero } as const;
export const SPRING_SKILLS = { type: "spring", ...SPRING_PARAMS.skills } as const;

// Anime-compatible spring instances. Pass into anime config as `ease:`.
export const springAnimeDefault = spring(SPRING_PARAMS.default);
export const springAnimeHero = spring(SPRING_PARAMS.hero);
export const springAnimeSkills = spring(SPRING_PARAMS.skills);

// Legacy framer-format helpers — removed in Phase F once SPRING_*
// consumers (currently un-migrated parts of Navbar/CodeDemo/etc.) are
// all on the anime side.
export const springTransition = SPRING_DEFAULT;
export const snappyTransition = {
  duration: DURATION.fast,
  ease: EASE.emphasized,
} as const;

// ─── Animation factories (anime.js configs) ──────────────────────────
// Replace the previous framer `Variants` exports. Each factory returns a
// plain object suitable for `animate(targets, factory())` or for inlining
// into a `createTimeline().add(targets, factory())`. Durations are ms.

export function fadeUpAnim() {
  return {
    opacity: [0, 1],
    translateY: [16, 0],
    duration: DURATION.base * 1000,
    ease: EASE_FN.emphasized,
  };
}

export function fadeInAnim() {
  return {
    opacity: [0, 1],
    duration: DURATION.base * 1000,
    ease: EASE_FN.out,
  };
}

export function scaleInAnim() {
  return {
    opacity: [0, 1],
    scale: [0.94, 1],
    ease: springAnimeDefault,
  };
}

// Horizontal shake for invalid form fields. Short, decisive, ease-out so
// the final settle is quiet. Amplitude tuned to read as feedback without
// crossing into "broken / vibrating" territory.
export function shakeFieldAnim() {
  return {
    translateX: [0, -6, 6, -4, 4, -2, 0],
    duration: 360,
    ease: EASE_FN.out,
  };
}

// SVG stroke draw-in. Consumer must set stroke-dasharray to the path length
// before animating (or use a generous fallback like 200 for lucide icons).
export function strokeDrawAnim() {
  return {
    strokeDashoffset: [200, 0],
    duration: 600,
    ease: EASE_FN.emphasized,
  };
}

// Helper for staggered children. anime.js's stagger() builds delay
// functions; this wraps the common case. Consumers compose:
//   animate(items, { ...fadeUpAnim(), delay: staggerChildren(60) })
export function staggerChildren(stepMs: number = 60, baseDelayMs: number = 0) {
  return (_: unknown, i: number) => baseDelayMs + i * stepMs;
}

// ─── Smooth-scroll feature flag ─────────────────────────────────────
// Composes the conditions under which motion-heavy features (smooth
// scroll, custom cursor) should be replaced by their static defaults.

/** Returns true if `?lite=1` is present in the URL. SSR-safe. */
function hasLiteParam(): boolean {
  if (typeof window === "undefined") return false;
  return new URLSearchParams(window.location.search).get("lite") === "1";
}

/**
 * Returns true on slow connections or when the user enabled Data Saver.
 * Uses the Network Information API (Chromium / Edge / Opera). Always
 * returns false where the API is missing (Safari, Firefox).
 */
function hasSlowConnection(): boolean {
  if (typeof navigator === "undefined") return false;
  type NetInfo = {
    saveData?: boolean;
    effectiveType?: "slow-2g" | "2g" | "3g" | "4g";
  };
  const conn = (navigator as Navigator & { connection?: NetInfo }).connection;
  if (!conn) return false;
  if (conn.saveData) return true;
  const slow: Array<NetInfo["effectiveType"]> = ["slow-2g", "2g", "3g"];
  return conn.effectiveType ? slow.includes(conn.effectiveType) : false;
}

function subscribeToFlagSources(callback: () => void): () => void {
  if (typeof window === "undefined") return () => {};
  window.addEventListener("popstate", callback);
  const conn = (navigator as Navigator & { connection?: EventTarget }).connection;
  conn?.addEventListener?.("change", callback);
  return () => {
    window.removeEventListener("popstate", callback);
    conn?.removeEventListener?.("change", callback);
  };
}

/** Returns true if `?nomo=1` is present in the URL. SSR-safe. */
function hasNoMotionParam(): boolean {
  if (typeof window === "undefined") return false;
  return new URLSearchParams(window.location.search).get("nomo") === "1";
}

/** Returns true on coarse-pointer (touch) devices. SSR-safe. */
function hasCoarsePointer(): boolean {
  if (typeof window === "undefined") return false;
  return window.matchMedia?.("(pointer: coarse)").matches ?? false;
}

/**
 * Returns true when smooth-scroll (Lenis) should hijack native scroll.
 * Lenis affects every scroll interaction on the page, so any hint of
 * degradation kills it.
 *
 * Skips on prefers-reduced-motion, `?lite=1`, `?nomo=1`, slow connections,
 * or coarse-pointer devices. SSR-safe: server snapshot is always false.
 */
export function useShouldRenderSmoothScroll(): boolean {
  const prefersReducedMotion = useReducedMotion();
  const flagsAllow = useSyncExternalStore(
    subscribeToFlagSources,
    () => !hasLiteParam() && !hasNoMotionParam() && !hasSlowConnection() && !hasCoarsePointer(),
    () => false,
  );
  if (prefersReducedMotion) return false;
  return flagsAllow;
}

// ─── Input-modality tracker ─────────────────────────────────────────
// Module-level state shared across all useInputModality consumers so
// they reach the same conclusion identically.
let lastKeyboardAt = -Infinity;
let lastPointerKind: "mouse" | "pen" | "touch" = "mouse";
const modalityListeners = new Set<() => void>();
let modalityCleanup: (() => void) | null = null;

function subscribeToModality(callback: () => void): () => void {
  if (typeof window === "undefined") return () => {};
  modalityListeners.add(callback);
  if (modalityListeners.size === 1) {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Tab") return;
      lastKeyboardAt = performance.now();
      modalityListeners.forEach((fn) => fn());
    };
    const onPointer = (e: PointerEvent) => {
      lastPointerKind = e.pointerType as "mouse" | "pen" | "touch";
      modalityListeners.forEach((fn) => fn());
    };
    window.addEventListener("keydown", onKey);
    window.addEventListener("pointerdown", onPointer);
    modalityCleanup = () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("pointerdown", onPointer);
    };
  }
  return () => {
    modalityListeners.delete(callback);
    if (modalityListeners.size === 0) {
      modalityCleanup?.();
      modalityCleanup = null;
    }
  };
}

/**
 * Tracks the user's current primary input modality so motion features
 * (custom cursor, magnetic effects) can suppress themselves when the
 * user switches to keyboard / screen-reader navigation.
 */
export function useInputModality(
  keyboardWindowMs: number = 5000,
): "pointer" | "keyboard" | "touch" {
  return useSyncExternalStore(
    subscribeToModality,
    () => {
      if (lastPointerKind === "touch") return "touch" as const;
      const since = performance.now() - lastKeyboardAt;
      if (since < keyboardWindowMs) return "keyboard" as const;
      return "pointer" as const;
    },
    () => "pointer" as const,
  );
}

/**
 * Subtle magnetic-cursor effect for buttons / nav links. Writes pointer
 * offset to `--magnetic-x` / `--magnetic-y` custom properties on the
 * element. Consumers compose these into their `transform` so the effect
 * stacks with existing hover lifts.
 *
 * No-ops under prefers-reduced-motion (custom properties stay at 0px).
 *
 * Keep `strength` small (4–8 px). Above 8 px the effect reads gimmicky.
 */
export function useMagnetic<T extends HTMLElement = HTMLElement>(
  strength: number = 6,
): RefObject<T> {
  const ref = useRef<T>(null);
  const prefersReducedMotion = useReducedMotion();

  useEffect(() => {
    if (prefersReducedMotion) return;
    const el = ref.current;
    if (!el) return;

    let rafId = 0;

    const setOffset = (x: number, y: number) => {
      cancelAnimationFrame(rafId);
      rafId = requestAnimationFrame(() => {
        el.style.setProperty("--magnetic-x", `${x}px`);
        el.style.setProperty("--magnetic-y", `${y}px`);
      });
    };

    const onMove = (e: PointerEvent) => {
      const rect = el.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;
      const dx = (e.clientX - cx) / (rect.width / 2);
      const dy = (e.clientY - cy) / (rect.height / 2);
      setOffset(dx * strength, dy * strength);
    };

    const onLeave = () => setOffset(0, 0);

    el.addEventListener("pointermove", onMove);
    el.addEventListener("pointerleave", onLeave);
    el.style.setProperty("--magnetic-x", "0px");
    el.style.setProperty("--magnetic-y", "0px");

    return () => {
      el.removeEventListener("pointermove", onMove);
      el.removeEventListener("pointerleave", onLeave);
      cancelAnimationFrame(rafId);
      el.style.removeProperty("--magnetic-x");
      el.style.removeProperty("--magnetic-y");
    };
  }, [strength, prefersReducedMotion]);

  return ref;
}

// Re-export the reduced-motion hook so existing consumers can continue
// to import it from `@/lib/motion` if they want to (avoids touching
// every file in B–E just to change an import path).
export { useReducedMotion } from "./use-reduced-motion";
