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
import { animate, stagger, type AnimationParams } from "animejs";
import { createMotionScope, type MotionScope } from "./anime-scope";
import { fadeUpAnim } from "./motion";

export type AnimeFactory = (scope: MotionScope) => void | (() => void);

/**
 * Section reveal helper — the canonical "fade-up on scroll" pattern used
 * across every migrated section.
 *
 * Behaviour matches framer-motion's `whileInView` viewport={{ once: true }}:
 * elements start hidden, animate once when the section enters the viewport,
 * then stay at end-state. Uses a plain IntersectionObserver instead of
 * anime.js `onScroll` because the latter does not reliably re-fire enter
 * for targets already in view at observer-register time (which is the
 * common case here — LazySection mounts the component when the section
 * is already near the viewport).
 *
 * Pass either explicit DOM targets or a selector resolved within `root`.
 * Returns a cleanup function so useAnime can disconnect the observer
 * when the scope reverts.
 */
export function revealOnScroll(
  root: HTMLElement,
  targets: NodeListOf<Element> | Element[] | string,
  options: { staggerMs?: number; anim?: AnimationParams; rootMargin?: string } = {},
): () => void {
  const els =
    typeof targets === "string"
      ? Array.from(root.querySelectorAll<HTMLElement>(targets))
      : Array.from(targets as ArrayLike<Element>);
  if (els.length === 0) return () => {};

  const anim = animate(els, {
    ...(options.anim ?? fadeUpAnim()),
    delay:
      options.staggerMs !== undefined ? stagger(options.staggerMs) : undefined,
    autoplay: false,
  });

  // IntersectionObserver fires on initial observe with current state, so
  // if the section is already partially in view at mount, the animation
  // plays immediately. Disconnect after the first intersection so we
  // never re-trigger on subsequent scroll.
  if (typeof IntersectionObserver === "undefined") {
    anim.play();
    return () => anim.cancel();
  }

  const io = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (entry.isIntersecting) {
          anim.play();
          io.disconnect();
          break;
        }
      }
    },
    {
      // Trigger when section is 50 px from entering viewport bottom —
      // matches the original framer `viewport={{ margin: "-50px" }}`.
      rootMargin: options.rootMargin ?? "0px 0px -50px 0px",
      threshold: 0,
    },
  );
  io.observe(root);

  return () => {
    io.disconnect();
    anim.cancel();
  };
}

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
