/**
 * Motion grammar — central source of truth for durations, easings, and
 * reusable Framer Motion variants. Pairs with the CSS motion tokens in
 * src/index.css so the same easing curves apply to plain CSS transitions
 * and to Framer-Motion-controlled elements.
 *
 * Plan 3 of the v2 ladder: micro-interactions only. No scroll-jacking,
 * no R3F, no custom cursor (Plans 4–5).
 */
import { useEffect, useRef, type RefObject } from "react";
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
