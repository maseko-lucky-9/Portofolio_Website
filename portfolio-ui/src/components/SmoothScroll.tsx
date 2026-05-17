/**
 * SmoothScroll — mounts Lenis at the page root and drives its RAF loop.
 *
 * Plan 5 of the v2 ladder. Lenis is gated through useShouldRenderSmoothScroll
 * so it never engages under reduced-motion, slow connections, `?lite=1`,
 * `?nomo=1`, or touch (`pointer: coarse`).
 *
 * Why mount Lenis as a sibling rather than a wrapper:
 *   • Avoids re-parenting the entire DOM tree on flag toggle (which would
 *     break component state across the tree).
 *   • Lenis writes to `document.documentElement` directly; no JSX wrapper
 *     is needed.
 *
 * Note on Framer Motion: `useScroll` reads `window.scrollY`, which Lenis
 * keeps in sync as it virtual-scrolls. So <ScrollProgress /> still tracks
 * correctly when Lenis is active.
 */
import { useEffect } from "react";
import Lenis from "lenis";
import { useShouldRenderSmoothScroll } from "@/lib/motion";

export function SmoothScroll() {
  const enabled = useShouldRenderSmoothScroll();

  useEffect(() => {
    if (!enabled) return;

    const lenis = new Lenis({
      duration: 1.1, // 1.1s scroll-to settling — felt, not gratuitous
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)), // ease-out-expo
      lerp: 0.1,
      smoothWheel: true,
      wheelMultiplier: 1.0,
      touchMultiplier: 1.5,
    });

    let rafId = 0;
    function raf(time: number) {
      lenis.raf(time);
      rafId = requestAnimationFrame(raf);
    }
    rafId = requestAnimationFrame(raf);

    return () => {
      cancelAnimationFrame(rafId);
      lenis.destroy();
    };
  }, [enabled]);

  return null;
}
