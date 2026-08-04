import { describe, it, expect, vi, afterEach } from "vitest";
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
