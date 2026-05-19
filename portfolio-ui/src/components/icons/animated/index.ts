/**
 * Dev-themed animated icon library (Phase E of the anime.js migration).
 *
 * Each component renders an SVG with anime.js-driven entrance animations
 * (stroke-dasharray draw-on, cursor blink, progress fill). Lucide-shaped
 * interface (size + className + color) so they drop into existing icon
 * slots. All respect prefers-reduced-motion by rendering the end-state.
 *
 * Usage rule (from the migration plan): max one animated icon visible
 * per viewport at any scroll position. Reserve for signature moments;
 * keep Lucide as the default.
 */
export { AnimatedBrackets } from "./AnimatedBrackets";
export type { AnimatedBracketsProps } from "./AnimatedBrackets";

export { TerminalCursor } from "./TerminalCursor";
export type { TerminalCursorProps } from "./TerminalCursor";

export { BranchGraph } from "./BranchGraph";
export type { BranchGraphProps } from "./BranchGraph";

export { CubeMorph } from "./CubeMorph";
export type { CubeMorphProps } from "./CubeMorph";

export { BuildProgress } from "./BuildProgress";
export type { BuildProgressProps } from "./BuildProgress";
