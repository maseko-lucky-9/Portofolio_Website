/**
 * ChatWidget — locks the launcher's accessible name (the e2e suite keys on
 * it), proves the avatar persists in the open state, and pins the stream
 * watchdog: a silent hung stream must abort at the idle timeout and clear
 * `busy` instead of leaving the bulb lit forever.
 */
import { render, screen, fireEvent, act } from "@testing-library/react";
import { describe, it, expect, afterEach, vi } from "vitest";
import { ChatWidget } from "@/components/ChatWidget";

const LAUNCHER_NAME = /Ask about Thulani's experience/i;

/** One SSE frame in the shape the Worker streams. */
function sseFrame(text: string): Uint8Array {
  return new TextEncoder().encode(`data: ${JSON.stringify({ response: text })}\n`);
}

/**
 * A reader whose chunks are released one at a time by the test, so a stream
 * can be held open across arbitrary amounts of fake time.
 *
 * Critically it honours the fetch AbortSignal — a pending read REJECTS when
 * the watchdog fires, exactly as a real body stream does. Without that wiring
 * an abort is invisible to the mock and every watchdog assertion passes
 * whether the production code arms the timer or not.
 */
function controlledStream() {
  type Result = { value?: Uint8Array; done: boolean };
  const queued: Result[] = [];
  let waiting: { resolve: (r: Result) => void; reject: (e: unknown) => void } | null = null;
  let aborted = false;

  const emit = (r: Result) => {
    if (waiting) {
      waiting.resolve(r);
      waiting = null;
    } else {
      queued.push(r);
    }
  };

  return {
    attach(signal: AbortSignal) {
      signal.addEventListener("abort", () => {
        aborted = true;
        const err = new DOMException("Aborted", "AbortError");
        if (waiting) {
          waiting.reject(err);
          waiting = null;
        }
      });
    },
    read: () =>
      new Promise<Result>((resolve, reject) => {
        if (aborted) return reject(new DOMException("Aborted", "AbortError"));
        const next = queued.shift();
        if (next) resolve(next);
        else waiting = { resolve, reject };
      }),
    push: (text: string) => emit({ value: sseFrame(text), done: false }),
    finish: () => emit({ done: true }),
    get isAborted() {
      return aborted;
    },
  };
}

/** Stubs fetch to return an ok response backed by `stream`, signal wired. */
function stubFetch(stream: ReturnType<typeof controlledStream>) {
  vi.stubGlobal("fetch", (_url: string, init?: RequestInit) => {
    if (init?.signal) stream.attach(init.signal);
    return Promise.resolve({
      ok: true,
      body: { getReader: () => ({ read: stream.read }) },
    } as unknown as Response);
  });
}

/** Sends the first canned suggestion — no typing required. */
async function ask() {
  fireEvent.click(screen.getByRole("button", { name: LAUNCHER_NAME }));
  await act(async () => {
    fireEvent.click(screen.getByRole("button", { name: /Kubernetes background/i }));
  });
}

const avatarEl = () =>
  screen
    .getByRole("button", { name: LAUNCHER_NAME })
    .querySelector("[data-avatar-state]") as HTMLElement;

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
    await ask();

    expect(avatarEl().getAttribute("data-glow")).toBe("true");
    expect(screen.getByText(/Thinking…/)).toBeInTheDocument();

    await act(async () => {
      await vi.advanceTimersByTimeAsync(26_000);
    });

    expect(screen.getByText(/Couldn't reach the assistant/i)).toBeInTheDocument();
    expect(avatarEl().getAttribute("data-glow")).toBe("false");
    expect(screen.queryByText(/Thinking…/)).toBeNull();
    // A failure must never read as success: the bounce is reserved for
    // replies that actually landed.
    expect(avatarEl().getAttribute("data-avatar-state")).not.toBe("celebrating");
  });

  it("does not abort a slow stream that keeps sending — the watchdog re-arms per chunk", async () => {
    vi.useFakeTimers();
    const stream = controlledStream();
    stubFetch(stream);

    render(<ChatWidget />);
    await ask();

    // Three gaps of 20s: each is under the 25s idle timeout on its own, but
    // they total 60s. Only a watchdog that re-arms on every chunk survives —
    // arm-once-before-fetch would have aborted during the first gap.
    for (const part of ["Kubernetes ", "platform ", "experience."]) {
      await act(async () => {
        await vi.advanceTimersByTimeAsync(20_000);
      });
      expect(screen.queryByText(/Couldn't reach the assistant/i)).toBeNull();
      await act(async () => {
        stream.push(part);
      });
    }

    await act(async () => {
      stream.finish();
    });

    expect(screen.getByText("Kubernetes platform experience.")).toBeInTheDocument();
    expect(screen.queryByText(/Couldn't reach the assistant/i)).toBeNull();
    expect(avatarEl().getAttribute("data-glow")).toBe("false");
  });

  it("aborts an in-flight stream on unmount", async () => {
    vi.useFakeTimers();
    const stream = controlledStream();
    stubFetch(stream);

    const { unmount } = render(<ChatWidget />);
    await ask();
    expect(stream.isAborted).toBe(false);

    // App.tsx has a catch-all route, so navigating away mid-reply unmounts
    // the widget; the reader loop and 25s timer must not outlive it.
    unmount();
    expect(stream.isAborted).toBe(true);
  });

  it("celebrates when a reply lands", async () => {
    vi.useFakeTimers();
    const stream = controlledStream();
    stubFetch(stream);

    render(<ChatWidget />);
    await ask();

    await act(async () => {
      stream.push("Yes — 8 years of it.");
      stream.finish();
    });

    expect(screen.getByText("Yes — 8 years of it.")).toBeInTheDocument();
    expect(avatarEl().getAttribute("data-avatar-state")).toBe("celebrating");
  });
});
