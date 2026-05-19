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
 */
import { motion } from "framer-motion";
import { useReducedMotion } from "framer-motion";

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

/** Polar → cartesian for an angle (radians from north, clockwise) and a
 * radius. SVG y-axis goes down, so we subtract cos(theta). */
function polarToXY(angleRad: number, r: number) {
  return {
    x: CENTER + r * Math.sin(angleRad),
    y: CENTER - r * Math.cos(angleRad),
  };
}

export function SkillsRadar({
  data,
  color = "oklch(var(--primary))",
}: SkillsRadarProps) {
  const prefersReducedMotion = useReducedMotion();
  const n = data.length;
  if (n < 3) return null;

  // Pre-compute axis angles + endpoint coordinates per vertex.
  const axes = data.map((d, i) => {
    const angle = (i / n) * Math.PI * 2;
    const outer = polarToXY(angle, RADIUS);
    const point = polarToXY(angle, RADIUS * (d.value / 100));
    const label = polarToXY(angle, RADIUS + LABEL_OFFSET);
    return { ...d, angle, outer, point, label };
  });

  // Concentric gridline ring positions (as fraction of full radius).
  const rings = [0.33, 0.66, 1];

  // Polygon points string for the filled data shape.
  const polygonPoints = axes
    .map(({ point }) => `${point.x},${point.y}`)
    .join(" ");

  return (
    <svg
      viewBox={`0 0 ${SIZE} ${SIZE}`}
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

      {/* Data polygon — animated fill-in on mount */}
      <motion.polygon
        points={polygonPoints}
        fill={color}
        fillOpacity={0.22}
        stroke={color}
        strokeWidth={2}
        strokeLinejoin="round"
        initial={prefersReducedMotion ? false : { opacity: 0, scale: 0.85 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{
          duration: 0.7,
          ease: [0.16, 1, 0.3, 1],
        }}
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
          Math.abs(Math.sin(angle)) < 0.05
            ? "middle"
            : Math.sin(angle) > 0
              ? "start"
              : "end";
        return (
          <text
            key={`label-${skill}`}
            x={label.x}
            y={label.y}
            textAnchor={anchor}
            dominantBaseline="middle"
            fill="oklch(var(--muted-foreground))"
            style={{ fontSize: "11px" }}
          >
            {skill}
          </text>
        );
      })}
    </svg>
  );
}
