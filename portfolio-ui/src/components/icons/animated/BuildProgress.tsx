/**
 * BuildProgress — horizontal progress bar that fills with the brand
 * accent. Reads as "build pipeline running" / "deployment progress"
 * semantic. Animates on mount; value-controlled.
 *
 * Reduced-motion: renders at the target fill width, no animation.
 */
import { useRef } from "react";
import { animate } from "animejs";
import { useAnime } from "@/lib/use-anime";

export interface BuildProgressProps {
  /** 0-100. */
  value: number;
  width?: number;
  height?: number;
  className?: string;
  color?: string;
  /** Override the rail (background) tone. */
  railColor?: string;
}

export function BuildProgress({
  value,
  width = 96,
  height = 6,
  className,
  color = "oklch(var(--primary))",
  railColor = "oklch(var(--muted))",
}: BuildProgressProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const clamped = Math.max(0, Math.min(100, value));
  const fillRatio = clamped / 100;

  useAnime(
    svgRef,
    (scope) => {
      const fill =
        svgRef.current?.querySelector<SVGRectElement>("[data-anime-fill]");
      if (!fill) return;
      if (scope.matches.reducedMotion) {
        fill.setAttribute("width", String(width * fillRatio));
        return;
      }
      animate(fill, {
        width: [0, width * fillRatio],
        duration: 800,
        ease: "outQuart",
      });
    },
    [value, width],
  );

  return (
    <svg
      ref={svgRef}
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      className={className}
      role="progressbar"
      aria-valuenow={clamped}
      aria-valuemin={0}
      aria-valuemax={100}
    >
      {/* Rail */}
      <rect
        x="0"
        y="0"
        width={width}
        height={height}
        rx={height / 2}
        fill={railColor}
      />
      {/* Fill */}
      <rect
        data-anime-fill
        x="0"
        y="0"
        width="0"
        height={height}
        rx={height / 2}
        fill={color}
      />
    </svg>
  );
}
