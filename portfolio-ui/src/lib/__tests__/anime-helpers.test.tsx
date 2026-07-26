// Guards the two runtime-behaviour changes made when the TypeScript gate was
// fixed (2026-07-26). Both were type errors that a vacuous `tsc --noEmit` had
// hidden, and both sit in live animation code with no other test cover.
//
// Each test couples to the code that actually changed — the built scope and
// the rendered component — so reverting either fix turns a test red. An
// earlier version of this file asserted library constants instead and would
// have passed against the un-fixed code.
import { describe, expect, it, vi } from "vitest";
import { render, cleanup } from "@testing-library/react";
import { stagger } from "animejs";
import { createMotionScope } from "../anime-scope";

// Capture the `position` argument of every timeline.add() the component makes.
const captured = vi.hoisted(() => ({ positions: [] as unknown[] }));

vi.mock("animejs", async (importOriginal) => {
  const actual = await importOriginal<typeof import("animejs")>();
  return {
    ...actual,
    createTimeline: (...args: Parameters<typeof actual.createTimeline>) => {
      const tl = actual.createTimeline(...args);
      const originalAdd = tl.add.bind(tl);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (tl as any).add = (...a: any[]) => {
        captured.positions.push(a[2]);
        return originalAdd(...(a as Parameters<typeof originalAdd>));
      };
      return tl;
    },
  };
});

describe("anime scope easing", () => {
  // anime-scope.ts passed EASE.emphasized (a raw 4-tuple) as the scope's
  // default `ease`. anime's parseEase returns `none` (linear) for anything
  // that is not a string or function, so the tuple silently meant "linear".
  // Asserted on the built scope so reverting anime-scope.ts fails here.
  it("uses a callable easing for the scope default, not a raw tuple", () => {
    const scope = createMotionScope(document.createElement("div"));
    const ease = (scope as unknown as { defaults?: { ease?: unknown } }).defaults?.ease;
    expect(Array.isArray(ease)).toBe(false);
    expect(typeof ease).toBe("function");
    scope.revert();
  });
});

describe("AnimatedBrackets stagger offset", () => {
  // Regression pin for the root cause. The component used to compute its
  // timeline position as `stagger(80)({} as Element, i, drawables.length)` —
  // a NUMBER where anime expects the targets ARRAY. `(n).length` is undefined,
  // stagger's fill loop never runs, and it returns 0 for every index.
  it("the old mistyped stagger call collapsed every index to 0", () => {
    const fn = stagger(80);
    const offsets = Array.from({ length: 4 }, (_, i) =>
      (fn as unknown as (t: unknown, i: number, n: unknown) => number)({}, i, 4),
    );
    expect(offsets).toEqual([0, 0, 0, 0]);
  });

  it("renders with distinct, increasing timeline positions", async () => {
    captured.positions = [];
    const { AnimatedBrackets } = await import("@/components/icons/animated/AnimatedBrackets");
    render(<AnimatedBrackets />);

    // Two bracket paths -> two add() calls, staggered not simultaneous.
    expect(captured.positions.length).toBeGreaterThanOrEqual(2);
    const positions = captured.positions.slice(0, 2) as number[];
    expect(positions[0]).toBe(0);
    expect(positions[1]).toBeGreaterThan(0);
    expect(new Set(positions).size).toBe(positions.length);
    // Last bracket (500 ms draw) must finish before the 800 ms cursor blink.
    expect(positions[1] + 500).toBeLessThan(800);
    cleanup();
  });
});
