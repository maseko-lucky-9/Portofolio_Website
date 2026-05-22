/**
 * BranchGraph — trunk + 3 diverging branches stroke-drawing on with
 * stagger, with circular nodes at each branch tip. Reads as a
 * GitOps / CI/CD metaphor.
 *
 * Reduced-motion: renders fully drawn, no animation.
 */
import { useRef } from "react";
import { createDrawable, createTimeline } from "animejs";
import { useAnime } from "@/lib/use-anime";

export interface BranchGraphProps {
  size?: number;
  className?: string;
  color?: string;
}

export function BranchGraph({
  size = 24,
  className,
  color = "oklch(var(--primary))",
}: BranchGraphProps) {
  const svgRef = useRef<SVGSVGElement>(null);

  useAnime(
    svgRef,
    (scope) => {
      if (scope.matches.reducedMotion) return;
      const svg = svgRef.current;
      if (!svg) return;
      const paths = svg.querySelectorAll<SVGPathElement>("[data-anime-line]");
      const nodes = svg.querySelectorAll<SVGCircleElement>("[data-anime-node]");

      const tl = createTimeline({ autoplay: true });

      // Stage 1: trunk + branches stroke-draw on with cascading offset.
      Array.from(paths).forEach((p, i) => {
        tl.add(
          createDrawable(p),
          { draw: ["0 0", "0 1"], duration: 380, ease: "outQuart" },
          i * 90,
        );
      });

      // Stage 2: nodes pop in once their branch finishes.
      Array.from(nodes).forEach((n, i) => {
        tl.add(
          n,
          { opacity: [0, 1], scale: [0.4, 1], duration: 220, ease: "outBack" },
          380 + i * 90,
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
      {/* Trunk */}
      <path data-anime-line d="M 5 12 L 14 12" />
      {/* Top branch */}
      <path data-anime-line d="M 14 12 L 18 6" />
      {/* Middle branch (continuation of trunk) */}
      <path data-anime-line d="M 14 12 L 19 12" />
      {/* Bottom branch */}
      <path data-anime-line d="M 14 12 L 18 18" />

      {/* Origin node */}
      <circle
        data-anime-node
        cx="5"
        cy="12"
        r="2"
        fill={color}
        stroke="none"
        style={{ opacity: 0, transformOrigin: "5px 12px" }}
      />
      {/* Top tip */}
      <circle
        data-anime-node
        cx="18"
        cy="6"
        r="2"
        fill={color}
        stroke="none"
        style={{ opacity: 0, transformOrigin: "18px 6px" }}
      />
      {/* Middle tip */}
      <circle
        data-anime-node
        cx="19"
        cy="12"
        r="2"
        fill={color}
        stroke="none"
        style={{ opacity: 0, transformOrigin: "19px 12px" }}
      />
      {/* Bottom tip */}
      <circle
        data-anime-node
        cx="18"
        cy="18"
        r="2"
        fill={color}
        stroke="none"
        style={{ opacity: 0, transformOrigin: "18px 18px" }}
      />
    </svg>
  );
}
