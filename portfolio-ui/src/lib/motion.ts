import { useReducedMotion } from "framer-motion";

/**
 * Returns animation props only if the user hasn't enabled reduced motion.
 * Usage: <motion.div {...useMotionProps({ initial: { opacity: 0 }, animate: { opacity: 1 } })} />
 */
export function useMotionProps<T extends Record<string, unknown>>(animated: T): T | Record<string, never> {
  const prefersReducedMotion = useReducedMotion();
  return prefersReducedMotion ? {} : animated;
}
