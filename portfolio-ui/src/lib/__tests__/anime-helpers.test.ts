// Guards the two runtime-behaviour changes made when the TypeScript gate was
// fixed (2026-07-26). Both were type errors that a vacuous `tsc --noEmit`
// had hidden, and both sit in live animation code with no other test cover.
import { describe, expect, it } from "vitest";
import { stagger } from "animejs";
import { EASE, EASE_FN } from "../motion";

describe("anime.js easing params", () => {
  // anime-scope.ts previously passed EASE.emphasized (a raw 4-tuple) to a
  // scope `ease:` field, which expects an EasingParam. EASE_FN.* is the
  // cubicBezier-wrapped form; motion.ts documents this split.
  it("EASE.* are raw tuples, unusable as an anime ease param", () => {
    expect(Array.isArray(EASE.emphasized)).toBe(true);
    expect(EASE.emphasized).toHaveLength(4);
  });

  it("EASE_FN.* are callable easing functions", () => {
    for (const [name, fn] of Object.entries(EASE_FN)) {
      expect(typeof fn, `EASE_FN.${name}`).toBe("function");
      // Easing functions map progress 0→0 and 1→1.
      expect(fn(0)).toBeCloseTo(0, 5);
      expect(fn(1)).toBeCloseTo(1, 5);
    }
  });
});

describe("AnimatedBrackets stagger offset", () => {
  // The component used to call stagger(80) manually with a dummy Element to
  // compute a timeline position. That call was mistyped (it passed a number
  // where a TargetsArray was expected). For a default linear stagger the
  // offset is just index * step — this test pins that equivalence.
  it("index * step matches a default linear stagger", () => {
    const step = 80;
    const targets = [{}, {}, {}] as unknown as Parameters<ReturnType<typeof stagger>>[2];
    const fn = stagger(step);
    for (let i = 0; i < 3; i++) {
      expect(fn(undefined, i, targets)).toBe(i * step);
    }
  });
});
