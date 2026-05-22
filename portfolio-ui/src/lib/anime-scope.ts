/**
 * anime.js v4 scope factory — central place for shared defaults + media-query
 * registration. Every component-level animation runs inside a scope so we get
 * automatic cleanup (`scope.revert()`) and reduced-motion gating without
 * scattering boilerplate.
 *
 * Pairs with `useAnime` (see `./use-anime.ts`) which is the consumer-facing
 * hook. This module just owns the configuration shape.
 *
 * Why a wrapper instead of inline `createScope`:
 *   - One place to tune global defaults (duration / easing) so they stay
 *     consistent with the CSS motion tokens in `src/index.css`.
 *   - Media-query keys are typed (`MotionScope['matches']`) so consumers get
 *     IDE completion on `scope.matches.reducedMotion`.
 *   - Single source of truth if we later add coarse-pointer or
 *     forced-colors-aware scopes.
 */
import { createScope, type Scope } from "animejs";
import { DURATION, EASE } from "./motion";

const MEDIA_QUERIES = {
  reducedMotion: "(prefers-reduced-motion: reduce)",
  coarsePointer: "(pointer: coarse)",
} as const;

export type MotionScope = Scope & {
  matches: Record<keyof typeof MEDIA_QUERIES, boolean>;
};

/**
 * Build a fresh anime.js scope rooted at the given DOM element.
 *
 * `root` may be null (component not mounted yet); callers should guard.
 * Returns the scope so the caller can `.add(...)` animations and
 * `.revert()` on cleanup.
 */
export function createMotionScope(root: HTMLElement | null): MotionScope {
  return createScope({
    root: root ?? undefined,
    defaults: {
      // anime.js durations are in ms. DURATION values are seconds (kept that
      // way for framer-motion legacy callers); multiply at scope creation.
      duration: DURATION.base * 1000,
      ease: EASE.emphasized,
    },
    mediaQueries: MEDIA_QUERIES,
  }) as MotionScope;
}
