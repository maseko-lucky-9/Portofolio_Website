import { useEffect, type RefObject } from "react";

/**
 * Feeds the cursor-tracked radial gradients (`.spot::before`, `.cap-glow`,
 * `.cap-ring`) by writing `--mx` / `--my` in px onto whichever descendant the
 * pointer is over.
 *
 * One delegated listener per section rather than one per card: a grid of
 * capability cards would otherwise attach a listener each, and they all fire
 * against the same rAF budget.
 *
 * No-op on coarse pointers — there is no cursor to track, and the CSS keeps its
 * 50%/50% defaults so the gradients simply never light up.
 */
export function useSpotlight(root: RefObject<HTMLElement | null>, selector = ".spot, .cap") {
  useEffect(() => {
    const el = root.current;
    if (!el || matchMedia("(pointer: coarse)").matches) return;

    const move = (e: PointerEvent) => {
      const target = (e.target as Element | null)?.closest<HTMLElement>(selector);
      if (!target || !el.contains(target)) return;
      const r = target.getBoundingClientRect();
      target.style.setProperty("--mx", `${e.clientX - r.left}px`);
      target.style.setProperty("--my", `${e.clientY - r.top}px`);
    };

    el.addEventListener("pointermove", move, { passive: true });
    return () => el.removeEventListener("pointermove", move);
  }, [root, selector]);
}
