/**
 * ChatAvatar state machine — asserts `data-avatar-state` / `data-glow`
 * attribute transitions, never animation frames. jsdom's stubbed matchMedia
 * (always false) means reduced-motion is OFF here, so timers drive the full
 * behavior path.
 */
import { render, screen, act } from "@testing-library/react";
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { animate } from "animejs";
import { ChatAvatar, SLEEP_AFTER_MS, CELEBRATE_MS } from "@/components/ChatAvatar";

// Real anime.js, but with `animate` wrapped so tests can see WHICH element
// each animation targets — the only way to prove the bounce and React's
// hover-rotate stay on separate nodes.
vi.mock("animejs", async (importOriginal) => {
  const actual = await importOriginal<typeof import("animejs")>();
  return { ...actual, animate: vi.fn(actual.animate) };
});

const animateMock = vi.mocked(animate);
const animatedTargets = () => animateMock.mock.calls.map((c) => c[0]);

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
    animateMock.mockClear();
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

  it("never animates the wrapper React styles — the bounce gets its own node", () => {
    // anime.js caches an element's parsed transform on first animate() and
    // rebuilds the whole string from that cache each frame, so pointing the
    // bounce at the wrapper (which React styles for the hover tilt) left the
    // launcher stuck at rotate(4deg) after a reply landed.
    //
    // Assert the actual target passed to animate(), not the DOM shape: an
    // earlier version of this test only checked that a nested <span> existed,
    // and stayed green when the bounce was pointed back at the wrapper.
    const { rerender } = renderAvatar();
    const wrapper = avatar();

    rerender(
      <div data-testid="chat-avatar-wrapper-probe">
        <ChatAvatar open={false} responding={false} celebrateKey={1} />
      </div>,
    );

    const targets = animatedTargets();
    expect(targets.length, "celebrate should have animated something").toBeGreaterThan(0);
    expect(targets, "the bounce must not touch React's node").not.toContain(wrapper);

    const bounceNode = wrapper.querySelector("span");
    expect(targets).toContain(bounceNode);
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
