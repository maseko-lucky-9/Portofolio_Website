/**
 * ChatAvatar state machine — asserts `data-avatar-state` / `data-glow`
 * attribute transitions, never animation frames. jsdom's stubbed matchMedia
 * (always false) means reduced-motion is OFF here, so timers drive the full
 * behavior path.
 */
import { render, screen, act } from "@testing-library/react";
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { ChatAvatar, SLEEP_AFTER_MS, CELEBRATE_MS } from "@/components/ChatAvatar";

const avatar = () =>
  screen.getByTestId("chat-avatar-wrapper-probe").firstElementChild as HTMLElement;

function renderAvatar(props: Partial<React.ComponentProps<typeof ChatAvatar>> = {}) {
  return render(
    <div data-testid="chat-avatar-wrapper-probe">
      <ChatAvatar open={false} responding={false} celebrateKey={0} {...props} />
    </div>,
  );
}

describe("ChatAvatar", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it("renders decorative SVG in the awake state", () => {
    renderAvatar();
    const el = avatar();
    expect(el.getAttribute("aria-hidden")).toBe("true");
    expect(el.getAttribute("data-avatar-state")).toBe("awake");
    expect(el.getAttribute("data-glow")).toBe("false");
    expect(el.querySelector("svg")).not.toBeNull();
  });

  it("lights the bulb while responding", () => {
    renderAvatar({ responding: true });
    expect(avatar().getAttribute("data-glow")).toBe("true");
    expect(avatar().getAttribute("data-avatar-state")).toBe("responding");
  });

  it("shows the close badge only while open", () => {
    const { rerender } = renderAvatar({ open: false });
    expect(screen.queryByTestId("avatar-close-badge")).toBeNull();
    rerender(
      <div data-testid="chat-avatar-wrapper-probe">
        <ChatAvatar open={true} responding={false} celebrateKey={0} />
      </div>,
    );
    expect(screen.getByTestId("avatar-close-badge")).toBeInTheDocument();
  });

  it("celebrates on a key bump, then settles; the initial key 0 never celebrates", () => {
    const { rerender } = renderAvatar();
    expect(avatar().getAttribute("data-avatar-state")).toBe("awake");

    rerender(
      <div data-testid="chat-avatar-wrapper-probe">
        <ChatAvatar open={false} responding={false} celebrateKey={1} />
      </div>,
    );
    expect(avatar().getAttribute("data-avatar-state")).toBe("celebrating");

    act(() => {
      vi.advanceTimersByTime(CELEBRATE_MS + 50);
    });
    expect(avatar().getAttribute("data-avatar-state")).toBe("awake");
  });

  it("sleeps after inactivity and wakes on activity", () => {
    renderAvatar();
    act(() => {
      vi.advanceTimersByTime(SLEEP_AFTER_MS + 100);
    });
    expect(avatar().getAttribute("data-avatar-state")).toBe("sleeping");

    act(() => {
      window.dispatchEvent(new MouseEvent("pointermove", { clientX: 5, clientY: 5 }));
    });
    expect(avatar().getAttribute("data-avatar-state")).toBe("awake");
  });

  it("bounces on a node React does not style, so hover-rotate is never clobbered", () => {
    // anime.js caches an element's parsed transform on first animate() and
    // rebuilds the whole string from that cache each frame, so sharing a node
    // with React's hover-rotate left the launcher stuck at rotate(4deg) after
    // a celebrate. The two writers must stay on separate elements.
    renderAvatar({ celebrateKey: 1 });
    const wrapper = avatar();
    const bounceTarget = wrapper.querySelector("span");

    expect(bounceTarget, "expected a dedicated bounce node inside the wrapper").not.toBeNull();
    expect(bounceTarget).not.toBe(wrapper);
    // The wrapper is React's: it carries the hover transition, not the bounce.
    expect(wrapper.style.transition).toContain("transform");
    expect(bounceTarget!.style.transition).toBe("");
  });

  it("does not sleep under prefers-reduced-motion — the lid is a 400ms animation", () => {
    // setup.ts stubs matchMedia to always-false, so the `reduced` branch is
    // otherwise unreachable in this suite. useReducedMotion reads matchMedia
    // per render, so overriding it here is enough — no module mock needed.
    const real = window.matchMedia;
    window.matchMedia = ((query: string) =>
      ({
        matches: query.includes("prefers-reduced-motion"),
        media: query,
        addEventListener: () => {},
        removeEventListener: () => {},
      }) as unknown as MediaQueryList) as typeof window.matchMedia;

    try {
      renderAvatar();
      act(() => {
        vi.advanceTimersByTime(SLEEP_AFTER_MS * 2);
      });
      expect(avatar().getAttribute("data-avatar-state")).toBe("awake");
    } finally {
      window.matchMedia = real;
    }
  });

  it("never sleeps while the panel is open or a reply is streaming", () => {
    const { rerender } = renderAvatar({ open: true });
    act(() => {
      vi.advanceTimersByTime(SLEEP_AFTER_MS * 2);
    });
    expect(avatar().getAttribute("data-avatar-state")).toBe("awake");

    rerender(
      <div data-testid="chat-avatar-wrapper-probe">
        <ChatAvatar open={false} responding={true} celebrateKey={0} />
      </div>,
    );
    act(() => {
      vi.advanceTimersByTime(SLEEP_AFTER_MS * 2);
    });
    expect(avatar().getAttribute("data-avatar-state")).toBe("responding");
  });
});
