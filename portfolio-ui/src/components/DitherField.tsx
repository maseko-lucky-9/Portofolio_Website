import { useEffect, useRef } from "react";
import { hasLiteParam, hasNoMotionParam } from "@/lib/motion";
import { frameDepth, paintField } from "@/lib/dither";

/** Canvas pixels per cell. The reference shader's grid resolves to 5.0 px on
 *  both axes at 1440x900, and it barely moves across viewports, so a constant
 *  is honest here and keeps the texture identical everywhere. */
const CELL = 5;
/** Deepest the rim frame ever reaches, in px. Fitted to the reference's decay:
 *  luminance 135 at the rim, 89 by 10 px, 34 by 30, still above ground at 80.
 *  Small viewports get proportionally less — see frameDepth. */
const MAX_DEPTH_PX = 60;
/** Deliberately not 60. The texture is pixel art — a slower cadence reads as
 *  more digital, not less finished, and it costs a quarter of the frames. */
const FPS = 15;
/** One lap of the travelling rim highlight. */
const SWEEP_MS = 14000;
/** One drift cycle of the field itself. */
const FIELD_MS = 24000;
/** How long one step of the dither crawl holds. */
const CRAWL_MS = 220;

/**
 * The ambient pixelated field.
 *
 * Ours, not a vendored scene: an ordered-dither quantisation of a composed
 * intensity field (rim frame + drifting core + wash), painted at cell
 * resolution and scaled up with smoothing off.
 *
 * Canvas 2D rather than WebGL on purpose — it runs in Playwright's WebKit,
 * which has no WebGL on Linux at all, so unlike the Unicorn field this layer
 * can be asserted on both e2e projects instead of skipping.
 *
 * Two canvases: an offscreen one holding a single pixel per cell, and the
 * visible one it is blitted onto. That is what makes a full-viewport field
 * affordable — 288x180 cells is ~50k `fillRect` calls a frame drawn directly,
 * and one `drawImage` drawn this way.
 *
 * Bail-outs, all of which leave the smooth CSS gradient in place:
 *   - `?lite=1` / `?nomo=1`    — opted out
 *   - no 2D context            — jsdom, or a browser under memory pressure
 *   - `prefers-reduced-motion` — one frame is painted, then it holds
 */
export function DitherField() {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    if (hasLiteParam() || hasNoMotionParam()) return;

    // jsdom has no 2D backend, and a real browser may refuse one under memory
    // pressure. Both land here, and the page keeps its gradient.
    const ctx = canvas.getContext("2d");
    const off = document.createElement("canvas");
    const offCtx = off.getContext("2d");
    if (!ctx || !offCtx) return;

    // The smooth gradient is the low-fidelity stand-in for exactly this layer.
    // Leaving both up is what read as haze over the field: a soft wash under a
    // quantised one, neither of them the design.
    const fallback = document.getElementById("field-fallback");

    const minFrameMs = 1000 / FPS;
    let cols = 0;
    let rows = 0;
    let depth = 0;
    let buf: ImageData | null = null;
    let raf = 0;
    let last = -Infinity;

    const measure = () => {
      cols = Math.max(1, Math.ceil(canvas.clientWidth / CELL));
      rows = Math.max(1, Math.ceil(canvas.clientHeight / CELL));
      // Backing store in CSS pixels, not devicePixelRatio: the compositor
      // upscales it and `image-rendering: pixelated` makes that nearest
      // neighbour. That is the look we want, at a quarter of the memory.
      canvas.width = cols * CELL;
      canvas.height = rows * CELL;
      off.width = cols;
      off.height = rows;
      buf = offCtx.createImageData(cols, rows);
      depth = frameDepth(canvas.width, canvas.height, CELL, MAX_DEPTH_PX);
      // Setting canvas.width resets every context property, so this has to be
      // re-applied on each measure or the blit comes back bilinear — which is
      // the entire effect, smoothed away.
      ctx.imageSmoothingEnabled = false;
    };

    const paint = (t: number) => {
      if (!buf) return;
      paintField(buf.data, {
        cols,
        rows,
        depth,
        head: (t % SWEEP_MS) / SWEEP_MS,
        crawl: Math.floor(t / CRAWL_MS),
        phase: (t % FIELD_MS) / FIELD_MS,
      });
      offCtx.putImageData(buf, 0, 0);
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(off, 0, 0, canvas.width, canvas.height);
      if (fallback) fallback.style.opacity = "0";
    };

    const loop = (t: number) => {
      raf = requestAnimationFrame(loop);
      // A hidden tab still runs rAF in some browsers; there is nothing to look
      // at, so skip the work rather than the frame.
      if (document.hidden || t - last < minFrameMs) return;
      last = t;
      paint(t);
    };

    const still = matchMedia("(prefers-reduced-motion: reduce)");

    const onResize = () => {
      measure();
      // Resizing clears the backing store, so a held frame has to be redrawn
      // or the layer vanishes for anyone who never starts the loop.
      if (still.matches) paint(0);
    };

    const start = () => {
      raf = requestAnimationFrame(loop);
    };

    measure();
    paint(0);

    if (!still.matches) {
      if (document.readyState === "complete") start();
      else window.addEventListener("load", start, { once: true });
    }
    window.addEventListener("resize", onResize);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("load", start);
      window.removeEventListener("resize", onResize);
    };
  }, []);

  return <canvas id="dither-field" ref={ref} aria-hidden="true" />;
}
