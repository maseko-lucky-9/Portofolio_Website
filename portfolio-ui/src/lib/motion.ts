/**
 * Motion grammar — central source of truth for durations, easings, and
 * reusable Framer Motion variants. Pairs with the CSS motion tokens in
 * src/index.css so the same easing curves apply to plain CSS transitions
 * and to Framer-Motion-controlled elements.
 *
 * Plan 3 of the v2 ladder: micro-interactions only. No scroll-jacking,
 * no R3F, no custom cursor (Plans 4–5).
 */
import { useEffect, useRef, useSyncExternalStore, type RefObject } from "react";
import {
  useReducedMotion,
  type Transition,
  type Variants,
} from "framer-motion";

// ─── Duration scale (ms) ─────────────────────────────────────────────
// Mirrors the --duration-* CSS vars. Kept as numbers here because
// Framer Motion's `duration:` field expects seconds, not the CSS string.
export const DURATION = {
  instant: 0.10,
  fast: 0.18,
  base: 0.28,
  slow: 0.48,
} as const;

// ─── Easing curves ──────────────────────────────────────────────────
// Reference: Linear / Stripe / Material 3 style.
export const EASE = {
  spring: [0.16, 1, 0.3, 1],
  out: [0, 0, 0.2, 1],
  emphasized: [0.2, 0, 0, 1],
  decelerate: [0, 0, 0.2, 1],
  accelerate: [0.4, 0, 1, 1],
} as const;

// ─── Reusable transitions ───────────────────────────────────────────
export const springTransition: Transition = {
  type: "spring",
  stiffness: 280,
  damping: 26,
};

export const snappyTransition: Transition = {
  duration: DURATION.fast,
  ease: EASE.emphasized,
};

// ─── Reusable variants ──────────────────────────────────────────────
export const fadeUp: Variants = {
  hidden: { opacity: 0, y: 16 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: DURATION.base, ease: EASE.emphasized },
  },
};

export const fadeIn: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { duration: DURATION.base, ease: EASE.out },
  },
};

export const scaleIn: Variants = {
  hidden: { opacity: 0, scale: 0.94 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: springTransition,
  },
};

export const staggerContainer = (delay = 0, stagger = 0.06): Variants => ({
  hidden: {},
  visible: {
    transition: { delayChildren: delay, staggerChildren: stagger },
  },
});

/**
 * Returns animation props only if the user hasn't enabled reduced motion.
 * Usage: <motion.div {...useMotionProps({ initial, animate })} />
 */
export function useMotionProps<T extends Record<string, unknown>>(
  animated: T,
): T | Record<string, never> {
  const prefersReducedMotion = useReducedMotion();
  return prefersReducedMotion ? {} : animated;
}

// ─── Motion feature-flag layer ──────────────────────────────────────
// Composes the conditions under which motion-heavy features (smooth
// scroll, custom cursor) should be replaced by their static defaults.
// Single source of truth — every consumer reaches the same decision.

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
  // The Network Information API is non-standard; type it locally.
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

/**
 * Subscribes to URL changes (popstate) and connection-info changes so the
 * hook re-evaluates when the user toggles `?lite=1` or the connection
 * shifts. `useSyncExternalStore` keeps SSR safe and dedupes notifications.
 */
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

/**
 * Returns true when smooth-scroll (Lenis) should hijack native scroll.
 * Lenis affects every scroll interaction on the page, so any hint of
 * degradation kills it.
 *
 * Skips on:
 *   • prefers-reduced-motion (OS preference)
 *   • `?lite=1` (the same kill switch that disables WebGL)
 *   • `?nomo=1` (motion-specific kill switch — disables smooth scroll
 *     and custom cursor without touching WebGL)
 *   • slow connections / Data Saver (smooth-scroll's JS cost isn't
 *     justified when bandwidth is precious)
 *   • coarse-pointer devices (touch — smooth scroll competes with
 *     native momentum scroll on mobile, always worse)
 *
 * SSR-safe: server snapshot is always false; the client effect upgrades.
 */
export function useShouldRenderSmoothScroll(): boolean {
  const prefersReducedMotion = useReducedMotion();
  const flagsAllow = useSyncExternalStore(
    subscribeToFlagSources,
    () =>
      !hasLiteParam() &&
      !hasNoMotionParam() &&
      !hasSlowConnection() &&
      !hasCoarsePointer(),
    () => false,
  );
  if (prefersReducedMotion) return false;
  return flagsAllow;
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

// ─── Input-modality tracker (Plan 5) ────────────────────────────────
// Module-level state shared across all useInputModality consumers so
// they reach the same conclusion identically.
let lastKeyboardAt = -Infinity;
let lastPointerKind: "mouse" | "pen" | "touch" = "mouse";
const modalityListeners = new Set<() => void>();

function subscribeToModality(callback: () => void): () => void {
  if (typeof window === "undefined") return () => {};
  modalityListeners.add(callback);
  // Bind the global window listeners once on first subscriber.
  if (modalityListeners.size === 1) {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Tab") return; // Only Tab signals keyboard nav.
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
let modalityCleanup: (() => void) | null = null;

/**
 * Tracks the user's current primary input modality so motion features
 * (custom cursor, magnetic effects) can suppress themselves when the
 * user switches to keyboard / screen-reader navigation.
 *
 * Returns one of:
 *   • "pointer" — last interaction was mouse / pen / trackpad
 *   • "keyboard" — Tab pressed within the last `keyboardWindowMs`
 *   • "touch" — pointerdown with pointerType === "touch"
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
    () => "pointer" as const, // SSR default
  );
}

/**
 * Subtle magnetic-cursor effect for buttons / nav links.
 *
 * Tracks pointer position relative to the element's centre and writes
 * the offset to `--magnetic-x` / `--magnetic-y` custom properties on the
 * element. Consumers compose these into their `transform` so the effect
 * stacks with existing hover lifts (e.g. `.btn-hero-primary:hover`).
 *
 * Returns the ref to attach. Automatically no-ops under
 * prefers-reduced-motion (custom properties stay at their initial 0px).
 *
 * Keep `strength` small (4–8 px). Above 8 px the effect reads as gimmicky
 * rather than crafted — senior-eng audience tunes out fast.
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
    // Initialise custom props so first paint has stable values.
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
