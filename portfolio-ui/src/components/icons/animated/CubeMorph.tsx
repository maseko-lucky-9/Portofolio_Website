/**
 * CubeMorph — isometric cube outline with edges stroke-drawing on in
 * sequence. Container-shaped, doubles as a "Kubernetes pod" or
 * generic "container/cluster" metaphor.
 *
 * Reduced-motion: renders fully drawn, no animation.
 */
import { useRef } from "react";
import { createDrawable, createTimeline } from "animejs";
import { useAnime } from "@/lib/use-anime";

export interface CubeMorphProps {
  size?: number;
  className?: string;
  color?: string;
}

export function CubeMorph({
  size = 24,
  className,
  color = "oklch(var(--primary))",
}: CubeMorphProps) {
  const svgRef = useRef<SVGSVGElement>(null);

  useAnime(
    svgRef,
    (scope) => {
      if (scope.matches.reducedMotion) return;
      const svg = svgRef.current;
      if (!svg) return;
      const paths = svg.querySelectorAll<SVGPathElement>("[data-anime-edge]");

      const tl = createTimeline({ autoplay: true });
      Array.from(paths).forEach((p, i) => {
        tl.add(
          createDrawable(p),
          { draw: ["0 0", "0 1"], duration: 280, ease: "outQuart" },
          i * 80,
        );
      });
    },
    [],
  );

  return (
    <svg
      ref={svgRef}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth={1.75}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      {/* Bottom face (rhombus) — drawn first */}
      <path data-anime-edge d="M 4 16 L 12 20" />
      <path data-anime-edge d="M 12 20 L 20 16" />
      <path data-anime-edge d="M 20 16 L 12 12" />
      <path data-anime-edge d="M 12 12 L 4 16" />

      {/* Vertical edges (back + front) */}
      <path data-anime-edge d="M 4 16 L 4 8" />
      <path data-anime-edge d="M 20 16 L 20 8" />
      <path data-anime-edge d="M 12 20 L 12 12" />

      {/* Top face (closing the cube) */}
      <path data-anime-edge d="M 4 8 L 12 4" />
      <path data-anime-edge d="M 12 4 L 20 8" />
    </svg>
  );
}
