import { describe, it, expect, vi, afterEach, beforeEach } from "vitest";
import { scrollToSection } from "../scroll-to-section";

// setup.ts installs matchMedia as a writable data property, so restore by
// assignment — vi.spyOn would try to redefine it as an accessor and throw.
const originalMatchMedia = window.matchMedia;
afterEach(() => {
  window.matchMedia = originalMatchMedia;
});

function stubMedia(matchesFor: Record<string, boolean>) {
  window.matchMedia = ((query: string) => ({
    matches: matchesFor[query] ?? false,
    media: query,
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => false,
  })) as unknown as typeof window.matchMedia;
}

describe("scrollToSection", () => {
  // Touch devices must jump instantly: sections below the fold are LazySection
  // placeholders with fixed pixel reserves that expand mid-animation, so a
  // smooth scroll's target drifts (~4,000px was measured for #services).
  it("uses an instant jump on a coarse pointer even without reduced motion", () => {
    stubMedia({ "(pointer: coarse)": true, "(prefers-reduced-motion: reduce)": false });
    const el = document.createElement("div");
    el.scrollIntoView = vi.fn();

    scrollToSection(el);

    expect(el.scrollIntoView).toHaveBeenCalledWith({ behavior: "instant", block: "start" });
  });

  it("keeps smooth scrolling on a fine pointer with no reduced-motion preference", () => {
    stubMedia({ "(pointer: coarse)": false, "(prefers-reduced-motion: reduce)": false });
    const el = document.createElement("div");
    el.scrollIntoView = vi.fn();

    scrollToSection(el);

    expect(el.scrollIntoView).toHaveBeenCalledWith({ behavior: "smooth", block: "start" });
  });

  it("uses an instant jump under reduced motion on a fine pointer", () => {
    stubMedia({ "(pointer: coarse)": false, "(prefers-reduced-motion: reduce)": true });
    const el = document.createElement("div");
    el.scrollIntoView = vi.fn();

    scrollToSection(el);

    expect(el.scrollIntoView).toHaveBeenCalledWith({ behavior: "instant", block: "start" });
  });

  // The hold() loop is the actual fix for the ~4,000px lazy-section drift, and
  // it has already shipped wrong once (an earlier stability-based version
  // settled 460px past the target). These drive the timers directly.
  describe("hold() re-assert loop", () => {
    beforeEach(() => {
      vi.useFakeTimers();
      stubMedia({ "(pointer: coarse)": true });
    });
    afterEach(() => {
      vi.useRealTimers();
    });

    /** Element whose top follows `tops` on successive reads. */
    function elementDrifting(tops: number[]) {
      const el = document.createElement("div");
      let i = 0;
      el.getBoundingClientRect = () =>
        ({ top: tops[Math.min(i++, tops.length - 1)] }) as DOMRect;
      el.scrollIntoView = vi.fn();
      return el;
    }

    it("re-asserts the position when the target drifts", () => {
      // 80 = landing reference, then drifts to 860 (a section above expanded).
      const el = elementDrifting([80, 860, 80, 80]);
      scrollToSection(el);
      expect(el.scrollIntoView).toHaveBeenCalledTimes(1); // the initial jump

      vi.advanceTimersByTime(50);
      expect(el.scrollIntoView).toHaveBeenCalledTimes(2); // corrected the drift
    });

    it("does not re-scroll while the target stays put", () => {
      const el = elementDrifting([80]);
      scrollToSection(el);
      expect(el.scrollIntoView).toHaveBeenCalledTimes(1);

      vi.advanceTimersByTime(500);
      expect(el.scrollIntoView).toHaveBeenCalledTimes(1); // still just the jump
    });

    it("stops after the retry budget and leaves no timer running", () => {
      // Never settles — worst case. Must still terminate.
      const el = elementDrifting([80, 900]);
      scrollToSection(el);

      vi.advanceTimersByTime(5000);

      // 1 initial jump + at most MAX_SETTLE_TRIES (20) corrections.
      expect((el.scrollIntoView as ReturnType<typeof vi.fn>).mock.calls.length)
        .toBeLessThanOrEqual(21);
      expect(vi.getTimerCount()).toBe(0);
    });

    it("schedules no follow-up at all on the smooth path", () => {
      stubMedia({ "(pointer: coarse)": false, "(prefers-reduced-motion: reduce)": false });
      const el = elementDrifting([80, 900]);
      scrollToSection(el);

      expect(vi.getTimerCount()).toBe(0);
      vi.advanceTimersByTime(5000);
      expect(el.scrollIntoView).toHaveBeenCalledTimes(1);
    });
  });

  it("resolves a selector string and no-ops on a missing target", () => {
    stubMedia({ "(pointer: coarse)": true });
    const el = document.createElement("div");
    el.id = "target";
    el.scrollIntoView = vi.fn();
    document.body.appendChild(el);

    scrollToSection("#target");
    expect(el.scrollIntoView).toHaveBeenCalledTimes(1);

    expect(() => scrollToSection("#does-not-exist")).not.toThrow();

    document.body.removeChild(el);
  });
});
