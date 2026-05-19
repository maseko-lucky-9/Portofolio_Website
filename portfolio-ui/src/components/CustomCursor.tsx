/**
 * CustomCursor — outer ring + inner dot that track the pointer.
 *
 * Plan 5 of the v2 ladder. The cursor is the most polarising single
 * decision in the v2 redesign — designed conservatively:
 *
 *   • Hidden entirely under any of: reduced-motion, touch / coarse
 *     pointer, keyboard nav active (any Tab in last 5s), or `?nomo=1`.
 *   • Does NOT hide the system cursor (no `cursor: none` on body) —
 *     the system pointer stays visible for assistive tech users.
 *   • Outer ring grows over `[data-cursor="hover"]` elements; inner
 *     dot stays small. Subtle.
 *   • Hardware-accelerated via translate3d + will-change: transform.
 */
import { useEffect, useRef, useState } from "react";
import { useInputModality, useReducedMotion } from "@/lib/motion";

const HOVER_SELECTOR = '[data-cursor="hover"], a, button';

export function CustomCursor() {
  const ringRef = useRef<HTMLDivElement>(null);
  const dotRef = useRef<HTMLDivElement>(null);
  const prefersReducedMotion = useReducedMotion();
  const modality = useInputModality();
  const [hover, setHover] = useState(false);
  const [active, setActive] = useState(false);
  const [shouldRender, setShouldRender] = useState(false);

  // Detect coarse pointer + `?nomo=1` once, on mount. These don't change
  // mid-session, so polling them via useSyncExternalStore would be wasteful.
  useEffect(() => {
    if (typeof window === "undefined") return;
    const coarse = window.matchMedia("(pointer: coarse)").matches;
    const nomo = new URLSearchParams(window.location.search).get("nomo") === "1";
    if (coarse || nomo) return; // Stay un-rendered for the session.
    setShouldRender(true);
  }, []);

  // Pointer-tracking loop with idle / tab-hidden pause.
  // The RAF runs only while the pointer is moving or settling. After 2 s of
  // inactivity it pauses and the cursor fades to opacity 0; the next
  // `pointermove` resumes it. This recovers ~1 ms / frame of main-thread
  // budget on idle desktop sessions.
  useEffect(() => {
    if (!shouldRender || prefersReducedMotion || modality !== "pointer") return;
    let rafId = 0;
    let idleTimer: ReturnType<typeof setTimeout> | null = null;
    let tx = 0;
    let ty = 0;
    let cx = 0;
    let cy = 0;
    let running = false;

    const tick = () => {
      cx += (tx - cx) * 0.25;
      cy += (ty - cy) * 0.25;
      if (ringRef.current) {
        ringRef.current.style.transform = `translate3d(${cx}px, ${cy}px, 0) translate(-50%, -50%)`;
      }
      if (dotRef.current) {
        dotRef.current.style.transform = `translate3d(${tx}px, ${ty}px, 0) translate(-50%, -50%)`;
      }
      rafId = requestAnimationFrame(tick);
    };
    const start = () => {
      if (running || document.hidden) return;
      running = true;
      rafId = requestAnimationFrame(tick);
    };
    const stop = () => {
      running = false;
      if (rafId) cancelAnimationFrame(rafId);
      rafId = 0;
    };
    const scheduleIdle = () => {
      if (idleTimer) clearTimeout(idleTimer);
      idleTimer = setTimeout(() => {
        stop();
        setActive(false);
      }, 2000);
    };

    const onMove = (e: PointerEvent) => {
      tx = e.clientX;
      ty = e.clientY;
      setActive(true);
      start();
      scheduleIdle();
    };
    const onLeave = () => {
      setActive(false);
      stop();
      if (idleTimer) clearTimeout(idleTimer);
    };
    const onOver = (e: PointerEvent) => {
      const target = e.target as Element | null;
      setHover(!!target?.closest?.(HOVER_SELECTOR));
    };
    const onVisibility = () => {
      if (document.hidden) stop();
    };

    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerover", onOver);
    document.addEventListener("pointerleave", onLeave);
    document.addEventListener("visibilitychange", onVisibility);

    return () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerover", onOver);
      document.removeEventListener("pointerleave", onLeave);
      document.removeEventListener("visibilitychange", onVisibility);
      if (idleTimer) clearTimeout(idleTimer);
      stop();
    };
  }, [shouldRender, prefersReducedMotion, modality]);

  if (!shouldRender || prefersReducedMotion || modality !== "pointer") {
    return null;
  }

  return (
    <>
      {/* Outer ring — grows on hoverable elements */}
      <div
        ref={ringRef}
        aria-hidden="true"
        className="fixed top-0 left-0 z-[100] pointer-events-none rounded-full border transition-[width,height,border-color,opacity] duration-200 ease-out"
        style={{
          width: hover ? "44px" : "28px",
          height: hover ? "44px" : "28px",
          borderColor: hover
            ? "oklch(var(--primary) / 0.7)"
            : "oklch(var(--foreground) / 0.35)",
          opacity: active ? 1 : 0,
          mixBlendMode: "difference",
          willChange: "transform",
        }}
      />
      {/* Inner dot — tracks pointer tightly */}
      <div
        ref={dotRef}
        aria-hidden="true"
        className="fixed top-0 left-0 z-[100] pointer-events-none rounded-full"
        style={{
          width: "4px",
          height: "4px",
          background: "oklch(var(--primary))",
          opacity: active && !hover ? 1 : 0,
          transition: "opacity 200ms ease-out",
          willChange: "transform",
        }}
      />
    </>
  );
}
