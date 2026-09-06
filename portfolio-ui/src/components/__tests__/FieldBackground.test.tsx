import { render } from "@testing-library/react";
import { describe, it, expect, vi, afterEach, beforeEach } from "vitest";
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

// Regression: the app is served behind an SPA fallback, so a missing
// /field/scene.json returns 200 text/html rather than 404. Probing only
// `response.ok` injected 155 KB of runtime against a page of HTML and left a
// 404 in the console — caught by looking at the running preview, not by a test.
describe("FieldBackground scene probe", () => {
  const realWebGL = HTMLCanvasElement.prototype.getContext;

  beforeEach(() => {
    // Pretend WebGL2 exists so the probe branch is reachable in jsdom.
    Object.defineProperty(HTMLCanvasElement.prototype, "getContext", {
      writable: true,
      value: (kind: string) => (kind === "webgl2" ? {} : null),
    });
  });

  afterEach(() => {
    Object.defineProperty(HTMLCanvasElement.prototype, "getContext", {
      writable: true,
      value: realWebGL,
    });
    vi.restoreAllMocks();
    document
      .querySelectorAll('script[src="/field/unicornStudio.umd.js"]')
      .forEach((s) => s.remove());
  });

  async function renderAndSettle() {
    render(<FieldBackground />);
    window.dispatchEvent(new Event("load"));
    await new Promise((r) => setTimeout(r, 400));
  }

  it("does not inject the runtime when the SPA fallback answers with HTML", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response("<!doctype html>", {
        status: 200,
        headers: { "content-type": "text/html" },
      }),
    );
    await renderAndSettle();
    expect(document.querySelector('script[src="/field/unicornStudio.umd.js"]')).toBeNull();
  });

  it("injects the runtime once a real scene is served", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response("{}", {
        status: 200,
        headers: { "content-type": "application/json" },
      }),
    );
    await renderAndSettle();
    expect(document.querySelector('script[src="/field/unicornStudio.umd.js"]')).not.toBeNull();
  });
});
