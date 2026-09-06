import { describe, it, expect } from "vitest";
import {
  BAYER_4,
  cellRgba,
  ditherLevel,
  edgeDistance,
  ellipse,
  fieldIntensity,
  frameDepth,
  frameIntensity,
  LEVELS,
  paintField,
  perimeterPhase,
  sweepBoost,
  type FieldFrame,
} from "@/lib/dither";

const frame = (over: Partial<FieldFrame> = {}): FieldFrame => ({
  cols: 40,
  rows: 30,
  depth: 6,
  head: 0.25,
  crawl: 0,
  phase: 0,
  ...over,
});

/** Alpha channel of every cell, as a grid, for a painted frame. */
function paint(f: FieldFrame) {
  const rgba = new Uint8ClampedArray(Math.max(0, f.cols * f.rows * 4));
  const lit = paintField(rgba, f);
  const alphaAt = (col: number, row: number) => rgba[(row * f.cols + col) * 4 + 3];
  return { rgba, lit, alphaAt };
}

describe("edgeDistance", () => {
  it("is 0 on the rim and grows inward", () => {
    expect(edgeDistance(0, 0, 40, 30)).toBe(0);
    expect(edgeDistance(39, 29, 40, 30)).toBe(0);
    expect(edgeDistance(3, 10, 40, 30)).toBe(3);
    expect(edgeDistance(20, 15, 40, 30)).toBe(14);
  });

  it("never goes negative on a degenerate grid", () => {
    // cols - 1 - col is negative here; unclamped this yields an intensity > 1
    // and a fully saturated frame.
    expect(edgeDistance(0, 0, 0, 0)).toBe(0);
    expect(edgeDistance(5, 5, 1, 1)).toBe(0);
  });
});

describe("frameIntensity", () => {
  it("peaks at the edge and reaches zero at depth", () => {
    expect(frameIntensity(0, 10, 40, 30, 6)).toBe(1);
    expect(frameIntensity(6, 10, 40, 30, 6)).toBe(0);
    expect(frameIntensity(9, 10, 40, 30, 6)).toBe(0);
  });

  it("decays as a square, not linearly", () => {
    // Halfway in, a linear ramp would read 0.5.
    expect(frameIntensity(3, 15, 40, 30, 6)).toBeCloseTo(0.25, 5);
  });

  it("is zero when there is no depth to fill", () => {
    expect(frameIntensity(0, 0, 40, 30, 0)).toBe(0);
    expect(frameIntensity(0, 0, 40, 30, -3)).toBe(0);
  });
});

describe("ditherLevel", () => {
  const tile = (intensity: number, crawl = 0) =>
    [0, 1, 2, 3].flatMap((r) => [0, 1, 2, 3].map((c) => ditherLevel(intensity, c, r, crawl)));

  it("saturates at full intensity and is dark at zero", () => {
    expect(tile(1).every((v) => v === LEVELS)).toBe(true);
    expect(tile(0).every((v) => v === 0)).toBe(true);
  });

  it("splits a partial step across the tile — this is the dither", () => {
    // 0.55 of six steps is 3.3: the Bayer bias rounds some cells to 3 and the
    // rest to 4, which is what puts texture on the boundary instead of a hard
    // contour.
    const levels = tile(0.55);
    expect(new Set(levels)).toEqual(new Set([3, 4]));
  });

  it("keeps a continuous ramp rather than an on/off screen", () => {
    // The defect this replaced: a binary threshold fell from a lit rim to bare
    // ground within two cells, measured 207 to 5 over 10 px where the
    // reference ramps 135 to 22 over 80.
    for (let i = 0.15; i < 1; i += 0.1) {
      expect(tile(i).some((v) => v > 0)).toBe(true);
    }
  });

  it("clamps to the step count at both ends", () => {
    expect(Math.max(...tile(4))).toBe(LEVELS);
    expect(Math.min(...tile(-4))).toBe(0);
  });

  it("survives a negative crawl", () => {
    // `%` keeps the dividend's sign in JS, so an unnormalised negative crawl
    // biases every cell a step darker.
    expect(tile(0.55, -5)).toEqual(tile(0.55, 11));
  });

  it("moves the pattern when crawl advances", () => {
    expect(tile(0.55, 0).join("")).not.toBe(tile(0.55, 4).join(""));
  });

  it("is dark when there are no steps to quantise to", () => {
    expect(ditherLevel(1, 0, 0, 0, 0)).toBe(0);
  });

  it("uses all sixteen thresholds exactly once", () => {
    expect([...BAYER_4.flat()].sort((a, b) => a - b)).toEqual([...Array(16).keys()]);
  });
});

describe("sweepBoost", () => {
  it("peaks under the head and dies outside the band", () => {
    expect(sweepBoost(0.5, 0.5, 0.16)).toBe(1);
    expect(sweepBoost(0.9, 0.5, 0.16)).toBe(0);
  });

  it("wraps across the seam", () => {
    // 0.98 and 0.02 are 0.04 apart the short way round, not 0.96.
    expect(sweepBoost(0.98, 0.02, 0.16)).toBeGreaterThan(0);
  });

  it("is inert with no width", () => {
    expect(sweepBoost(0.5, 0.5, 0)).toBe(0);
  });

  it("normalises a head outside one lap instead of exploding", () => {
    // Unnormalised, the wrap fold turns head = -1 into a gain above 1 for every
    // phase on the ring, which floods the whole frame to full brightness.
    expect(sweepBoost(0.5, -1, 0.16)).toBe(sweepBoost(0.5, 0, 0.16));
    expect(sweepBoost(0.5, 2.5, 0.16)).toBe(1);
    for (let phase = 0; phase < 1; phase += 0.05) {
      expect(sweepBoost(phase, -1, 0.16)).toBeLessThanOrEqual(1);
    }
  });
});

describe("ellipse", () => {
  it("peaks at the centre and reaches zero at the rim", () => {
    expect(ellipse(0.5, 0.5, 0.5, 0.5, 0.4, 0.25)).toBe(1);
    expect(ellipse(0.9, 0.5, 0.5, 0.5, 0.4, 0.25)).toBe(0);
    expect(ellipse(0.5, 0.75, 0.5, 0.5, 0.4, 0.25)).toBe(0);
  });

  it("is elliptical, not circular", () => {
    // Same distance along each axis must NOT give the same value when the
    // radii differ, or the field's wide core renders as a disc.
    expect(ellipse(0.7, 0.5, 0.5, 0.5, 0.4, 0.25)).not.toBeCloseTo(
      ellipse(0.5, 0.7, 0.5, 0.5, 0.4, 0.25),
      3,
    );
  });

  it("is zero when a radius collapses", () => {
    expect(ellipse(0.5, 0.5, 0.5, 0.5, 0, 0.25)).toBe(0);
    expect(ellipse(0.5, 0.5, 0.5, 0.5, 0.4, -1)).toBe(0);
  });
});

describe("fieldIntensity", () => {
  it("lights the interior, not just the rim", () => {
    // The whole point of the rework: an edge-only frame left the middle of the
    // page black, where the reference's interior peaks at luminance 137.
    const f = frame({ cols: 100, rows: 60, depth: 8 });
    const middle = fieldIntensity(68, 25, f); // inside the core blob
    expect(middle).toBeGreaterThan(0.2);
  });

  it("still peaks on the rim", () => {
    const f = frame({ cols: 100, rows: 60, depth: 8 });
    expect(fieldIntensity(0, 30, f)).toBeGreaterThan(0.9);
  });

  it("never exceeds 1, even where the rim and a blob overlap", () => {
    const f = frame({ cols: 100, rows: 60, depth: 40 });
    for (let row = 0; row < f.rows; row += 3) {
      for (let col = 0; col < f.cols; col += 3) {
        expect(fieldIntensity(col, row, f)).toBeLessThanOrEqual(1);
      }
    }
  });

  it("drifts with phase", () => {
    const f = frame({ cols: 100, rows: 60, depth: 8 });
    const at = (phase: number) => fieldIntensity(70, 22, { ...f, phase });
    expect(at(0)).not.toBeCloseTo(at(0.5), 3);
  });

  it("moves the blobs, not just the arms", () => {
    // The test above passes on rotation alone: the arms are a function of
    // phase too, so freezing the positional drift left it green. Cell (20,12)
    // sits inside the upper-left wash, clear of the rim and well outside the
    // core — the wash has no arm term, so the only thing phase can change
    // there is where the blob is.
    const f = frame({ cols: 100, rows: 60, depth: 8 });
    const at = (phase: number) => fieldIntensity(20, 12, { ...f, phase });
    // sin(0) = 0 against sin(pi/2) = 1: the two extremes of the drift.
    expect(at(0)).not.toBeCloseTo(at(0.25), 3);
  });

  it("survives a one-cell grid", () => {
    const v = fieldIntensity(0, 0, frame({ cols: 1, rows: 1, depth: 1 }));
    expect(Number.isFinite(v)).toBe(true);
    expect(v).toBeGreaterThanOrEqual(0);
  });
});

describe("cellRgba", () => {
  it("is the signal cyan at the tail and trends white at the peak", () => {
    expect(cellRgba(0).slice(0, 3)).toEqual([56, 189, 248]);
    const peak = cellRgba(LEVELS);
    expect(peak[0]).toBeGreaterThan(56);
    expect(peak[1]).toBeGreaterThan(189);
    expect(peak[2]).toBeGreaterThan(248);
  });

  it("ramps alpha with the step and stops short of opaque", () => {
    // Full opacity measured luminance 206 at the rim against the reference's
    // 144, so the peak is fitted to close that and must stay well under 255.
    expect(cellRgba(0)[3]).toBe(0);
    expect(cellRgba(LEVELS)[3]).toBeGreaterThan(128);
    expect(cellRgba(LEVELS)[3]).toBeLessThan(179);
  });

  it("clamps an out-of-range step instead of emitting a channel over 255", () => {
    const over = cellRgba(LEVELS * 4);
    expect(Math.max(...over)).toBeLessThanOrEqual(255);
    expect(cellRgba(-2)).toEqual(cellRgba(0));
  });
});

describe("frameDepth", () => {
  it("caps at the fitted desktop rim", () => {
    // 1440x900: 7% of the shorter axis is 63 px, over the 60 px cap.
    expect(frameDepth(1440, 900, 5)).toBe(12); // 60 / 5
  });

  it("thins out on a phone instead of eating a third of the width", () => {
    // The defect this exists for: a flat 60 px depth is 12 cells a side, and
    // at 375 px wide the two bands leave barely a third of the screen clear —
    // the hero copy ended up sitting on dithered noise.
    const phone = frameDepth(375, 812, 5);
    expect(phone).toBeLessThan(frameDepth(1440, 900, 5));
    expect(phone * 5 * 2).toBeLessThan(375 * 0.3);
  });

  it("follows the shorter axis, so a short landscape window thins too", () => {
    expect(frameDepth(1440, 400, 5)).toBe(frameDepth(400, 1440, 5));
    expect(frameDepth(1440, 400, 5)).toBeLessThan(frameDepth(1440, 900, 5));
  });

  it("never collapses to nothing on a tiny or negative viewport", () => {
    expect(frameDepth(10, 10, 5)).toBe(1);
    expect(frameDepth(0, 0, 5)).toBe(1);
    expect(frameDepth(-100, -100, 5)).toBe(1);
  });

  it("is zero when there is no cell size to divide by", () => {
    expect(frameDepth(1440, 900, 0)).toBe(0);
  });
});

describe("paintField", () => {
  it("writes one RGBA pixel per lit cell and reports the count", () => {
    const { rgba, lit, alphaAt } = paint(frame());
    expect(lit).toBeGreaterThan(0);
    const nonZero = [...rgba].filter((_, i) => i % 4 === 3 && rgba[i] > 0).length;
    expect(nonZero).toBe(lit);
    expect(alphaAt(0, 15)).toBeGreaterThan(0); // rim
  });

  it("covers the interior, not only the rim", () => {
    // An edge-only field left the middle of the page black. At least a fifth
    // of the interior must carry paint.
    const f = frame({ cols: 100, rows: 60, depth: 8 });
    const { alphaAt } = paint(f);
    let inside = 0;
    let painted = 0;
    for (let row = f.depth; row < f.rows - f.depth; row++) {
      for (let col = f.depth; col < f.cols - f.depth; col++) {
        inside++;
        if (alphaAt(col, row) > 0) painted++;
      }
    }
    expect(painted / inside).toBeGreaterThan(0.2);
  });

  it("clears the buffer, so frames do not accumulate", () => {
    const f = frame();
    const rgba = new Uint8ClampedArray(f.cols * f.rows * 4);
    rgba.fill(255);
    paintField(rgba, f);
    // Somewhere must have gone back to transparent; a missing clear leaves the
    // previous frame's cells lit for ever.
    expect([...rgba].some((v, i) => i % 4 === 3 && v === 0)).toBe(true);
  });

  it("paints nothing into a degenerate grid", () => {
    for (const bad of [{ cols: 0 }, { rows: 0 }]) {
      const f = frame(bad);
      const rgba = new Uint8ClampedArray(16);
      expect(paintField(rgba, f)).toBe(0);
    }
  });

  it("changes with the drift phase", () => {
    const a = paint(frame({ phase: 0 })).rgba.join(",");
    const b = paint(frame({ phase: 0.5 })).rgba.join(",");
    expect(a).not.toBe(b);
  });

  it("brightens the arc under the sweep head more than the far side", () => {
    const head = 0.25;
    const f = frame({ head });
    const { alphaAt } = paint(f);
    const nearSum = (target: number) => {
      let sum = 0;
      for (let row = 0; row < f.rows; row++) {
        for (let col = 0; col < f.cols; col++) {
          if (frameIntensity(col, row, f.cols, f.rows, f.depth) <= 0) continue;
          let d = Math.abs(perimeterPhase(col, row, f.cols, f.rows) - target);
          if (d > 0.5) d = 1 - d;
          if (d < 0.08) sum += alphaAt(col, row);
        }
      }
      return sum;
    };
    expect(nearSum(head)).toBeGreaterThan(nearSum((head + 0.5) % 1));
  });
});
