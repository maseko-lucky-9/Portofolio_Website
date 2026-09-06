import { render } from "@testing-library/react";
import { describe, it, expect, vi, afterEach } from "vitest";
import { DitherField } from "@/components/DitherField";

/** A 2D context stand-in. jsdom has no canvas backend at all, so every path
 *  past `getContext` is only reachable by handing the component one of these. */
function fakeContext() {
  return {
    fillStyle: "",
    imageSmoothingEnabled: true,
    clearRect: vi.fn(),
    fillRect: vi.fn(),
    drawImage: vi.fn(),
    putImageData: vi.fn(),
    createImageData: vi.fn((w: number, h: number) => ({
      width: w,
      height: h,
      data: new Uint8ClampedArray(Math.max(1, w * h * 4)),
    })),
  };
}

/** The component takes two contexts — the visible canvas and the offscreen
 *  cell-resolution buffer — so the spy has to keep handing them out. */
function withContext(ctx: ReturnType<typeof fakeContext> | null) {
  return vi
    .spyOn(HTMLCanvasElement.prototype, "getContext")
    .mockReturnValue(ctx as unknown as CanvasRenderingContext2D);
}

function setReducedMotion(reduce: boolean) {
  vi.spyOn(window, "matchMedia").mockImplementation(
    (query: string) =>
      ({
        matches: query.includes("prefers-reduced-motion") ? reduce : false,
        media: query,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        addListener: vi.fn(),
        removeListener: vi.fn(),
        dispatchEvent: vi.fn(),
        onchange: null,
      }) as unknown as MediaQueryList,
  );
}

/** The smooth gradient the field replaces. Rendered by FieldBackground in the
 *  real tree, so the tests have to stand it up themselves. */
function mountFallback() {
  const el = document.createElement("div");
  el.id = "field-fallback";
  el.style.opacity = "1";
  document.body.appendChild(el);
  return el;
}

afterEach(() => {
  vi.restoreAllMocks();
  document.getElementById("field-fallback")?.remove();
  window.history.replaceState({}, "", "/");
});

describe("DitherField", () => {
  it("renders a decorative canvas", () => {
    const { container } = render(<DitherField />);
    const canvas = container.querySelector("canvas#dither-field");
    expect(canvas).toBeInTheDocument();
    // Purely ambient: it must never reach the accessibility tree.
    expect(canvas).toHaveAttribute("aria-hidden", "true");
  });

  it("does not touch the canvas at all in lite mode", () => {
    window.history.replaceState({}, "", "/?lite=1");
    const getContext = withContext(fakeContext());
    render(<DitherField />);
    expect(getContext).not.toHaveBeenCalled();
  });

  it("does not touch the canvas at all with ?nomo=1", () => {
    window.history.replaceState({}, "", "/?nomo=1");
    const getContext = withContext(fakeContext());
    render(<DitherField />);
    expect(getContext).not.toHaveBeenCalled();
  });

  it("survives a browser that hands back no 2D context", () => {
    // jsdom's real behaviour, so it is also what the full-App smoke test walks
    // into. A throw here would take the whole page down.
    const raf = vi.spyOn(window, "requestAnimationFrame");
    withContext(null);
    expect(() => render(<DitherField />)).not.toThrow();
    expect(raf).not.toHaveBeenCalled();
  });

  it("leaves the gradient alone when it cannot paint", () => {
    // Every bail-out has to end with the page still having a background.
    const fallback = mountFallback();
    withContext(null);
    render(<DitherField />);
    expect(fallback.style.opacity).toBe("1");
  });

  it("blits a frame on mount, before any animation starts", () => {
    const ctx = fakeContext();
    withContext(ctx);
    setReducedMotion(false);
    render(<DitherField />);
    // Synchronous on mount: the first rendered frame, and any thumbnail taken
    // of it, has to already show the field.
    expect(ctx.putImageData).toHaveBeenCalled();
    expect(ctx.drawImage).toHaveBeenCalled();
  });

  it("turns off image smoothing — that is the pixelation", () => {
    // The buffer is one pixel per cell and is scaled up to fill the viewport.
    // Left smoothing on, the whole effect blurs into the gradient it replaced.
    const ctx = fakeContext();
    withContext(ctx);
    setReducedMotion(false);
    render(<DitherField />);
    expect(ctx.imageSmoothingEnabled).toBe(false);
  });

  it("hides the smooth gradient once it has painted", () => {
    // Both layers up at once is what read as haze: a soft wash under a
    // quantised one, neither of them the design.
    const fallback = mountFallback();
    withContext(fakeContext());
    setReducedMotion(false);
    render(<DitherField />);
    expect(fallback.style.opacity).toBe("0");
  });

  it("holds a single frame under reduced motion and never loops", () => {
    const ctx = fakeContext();
    withContext(ctx);
    setReducedMotion(true);
    const raf = vi.spyOn(window, "requestAnimationFrame");

    render(<DitherField />);

    expect(ctx.drawImage).toHaveBeenCalled(); // "reduce", not "remove"
    expect(raf).not.toHaveBeenCalled();
  });

  it("starts the loop when motion is allowed and cancels it on unmount", () => {
    const ctx = fakeContext();
    withContext(ctx);
    setReducedMotion(false);
    const raf = vi.spyOn(window, "requestAnimationFrame").mockReturnValue(1234);
    const cancel = vi.spyOn(window, "cancelAnimationFrame");

    const { unmount } = render(<DitherField />);
    expect(raf).toHaveBeenCalled();

    unmount();
    // A leaked rAF keeps repainting a canvas that is no longer in the document.
    expect(cancel).toHaveBeenCalledWith(1234);
  });

  it("repaints on resize so the frame is not lost when the viewport changes", () => {
    const ctx = fakeContext();
    withContext(ctx);
    setReducedMotion(true); // the held-frame path is the one that needs this
    render(<DitherField />);

    const before = ctx.drawImage.mock.calls.length;
    window.dispatchEvent(new Event("resize"));
    expect(ctx.drawImage.mock.calls.length).toBeGreaterThan(before);
  });

  it("re-applies smoothing-off after a resize", () => {
    // Assigning canvas.width resets every context property, smoothing
    // included, so a resize silently restores the blur unless measure() does
    // this again.
    const ctx = fakeContext();
    withContext(ctx);
    setReducedMotion(true);
    render(<DitherField />);

    ctx.imageSmoothingEnabled = true;
    window.dispatchEvent(new Event("resize"));
    expect(ctx.imageSmoothingEnabled).toBe(false);
  });

  it("removes its resize listener on unmount", () => {
    const ctx = fakeContext();
    withContext(ctx);
    setReducedMotion(true);
    const { unmount } = render(<DitherField />);

    unmount();
    const after = ctx.drawImage.mock.calls.length;
    window.dispatchEvent(new Event("resize"));
    expect(ctx.drawImage.mock.calls.length).toBe(after);
  });
});
