import { render } from "@testing-library/react";
import { describe, it, expect, vi, afterEach } from "vitest";
import { FieldBackground } from "@/components/FieldBackground";

describe("FieldBackground", () => {
  afterEach(() => {
    vi.restoreAllMocks();
    document
      .querySelectorAll('script[src="/field/unicornStudio.umd.js"]')
      .forEach((s) => s.remove());
  });

  it("renders host, fallback and grid on the first paint", () => {
    const { container } = render(<FieldBackground />);
    expect(container.querySelector("#aura-bg #us-host")).toHaveAttribute(
      "data-us-project-src",
      "/field/scene.json",
    );
    expect(container.querySelector("#field-fallback")).toBeInTheDocument();
    expect(container.querySelector(".grid-bg")).toBeInTheDocument();
  });

  it("marks the whole stack decorative", () => {
    const { container } = render(<FieldBackground />);
    for (const sel of ["#aura-bg", "#field-fallback", ".grid-bg"]) {
      expect(container.querySelector(sel)).toHaveAttribute("aria-hidden", "true");
    }
  });

  // jsdom has no WebGL2 context, which is the same branch a browser without
  // WebGL takes: never fetch the scene, never inject 155 KB of runtime.
  it("injects nothing when WebGL2 is unavailable", async () => {
    const fetchSpy = vi.spyOn(globalThis, "fetch");
    render(<FieldBackground />);
    window.dispatchEvent(new Event("load"));
    await new Promise((r) => setTimeout(r, 300));
    expect(document.querySelector('script[src="/field/unicornStudio.umd.js"]')).toBeNull();
    expect(fetchSpy).not.toHaveBeenCalled();
  });
});
