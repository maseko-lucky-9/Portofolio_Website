/**
 * `useAnime` — canonical React hook for anime.js-driven animations.
 *
 * Replaces every ad-hoc `useEffect(() => { const anim = animate(...); return
 * () => anim.cancel() }, [...])` pattern with one consistent shape. Wraps
 * `createMotionScope` so animations register, run, and revert in a single
 * lifecycle.
 *
 * The factory callback receives the scope so consumers can read
 * `scope.matches.reducedMotion` / `scope.matches.coarsePointer` and skip
 * animations under those conditions. The scope also exposes `add(name, fn)`
 * for reusable methods if a component needs imperative triggers.
 *
 * Lifecycle:
 *   1. Mount: build scope → run factory → animations begin.
 *   2. `deps` change: revert previous scope, build fresh, re-run factory.
 *   3. Media-query change (auto-fired by anime.js's scope refresh): explicit
 *      revert-before-refactory so we never double-fire on the same elements.
 *   4. Unmount: `scope.revert()` cancels and rolls back inline styles.
 *
 * Usage:
 *   const ref = useRef<HTMLElement>(null);
 *   useAnime(ref, (scope) => {
 *     if (scope.matches.reducedMotion) return;
 *     animate(ref.current.querySelectorAll('[data-anime="item"]'), {
 *       opacity: [0, 1],
 *       translateY: [16, 0],
 *       delay: stagger(60),
 *       autoplay: onScroll({ target: ref.current, sync: 'play pause' }),
 *     });
 *   }, []);
 */
import { useEffect, type RefObject } from "react";
import { createMotionScope, type MotionScope } from "./anime-scope";

export type AnimeFactory = (scope: MotionScope) => void | (() => void);

/**
 * Run an animation factory inside a scope keyed to `rootRef.current`.
 *
 * @param rootRef  Element to scope animations under. Animations querying
 *                 selectors are constrained to descendants of this element.
 * @param factory  Receives the scope. May return a cleanup function for any
 *                 listeners the factory adds outside scope.add(); scope's own
 *                 animations are reverted automatically.
 * @param deps     When any dep changes, the previous scope is reverted and
 *                 the factory re-runs. Pass `[]` for mount-only effects.
 */
export function useAnime<T extends HTMLElement>(
  rootRef: RefObject<T | null>,
  factory: AnimeFactory,
  deps: unknown[],
): void {
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;

    const scope = createMotionScope(root);
    let factoryCleanup: void | (() => void);

    scope.add(() => {
      factoryCleanup = factory(scope);
    });

    return () => {
      try {
        factoryCleanup?.();
      } finally {
        scope.revert();
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
}
