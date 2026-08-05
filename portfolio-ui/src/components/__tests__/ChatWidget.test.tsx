/**
 * ChatWidget — locks the launcher's accessible name (the e2e suite keys on
 * it), proves the avatar persists in the open state, and pins the stream
 * watchdog: a silent hung stream must abort at the idle timeout and clear
 * `busy` instead of leaving the bulb lit forever.
 */
import { render, screen, fireEvent, act } from "@testing-library/react";
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { ChatWidget } from "@/components/ChatWidget";

const LAUNCHER_NAME = /Ask about Thulani's experience/i;

describe("ChatWidget", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.useRealTimers();
  });

  it("keeps the e2e-keyed launcher aria-label", () => {
    render(<ChatWidget />);
    expect(screen.getByRole("button", { name: LAUNCHER_NAME })).toBeInTheDocument();
  });

  it("keeps the avatar (not an X icon) in the launcher while the panel is open", () => {
    render(<ChatWidget />);
    const launcher = screen.getByRole("button", { name: LAUNCHER_NAME });
    fireEvent.click(launcher);

    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(launcher.querySelector("[data-avatar-state]")).not.toBeNull();
    expect(screen.getByTestId("avatar-close-badge")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Close chat/i })).toBeInTheDocument();
  });

  it("watchdog aborts a hung stream and clears busy", async () => {
    vi.useFakeTimers();

    // ok response whose reader never yields — read() settles only when the
    // fetch AbortSignal fires. Without the watchdog this hangs forever.
    vi.stubGlobal(
      "fetch",
      vi.fn((_url: string, init?: RequestInit) => {
        const signal = init?.signal as AbortSignal;
        return Promise.resolve({
          ok: true,
          body: {
            getReader: () => ({
              read: () =>
                new Promise((_resolve, reject) => {
                  signal.addEventListener("abort", () =>
                    reject(new DOMException("Aborted", "AbortError")),
                  );
                }),
            }),
          },
        } as unknown as Response);
      }),
    );

    render(<ChatWidget />);
    fireEvent.click(screen.getByRole("button", { name: LAUNCHER_NAME }));
    // Fire a canned suggestion — no typing needed.
    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: /Kubernetes background/i }));
    });

    const avatarEl = () =>
      screen
        .getByRole("button", { name: LAUNCHER_NAME })
        .querySelector("[data-avatar-state]") as HTMLElement;
    expect(avatarEl().getAttribute("data-glow")).toBe("true");
    expect(screen.getByText(/Thinking…/)).toBeInTheDocument();

    await act(async () => {
      await vi.advanceTimersByTimeAsync(26_000);
    });

    expect(screen.getByText(/Couldn't reach the assistant/i)).toBeInTheDocument();
    expect(avatarEl().getAttribute("data-glow")).toBe("false");
    expect(screen.queryByText(/Thinking…/)).toBeNull();
  });
});
