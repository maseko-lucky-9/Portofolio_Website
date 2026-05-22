/**
 * ScrollProgress — a thin progress bar fixed to the top of the viewport
 * that tracks how far through the document the reader has scrolled.
 *
 * Linear / Stripe pattern. Driven by anime.js v4 `onScroll` observer
 * with `sync: true` for spring-smoothed tracking. Under reduced-motion
 * the bar still updates (it is information, not theatre) but the
 * smoothing is dropped so progress tracks scroll position 1:1.
 *
 * Migrated from framer-motion (`useScroll` + `useSpring`) on
 * 2026-05-19 as part of the anime.js migration — see
 * ~/.claude/plans/atomic-toasting-locket.md Phase B.
 */
import { useRef } from "react";
import { animate, onScroll } from "animejs";
import { useAnime } from "@/lib/use-anime";

export function ScrollProgress() {
  const ref = useRef<HTMLDivElement>(null);

  useAnime(
    ref,
    (scope) => {
      const bar = ref.current;
      if (!bar) return;

      animate(bar, {
        scaleX: [0, 1],
        ease: "linear",
        autoplay: onScroll({
          // The whole page is the trackable surface. enter at the top of
          // the document hitting the top of viewport (i.e. unscrolled),
          // leave when its bottom hits the bottom of viewport (fully
          // scrolled). sync=true engages anime smoothing; sync='linear'
          // is 1:1 with no easing for the reduced-motion path.
          target: document.documentElement,
          enter: "top top",
          leave: "bottom bottom",
          sync: scope.matches.reducedMotion ? "linear" : true,
        }),
      });
    },
    [],
  );

  return (
    <div
      ref={ref}
      aria-hidden="true"
      className="fixed top-0 left-0 right-0 z-[60] h-[2px] origin-left pointer-events-none"
      style={{
        transformOrigin: "left",
        background: "oklch(var(--primary))",
        transform: "scaleX(0)",
      }}
    />
  );
}
