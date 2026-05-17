/**
 * ScrollProgress — a thin progress bar fixed to the top of the viewport
 * that tracks how far through the document the reader has scrolled.
 *
 * Linear/Stripe pattern. Uses Framer Motion's `useScroll` + `useSpring`
 * for smooth tracking. Respects prefers-reduced-motion: under reduce the
 * bar still updates (it's information, not theatre) but the spring is
 * disabled so it tracks scroll position 1:1 without easing.
 */
import { motion, useReducedMotion, useScroll, useSpring } from "framer-motion";

export function ScrollProgress() {
  const prefersReducedMotion = useReducedMotion();
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, {
    stiffness: prefersReducedMotion ? 1000 : 220,
    damping: prefersReducedMotion ? 100 : 30,
    restDelta: 0.001,
  });

  return (
    <motion.div
      aria-hidden="true"
      className="fixed top-0 left-0 right-0 z-[60] h-[2px] origin-left pointer-events-none"
      style={{
        scaleX,
        background:
          "linear-gradient(90deg, hsl(var(--primary)), hsl(var(--brand-violet)), hsl(var(--secondary)))",
      }}
    />
  );
}
