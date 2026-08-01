/**
 * AnimatedBrackets — `</>` with stroke-dasharray draw-on on mount.
 *
 * Lucide-shaped interface (size + className + accessor) so it drops
 * into the same icon slots Lucide ones do. The mint accent comes from
 * `oklch(var(--primary))` by default; override with `color` for
 * special-case usage.
 *
 * Reduced-motion: renders the brackets fully drawn, no animation.
 */
import { useRef } from "react";
import { animate, createDrawable, createTimeline } from "animejs";
import { useAnime } from "@/lib/use-anime";

/** Per-bracket draw-on offset, ms. Exported so the regression test pins the
 *  real value rather than a copy that can drift. */
export const BRACKET_STAGGER_MS = 80;

export interface AnimatedBracketsProps {
  size?: number;
  className?: string;
  /** Override the default primary token. */
  color?: string;
  /** Suppress the blinking cursor between the brackets. */
  noCursor?: boolean;
}

export function AnimatedBrackets({
  size = 24,
  className,
  color = "oklch(var(--primary))",
  noCursor = false,
}: AnimatedBracketsProps) {
  const svgRef = useRef<SVGSVGElement>(null);

  useAnime(
    svgRef,
    (scope) => {
      if (scope.matches.reducedMotion) return;
      const svg = svgRef.current;
      if (!svg) return;
      const paths = svg.querySelectorAll<SVGPathElement>("[data-anime-bracket]");
      if (paths.length === 0) return;

      const drawables = Array.from(paths).map((p) => createDrawable(p));
      const tl = createTimeline({ autoplay: true });
      drawables.forEach((d, i) => {
        // Linear 80 ms stagger. This previously called stagger(80) by hand as
        // `stagger(80)({} as Element, i, drawables.length)` — passing a NUMBER
        // where anime expects the targets ARRAY. `(4).length` is undefined, so
        // stagger's fill loop never ran and it returned 0 for every index: the
        // brackets all drew at once. This restores the stagger that was always
        // intended. See anime-helpers.test.ts.
        tl.add(
          d,
          { draw: ["0 0", "0 1"], duration: 500, ease: "outQuart" },
          i * BRACKET_STAGGER_MS,
        );
      });

      if (!noCursor) {
        const cursor = svg.querySelector<SVGRectElement>("[data-anime-cursor]");
        if (cursor) {
          // 1 Hz blink after the brackets settle.
          animate(cursor, {
            opacity: [1, 0],
            duration: 500,
            loop: true,
            alternate: true,
            ease: "linear",
            delay: 800,
          });
        }
      }
    },
    [noCursor],
  );

  return (
    <svg
      ref={svgRef}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      {/* `<` */}
      <path data-anime-bracket d="M 8 6 L 3 12 L 8 18" />
      {/* `>` */}
      <path data-anime-bracket d="M 16 6 L 21 12 L 16 18" />
      {/* Blinking cursor between the brackets */}
      {!noCursor && (
        <rect data-anime-cursor x="11" y="8" width="2" height="8" fill={color} stroke="none" />
      )}
    </svg>
  );
}
