/**
 * SkillsRadar — hand-rolled SVG radar chart.
 *
 * Replaces the Recharts <RadarChart> in SkillsSection. Same data shape,
 * same visual register, but ~50 LOC of pure SVG instead of pulling in
 * the recharts + d3-scale/shape/interpolate vendor chunk (~500 KB,
 * ~144 KB gzip).
 *
 * Accepts `data: { skill: string; value: number }[]` with values 0–100.
 * Renders 3 concentric gridlines (33% / 66% / 100%), 6 axis spokes,
 * a filled polygon, vertex dots with native tooltips, and axis labels.
 *
 * Colors come from `oklch(var(--…))` tokens — theme-aware.
 *
 * Migrated from framer-motion to anime.js v4 on 2026-05-19. The data
 * polygon animates in on mount (opacity + scale), reverted on unmount
 * by the scope.
 */
import { useRef } from "react";
import { animate } from "animejs";
import { EASE_FN } from "@/lib/motion";
import { useAnime } from "@/lib/use-anime";

export interface RadarDatum {
  skill: string;
  value: number; // 0–100
}

interface SkillsRadarProps {
  data: RadarDatum[];
  /** Optional override; defaults to the brand accent. */
  color?: string;
}

const SIZE = 320;
const CENTER = SIZE / 2;
const RADIUS = 120;
const LABEL_OFFSET = 18; // distance from outer ring to label baseline

// Axis labels sit at CENTER + RADIUS + LABEL_OFFSET = 298 and are drawn with
// textAnchor="start", so they run past SIZE and get clipped by SkillsSection's
// overflow-hidden (the SVG's own overflow-visible can't escape an ancestor
// clip). Widening the *viewBox* — not SIZE/CENTER/RADIUS, which the polar math
// depends on — brings the label band inside. Stays centred on CENTER.
const VIEW_PAD = 60;
const VIEW_BOX = `${-VIEW_PAD} 0 ${SIZE + VIEW_PAD * 2} ${SIZE}`;

/** Polar → cartesian for an angle (radians from north, clockwise) and a
 * radius. SVG y-axis goes down, so we subtract cos(theta). */
function polarToXY(angleRad: number, r: number) {
  return {
    x: CENTER + r * Math.sin(angleRad),
    y: CENTER - r * Math.cos(angleRad),
  };
}

export function SkillsRadar({ data, color = "oklch(var(--primary))" }: SkillsRadarProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const polygonRef = useRef<SVGPolygonElement>(null);

  const n = data.length;

  // Pre-compute axis angles + endpoint coordinates per vertex. (Guarded
  // by n>=3 at render time; the hooks below still run unconditionally so
  // React rules-of-hooks stay clean if data shape changes.)
  const axes =
    n >= 3
      ? data.map((d, i) => {
          const angle = (i / n) * Math.PI * 2;
          const outer = polarToXY(angle, RADIUS);
          const point = polarToXY(angle, RADIUS * (d.value / 100));
          const label = polarToXY(angle, RADIUS + LABEL_OFFSET);
          return { ...d, angle, outer, point, label };
        })
      : [];

  // Mount-only entrance for the data polygon. Re-fires when the polygon
  // points change (e.g. category swap in SkillsSection) because the
  // dependency below tracks the points string.
  const polygonPoints = axes.map(({ point }) => `${point.x},${point.y}`).join(" ");

  useAnime(
    svgRef,
    (scope) => {
      if (scope.matches.reducedMotion) return;
      const el = polygonRef.current;
      if (!el) return;
      animate(el, {
        opacity: [0, 1],
        scale: [0.85, 1],
        duration: 700,
        ease: EASE_FN.spring,
      });
    },
    [polygonPoints],
  );

  if (n < 3) return null;

  // Concentric gridline ring positions (as fraction of full radius).
  const rings = [0.33, 0.66, 1];

  return (
    <svg
      ref={svgRef}
      viewBox={VIEW_BOX}
      width="100%"
      height="100%"
      role="img"
      aria-label={`Skill proficiency radar: ${axes.map((a) => `${a.skill} ${a.value}%`).join(", ")}`}
      className="overflow-visible"
    >
      {/* Concentric gridlines (polygons, not circles — match the data shape) */}
      {rings.map((ratio) => {
        const ringPoints = axes
          .map(({ angle }) => {
            const p = polarToXY(angle, RADIUS * ratio);
            return `${p.x},${p.y}`;
          })
          .join(" ");
        return (
          <polygon
            key={ratio}
            points={ringPoints}
            fill="none"
            stroke="oklch(var(--border))"
            strokeWidth={1}
            strokeLinejoin="round"
          />
        );
      })}

      {/* Axis spokes */}
      {axes.map(({ outer, skill }) => (
        <line
          key={`spoke-${skill}`}
          x1={CENTER}
          y1={CENTER}
          x2={outer.x}
          y2={outer.y}
          stroke="oklch(var(--border))"
          strokeWidth={1}
        />
      ))}

      {/* Data polygon — animated fill-in on mount (anime.js scope-managed) */}
      <polygon
        ref={polygonRef}
        points={polygonPoints}
        fill={color}
        fillOpacity={0.22}
        stroke={color}
        strokeWidth={2}
        strokeLinejoin="round"
        style={{ transformOrigin: `${CENTER}px ${CENTER}px` }}
      />

      {/* Vertex dots with native tooltips */}
      {axes.map(({ point, skill, value }) => (
        <circle
          key={`vertex-${skill}`}
          cx={point.x}
          cy={point.y}
          r={4}
          fill={color}
          stroke="oklch(var(--card))"
          strokeWidth={2}
        >
          <title>
            {skill}: {value}%
          </title>
        </circle>
      ))}

      {/* Axis labels */}
      {axes.map(({ label, skill, angle }) => {
        // Anchor flips based on which side of center the label is on.
        const anchor =
          Math.abs(Math.sin(angle)) < 0.05 ? "middle" : Math.sin(angle) > 0 ? "start" : "end";
        return (
          <text
            key={`label-${skill}`}
            x={label.x}
            y={label.y}
            textAnchor={anchor}
            dominantBaseline="middle"
            fill="oklch(var(--muted-foreground))"
            style={{ fontSize: "13px" }}
          >
            {skill}
          </text>
        );
      })}
    </svg>
  );
}
