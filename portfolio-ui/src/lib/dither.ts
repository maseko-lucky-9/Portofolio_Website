/**
 * Ordered-dither maths for the ambient edge frame.
 *
 * Split out of the component on purpose: jsdom has no 2D canvas backend, so
 * anything living inside a draw loop is unreachable from the unit suite. Here
 * the geometry and the colour ramp are pure functions, and `paintBorder` takes
 * the narrowest possible slice of the canvas API so a test can hand it a
 * recorder instead of a real context.
 *
 * Numbers below are measured off the approved v4 mockup at 1440x900, not
 * invented: 5.0 px cells (the reference shader's grid resolves to exactly that
 * at both axes), a rim that decays from luminance 135 to 27 over ~40 px, and
 * brightest cells at rgb(89,146,161) over an rgb(11,24,38) ground.
 */

/** 4x4 Bayer threshold map, 0-15. The classic ordered-dither matrix: it breaks
 *  a smooth ramp into a stable stipple rather than visible banding. */
export const BAYER_4: readonly (readonly number[])[] = [
  [0, 8, 2, 10],
  [12, 4, 14, 6],
  [3, 11, 1, 9],
  [15, 7, 13, 5],
];

/** #38BDF8 — the `--signal` token, oklch(0.754 0.139 232.7), resolved once.
 *  Read as a constant rather than off the computed style: this runs inside a
 *  draw loop, and the repo already pins the same hex in build-og-images.mjs
 *  and index.html's theme-color. */
const SIGNAL_RGB = [56, 189, 248] as const;

/** Cells from the nearest edge of the grid. Clamped at 0 so a degenerate grid
 *  (0 or 1 column) cannot produce a negative distance and, through it, an
 *  intensity above 1. */
export function edgeDistance(col: number, row: number, cols: number, rows: number): number {
  return Math.max(0, Math.min(col, cols - 1 - col, row, rows - 1 - row));
}

/** Frame brightness for one cell: 1 hard against the edge, 0 at `depth` cells
 *  inward. Squared, which is what fits the reference's decay — a tight bright
 *  rim with a long faint tail, rather than a linear wash. */
export function frameIntensity(
  col: number,
  row: number,
  cols: number,
  rows: number,
  depth: number,
): number {
  if (depth <= 0) return 0;
  const d = edgeDistance(col, row, cols, rows);
  if (d >= depth) return 0;
  const t = 1 - d / depth;
  return t * t;
}

/** Angular position around the frame, 0-1, for the travelling highlight.
 *  atan2 from the centre is monotonic around the ring and costs one call;
 *  walking the true perimeter costs four cases and buys nothing here. */
export function perimeterPhase(col: number, row: number, cols: number, rows: number): number {
  const a = Math.atan2(row - (rows - 1) / 2, col - (cols - 1) / 2);
  return (a / (2 * Math.PI) + 1) % 1;
}

/** Brightness bump from the sweep head, 0-1, wrapping across the seam so the
 *  highlight does not stall when it crosses phase 0. */
export function sweepBoost(phase: number, head: number, width: number): number {
  if (width <= 0) return 0;
  // Both positions must be inside one lap before the wrap below means anything:
  // the `d > 0.5` fold assumes a unit ring, and an out-of-range head silently
  // turns it into a gain above 1 that lights the entire frame.
  const p = ((phase % 1) + 1) % 1;
  const h = ((head % 1) + 1) % 1;
  let d = Math.abs(p - h);
  if (d > 0.5) d = 1 - d;
  if (d >= width) return 0;
  const t = 1 - d / width;
  return t * t;
}

/** Brightness steps the ramp is quantised to. Low on purpose: a pixel-art ramp
 *  reads as a few banded steps with dither scattered between them, not as a
 *  smooth gradient. */
export const LEVELS = 6;

/**
 * Ordered-dither quantisation — returns a step from 0 to `levels`.
 *
 * The multi-level form of the usual binary Bayer trick, and the reason this
 * looks like the reference rather than like a halftone screen. Thresholding to
 * on/off leaves scattered dots on bare ground: measured against the mockup, a
 * binary version fell from luminance 207 to 5 within 10 px where the reference
 * ramps 135 to 22 across 80. Quantising instead keeps a continuous ramp and
 * spends the dither on the boundaries between its steps.
 *
 * `crawl` shifts the threshold map over time so the stipple moves; without it
 * the pattern sits as a static screen-door and reads as a rendering artefact.
 */
export function ditherLevel(
  intensity: number,
  col: number,
  row: number,
  crawl = 0,
  levels = LEVELS,
): number {
  const cell = BAYER_4[row & 3][col & 3];
  // JS `%` keeps the sign of the dividend, so a negative crawl would produce a
  // negative bias and drag every cell a step darker.
  const bias = ((((cell + crawl) % 16) + 16) % 16) / 16;
  // One clamp, on the result. Clamping the input as well read as defence in
  // depth but was really two guards for one hazard: each hid the other, so
  // removing either alone changed nothing and no test could tell.
  return Math.max(0, Math.min(levels, Math.floor(intensity * levels + bias)));
}

/** Peak opacity of the brightest cell. Fitted, not picked: at full opacity the
 *  rim measured luminance 206 against the reference's 144, and 0.62 is what
 *  closes that gap over this page's ground. */
const PEAK_ALPHA = 0.62;
/** Level fraction above which cells start mixing toward white. */
const WHITEN_FROM = 0.6;

/**
 * Colour for a dither step, as RGBA components.
 *
 * Cyan at the tail, trending white at the peak — the reference's brightest
 * cells sit about 45% of the way from the signal cyan to white. Components
 * rather than a CSS string because the field is written straight into an
 * ImageData buffer: at 288x180 cells a `fillRect` per cell is ~20 ms a frame,
 * where a typed-array write is a rounding error.
 */
export function cellRgba(level: number, levels = LEVELS): [number, number, number, number] {
  const t = levels > 0 ? Math.min(1, Math.max(0, level / levels)) : 0;
  // Whiten only across the top of the ramp. Mixing toward white in proportion
  // to the level desaturated every mid-tone, and over a near-black ground that
  // read as grey haze rather than as the reference's cyan.
  const w = Math.max(0, (t - WHITEN_FROM) / (1 - WHITEN_FROM)) * 0.45;
  const mix = (c: number) => Math.round(c + (255 - c) * w);
  // Alpha rises faster than the level so the mid-tones carry colour. Linear,
  // the interior measured luminance 85 against the reference's 137.
  const alpha = Math.pow(t, 0.75) * PEAK_ALPHA;
  return [mix(SIGNAL_RGB[0]), mix(SIGNAL_RGB[1]), mix(SIGNAL_RGB[2]), Math.round(alpha * 255)];
}

/**
 * Elliptical radial falloff, 1 at the centre to 0 at the rim — the same shape
 * `radial-gradient(ellipse RX RY at CX CY, …, transparent)` paints. All
 * arguments are normalised to the viewport so the field scales with it.
 */
export function ellipse(
  nx: number,
  ny: number,
  cx: number,
  cy: number,
  rx: number,
  ry: number,
): number {
  if (rx <= 0 || ry <= 0) return 0;
  const dx = (nx - cx) / rx;
  const dy = (ny - cy) / ry;
  const d = Math.sqrt(dx * dx + dy * dy);
  return d >= 1 ? 0 : 1 - d;
}

/**
 * Frame depth in cells for a given viewport.
 *
 * Capped so a desktop keeps the 60 px rim fitted against the reference, and
 * proportional below that. A flat 60 px is a third of the width of a 375 px
 * phone on each side — the two sides nearly meet and the hero copy ends up
 * sitting on dithered noise. Driven by the SHORTER axis so a short landscape
 * window thins out too.
 */
export function frameDepth(
  width: number,
  height: number,
  cell: number,
  maxPx = 60,
  ratio = 0.07,
): number {
  if (cell <= 0) return 0;
  const px = Math.min(maxPx, Math.max(0, Math.min(width, height)) * ratio);
  return Math.max(1, Math.round(px / cell));
}

/** How much of the ring the travelling highlight covers, as a fraction. */
const SWEEP_WIDTH = 0.16;
/** Peak gain under the sweep head. Kept under 1 so the rim saturates to white
 *  at the head without the tail blowing out. */
const SWEEP_GAIN = 0.9;
/** Two turns per revolution — the reference field reads as a two-armed swirl
 *  rather than a plain blob, and the arms are what stop a radial gradient from
 *  looking like a radial gradient once it is quantised. */
const ARMS = 2;
/** Shallowest the arm troughs go, as a fraction of the core. */
const ARM_FLOOR = 0.62;
/** Peak strength of the main core and the smaller upper-left wash. Their
 *  geometry is the `#field-fallback` gradient's, so the pixelated field and the
 *  smooth fallback it replaces are the same shape at different fidelities. */
const CORE_GAIN = 1.15;
const WASH_GAIN = 0.5;
/** Floor under the whole viewport, so the gap between the two blobs is not a
 *  dead rectangle of bare ground. Small: at 0.13 it lit the entire viewport
 *  evenly (mean luminance 52 against the reference's 35) and washed out the
 *  body copy. The field has to be a bright thing against dark, not a haze. */
const AMBIENT = 0.05;
/** Contrast curve on the summed field. The reference runs 7 to 137; a linear
 *  sum ran 15 to 128 — same peak, nothing like the same depth. */
const CONTRAST = 1.35;
const TAU = Math.PI * 2;

export interface FieldFrame {
  /** Grid size in cells. */
  cols: number;
  rows: number;
  /** How far the rim frame reaches inward, in cells. */
  depth: number;
  /** Sweep head position around the rim, 0-1. */
  head: number;
  /** Dither threshold offset. */
  crawl: number;
  /** Drift position through one slow cycle of the field, 0-1. */
  phase: number;
}

/**
 * Total field intensity at one cell, 0-1.
 *
 * Three contributions, summed and clamped: the rim frame (with its travelling
 * highlight), a large drifting core right-of-centre, and a smaller wash at the
 * top left. The two blobs take their centres and radii from the
 * `#field-fallback` CSS gradient, so this is the same composition the design
 * already specifies — just rendered at cell resolution and quantised instead of
 * painted smooth.
 */
export function fieldIntensity(col: number, row: number, f: FieldFrame): number {
  const { cols, rows } = f;
  const nx = cols > 1 ? col / (cols - 1) : 0;
  const ny = rows > 1 ? row / (rows - 1) : 0;
  const drift = Math.sin(f.phase * TAU);

  const rim = frameIntensity(col, row, cols, rows, f.depth);
  const boost = rim > 0 ? sweepBoost(perimeterPhase(col, row, cols, rows), f.head, SWEEP_WIDTH) : 0;

  const cx = 0.68 + 0.05 * drift;
  const cy = 0.42 + 0.03 * drift;
  let core = ellipse(nx, ny, cx, cy, 0.46, 0.3);
  if (core > 0) {
    // Banding the core along its own polar angle is what turns a blob into a
    // swirl. The trough never reaches zero — arms that do read as a strobing
    // pinwheel once the whole thing is quantised to six steps.
    const angle = Math.atan2(ny - cy, nx - cx);
    const arms = 0.5 + 0.5 * Math.sin(angle * ARMS + (1 - core) * 9 - f.phase * TAU);
    core *= ARM_FLOOR + (1 - ARM_FLOOR) * arms;
  }

  const wash = ellipse(nx, ny, 0.2, 0.08 + 0.04 * drift, 0.34, 0.24);

  const total = AMBIENT + rim * (1 + boost * SWEEP_GAIN) + core * CORE_GAIN + wash * WASH_GAIN;
  return Math.pow(Math.min(1, Math.max(0, total)), CONTRAST);
}

/**
 * Paints one frame of the field into an RGBA buffer, one pixel per cell.
 * Returns the number of cells lit.
 *
 * The buffer is at CELL resolution, not screen resolution — the component
 * scales it up with smoothing off, which is both the pixelation and the reason
 * this is affordable. A 1440x900 viewport is 288x180 cells; drawn as one
 * `fillRect` each that is ~50k canvas calls a frame, and as typed-array writes
 * it is ~50k stores.
 */
export function paintField(rgba: Uint8ClampedArray, f: FieldFrame): number {
  const { cols, rows } = f;
  rgba.fill(0);
  if (cols <= 0 || rows <= 0) return 0;

  let lit = 0;
  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      const level = ditherLevel(fieldIntensity(col, row, f), col, row, f.crawl);
      if (level <= 0) continue;
      const [r, g, b, a] = cellRgba(level);
      const i = (row * cols + col) * 4;
      rgba[i] = r;
      rgba[i + 1] = g;
      rgba[i + 2] = b;
      rgba[i + 3] = a;
      lit++;
    }
  }
  return lit;
}
