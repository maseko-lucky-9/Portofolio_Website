/**
 * ChatAvatar — code-drawn SVG robot for the chat launcher.
 *
 * Entirely procedural (no image assets, no 3D runtime): glossy shell, dark
 * visor, glowing eyes and antenna bulb are gradients + shapes in a single
 * inline SVG. The eyes track the cursor page-wide; the bulb lights while a
 * reply streams; blink / hover / bounce / sleep give it life.
 *
 * State precedence: responding > celebrating > sleeping > awake, exposed as
 * `data-avatar-state` (+ `data-glow`) for tests — attribute changes work even
 * with every animation disabled.
 *
 * Reduced-motion: eyes stay centered, no blink/glance/tilt/bounce/sleep. The
 * bulb still flips between dim and lit with `responding` — a state change,
 * not motion, so the signal survives.
 *
 * Purely decorative (`aria-hidden`): the launcher button's aria-label is the
 * accessible name; screen readers get the existing "Thinking…" + role="log"
 * announcements instead of the bulb.
 */
import { useEffect, useRef, useState } from "react";
import { animate } from "animejs";
import { X } from "lucide-react";
import { useInputModality, useReducedMotion } from "@/lib/motion";
import { useAnime } from "@/lib/use-anime";

export interface ChatAvatarProps {
  /** Chat panel open — shows the close badge and blocks sleep. */
  open: boolean;
  /** True while a reply is streaming — lights the antenna bulb. */
  responding: boolean;
  /** Bumped by the parent on each successful reply — triggers the bounce. */
  celebrateKey: number;
}

export type AvatarMode = "responding" | "celebrating" | "sleeping" | "awake";

export const SLEEP_AFTER_MS = 30_000;
export const CELEBRATE_MS = 700;
/** Max pupil offset in viewBox units. */
const MAX_GAZE = 2.6;
const BLINK_MIN_MS = 3_000;
const BLINK_JITTER_MS = 4_000;

export function ChatAvatar({ open, responding, celebrateKey }: ChatAvatarProps) {
  const wrapperRef = useRef<HTMLSpanElement>(null);
  // Separate node for the bounce: anime.js caches an element's parsed
  // transform components on first animate() and rebuilds the whole transform
  // string from that cache every frame, so it would overwrite React's
  // hover-rotate on the wrapper — and leave the last cached rotate behind on
  // revert, sticking the launcher at 4deg. One writer per node, same reason
  // gaze / hover / blink each sit on their own element below.
  const bounceRef = useRef<HTMLSpanElement>(null);
  const gazeRef = useRef<SVGGElement>(null);
  const blinkRef = useRef<SVGGElement>(null);
  const bulbHaloRef = useRef<SVGCircleElement>(null);

  const reduced = useReducedMotion();
  const modality = useInputModality();
  const [hovered, setHovered] = useState(false);
  const [sleeping, setSleeping] = useState(false);
  const [celebrating, setCelebrating] = useState(false);

  const mode: AvatarMode = responding
    ? "responding"
    : celebrating
      ? "celebrating"
      : sleeping
        ? "sleeping"
        : "awake";

  // Celebrate for a moment whenever a reply lands (key 0 = initial mount, not
  // a reply — skip it).
  useEffect(() => {
    if (celebrateKey === 0) return;
    setCelebrating(true);
    const id = setTimeout(() => setCelebrating(false), CELEBRATE_MS);
    return () => clearTimeout(id);
  }, [celebrateKey]);

  // Doze off after inactivity. Never while the panel is open or a reply is
  // streaming; any window activity wakes and re-arms the timer.
  useEffect(() => {
    if (open || responding || reduced) {
      setSleeping(false);
      return;
    }
    let timer: ReturnType<typeof setTimeout>;
    const rearm = () => {
      setSleeping(false);
      clearTimeout(timer);
      timer = setTimeout(() => setSleeping(true), SLEEP_AFTER_MS);
    };
    rearm();
    // No "scroll": Lenis keeps window.scrollY in sync every rAF frame, so it
    // fires at ~60Hz for a whole gesture and would re-arm the timer each
    // frame. The pointer/key/touch events already mean real engagement.
    const evs = ["pointermove", "pointerdown", "keydown", "touchstart"] as const;
    for (const e of evs) window.addEventListener(e, rearm, { passive: true });
    return () => {
      clearTimeout(timer);
      for (const e of evs) window.removeEventListener(e, rearm);
    };
  }, [open, responding, reduced]);

  // Gaze: pointer devices get page-wide cursor tracking (lerp loop that stops
  // itself once settled — same shape as CustomCursor's); touch/keyboard get
  // occasional random glances instead, and none while the panel is open.
  useEffect(() => {
    const eyes = gazeRef.current;
    if (!eyes) return;
    if (reduced || sleeping) {
      eyes.style.transform = "";
      return;
    }
    let rafId = 0;
    let glanceTimer: ReturnType<typeof setTimeout> | null = null;
    let recenterTimer: ReturnType<typeof setTimeout> | null = null;
    let tx = 0;
    let ty = 0;
    let cx = 0;
    let cy = 0;
    let running = false;
    let rect: DOMRect | null = null;

    const tick = () => {
      cx += (tx - cx) * 0.18;
      cy += (ty - cy) * 0.18;
      eyes.style.transform = `translate(${cx}px, ${cy}px)`;
      if (Math.abs(tx - cx) < 0.01 && Math.abs(ty - cy) < 0.01) {
        running = false;
        return;
      }
      rafId = requestAnimationFrame(tick);
    };
    const start = () => {
      if (running || document.hidden) return;
      running = true;
      rafId = requestAnimationFrame(tick);
    };
    const retarget = (nx: number, ny: number) => {
      tx = nx;
      ty = ny;
      start();
    };

    const onMove = (e: PointerEvent) => {
      // The launcher is position:fixed, so its rect only changes on resize —
      // cache it instead of forcing layout on every pointermove.
      if (!rect) rect = wrapperRef.current?.getBoundingClientRect() ?? null;
      if (!rect) return;
      let dx = (e.clientX - (rect.left + rect.width / 2)) / (window.innerWidth / 2);
      let dy = (e.clientY - (rect.top + rect.height / 2)) / (window.innerHeight / 2);
      const len = Math.hypot(dx, dy) || 1;
      const mag = Math.min(1, len) * MAX_GAZE;
      dx = (dx / len) * mag;
      dy = (dy / len) * mag;
      retarget(dx, dy);
    };
    const onResize = () => {
      rect = null;
    };
    const onVis = () => {
      if (document.hidden) {
        running = false;
        cancelAnimationFrame(rafId);
      }
    };

    if (modality === "pointer") {
      window.addEventListener("pointermove", onMove, { passive: true });
      window.addEventListener("resize", onResize);
    } else if (!open) {
      const schedule = () => {
        glanceTimer = setTimeout(
          () => {
            retarget((Math.random() * 2 - 1) * MAX_GAZE, (Math.random() * 2 - 1) * MAX_GAZE * 0.6);
            recenterTimer = setTimeout(() => retarget(0, 0), 1000);
            schedule();
          },
          4000 + Math.random() * 5000,
        );
      };
      schedule();
    }
    document.addEventListener("visibilitychange", onVis);
    return () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("resize", onResize);
      document.removeEventListener("visibilitychange", onVis);
      if (glanceTimer) clearTimeout(glanceTimer);
      if (recenterTimer) clearTimeout(recenterTimer);
      cancelAnimationFrame(rafId);
      eyes.style.transform = "";
    };
  }, [reduced, sleeping, modality, open]);

  // Blink: random squash on the eyes group. Skipped while sleeping (lids are
  // already down) and under reduced motion (scope guard).
  useAnime(
    wrapperRef,
    (scope) => {
      if (scope.matches.reducedMotion || sleeping) return;
      const el = blinkRef.current;
      if (!el) return;
      let t: ReturnType<typeof setTimeout>;
      const schedule = () => {
        t = setTimeout(
          () => {
            animate(el, { scaleY: [1, 0.08, 1], duration: 150, ease: "inOut(2)" });
            schedule();
          },
          BLINK_MIN_MS + Math.random() * BLINK_JITTER_MS,
        );
      };
      schedule();
      return () => clearTimeout(t);
    },
    [sleeping],
  );

  // Happy bounce on reply.
  useAnime(
    wrapperRef,
    (scope) => {
      if (scope.matches.reducedMotion || !celebrating) return;
      const el = bounceRef.current;
      if (!el) return;
      animate(el, { translateY: [0, -7, 0, -3, 0], duration: 600, ease: "out(2)" });
    },
    [celebrating],
  );

  // Bulb pulse while responding. The lit/dim base state is React-driven below,
  // so under reduced motion the bulb still flips on — this only adds the pulse.
  useAnime(
    wrapperRef,
    (scope) => {
      if (scope.matches.reducedMotion || !responding) return;
      const halo = bulbHaloRef.current;
      if (!halo) return;
      animate(halo, {
        opacity: [0.9, 0.4],
        duration: 650,
        loop: true,
        alternate: true,
        ease: "inOut(2)",
      });
      // Clear the inline opacity here rather than relying on scope.revert()'s
      // internal bookkeeping to do it for us. (It would: anime treats opacity
      // as a CSS property, so revert removes the same inline style at the same
      // synchronous point. Being explicit keeps the pulse's cleanup readable
      // where the pulse is written, and survives a change of animated property.)
      return () => {
        halo.style.opacity = "";
      };
    },
    [responding],
  );

  const interactive = !reduced;

  return (
    <span
      ref={wrapperRef}
      aria-hidden="true"
      data-avatar-state={mode}
      data-glow={responding ? "true" : "false"}
      onPointerEnter={() => setHovered(true)}
      onPointerLeave={() => setHovered(false)}
      className="relative block w-full h-full"
      style={{
        transform: interactive && hovered ? "rotate(4deg)" : undefined,
        transition: "transform var(--duration-fast) var(--ease-spring)",
        willChange: "transform",
      }}
    >
      {/* anime.js owns this node's transform exclusively (the bounce); React
          owns the wrapper's (the hover tilt). The close badge sits outside so
          it stays put while the robot hops. */}
      <span ref={bounceRef} className="block w-full h-full">
        <svg
          viewBox="0 0 100 100"
          className="block w-full h-full"
          focusable="false"
          aria-hidden="true"
        >
          <defs>
            <radialGradient id="bot-bg" cx="50%" cy="42%" r="65%">
              <stop offset="0%" stopColor="#131d38" />
              <stop offset="100%" stopColor="#0a1122" />
            </radialGradient>
            <linearGradient id="bot-shell" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#f5f9ff" />
              <stop offset="55%" stopColor="#dbe6fa" />
              <stop offset="100%" stopColor="#aebfe4" />
            </linearGradient>
            <linearGradient id="bot-shell-lower" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#e4edfc" />
              <stop offset="100%" stopColor="#9fb2da" />
            </linearGradient>
            <radialGradient id="bot-visor" cx="50%" cy="38%" r="75%">
              <stop offset="0%" stopColor="#182444" />
              <stop offset="100%" stopColor="#0b1226" />
            </radialGradient>
            <radialGradient id="bot-eye-halo">
              <stop offset="0%" stopColor="oklch(var(--primary-glow))" stopOpacity="0.75" />
              <stop offset="100%" stopColor="oklch(var(--primary-glow))" stopOpacity="0" />
            </radialGradient>
            <radialGradient id="bot-bulb-halo">
              <stop offset="0%" stopColor="oklch(var(--primary-glow))" stopOpacity="0.9" />
              <stop offset="100%" stopColor="oklch(var(--primary-glow))" stopOpacity="0" />
            </radialGradient>
            <clipPath id="bot-circle">
              <circle cx="50" cy="50" r="50" />
            </clipPath>
            <clipPath id="bot-visor-clip">
              <rect x="27.5" y="27" width="45" height="33" rx="15" />
            </clipPath>
          </defs>

          <g clipPath="url(#bot-circle)">
            {/* Backdrop — dark navy like the reference render, with a floor glow. */}
            <circle cx="50" cy="50" r="50" fill="url(#bot-bg)" />
            <ellipse
              cx="50"
              cy="96"
              rx="34"
              ry="12"
              fill="oklch(var(--primary-glow))"
              opacity="0.16"
            />

            {/* Antenna */}
            <rect x="48.9" y="12.5" width="2.2" height="10" rx="1.1" fill="#8fa3cf" />
            <circle
              ref={bulbHaloRef}
              cx="50"
              cy="10.2"
              r="8"
              fill="url(#bot-bulb-halo)"
              opacity={responding ? 0.85 : 0}
            />
            <circle
              cx="50"
              cy="10.2"
              r="3.3"
              fill="oklch(var(--primary-glow))"
              opacity={responding ? 1 : 0.35}
              style={{ transition: "opacity 200ms ease-out" }}
            />

            {/* Ear pods */}
            <rect x="15.5" y="36" width="6.5" height="15" rx="3.2" fill="#93a7cc" />
            <rect x="78" y="36" width="6.5" height="15" rx="3.2" fill="#93a7cc" />

            {/* Head shell + specular highlight */}
            <rect x="21" y="20.5" width="58" height="46.5" rx="23" fill="url(#bot-shell)" />
            <ellipse cx="36" cy="27.5" rx="11" ry="4.4" fill="#ffffff" opacity="0.55" />

            {/* Visor */}
            <rect
              x="27.5"
              y="27"
              width="45"
              height="33"
              rx="15"
              fill="url(#bot-visor)"
              stroke="oklch(var(--primary) / 0.35)"
              strokeWidth="0.8"
            />

            {/* Eyes + smile — gaze group (JS lerp) > hover-scale (React) > blink (anime) */}
            <g ref={gazeRef}>
              <g
                style={{
                  transform: interactive && hovered ? "scale(1.12)" : undefined,
                  transformBox: "fill-box",
                  transformOrigin: "center",
                  transition: "transform 150ms ease-out",
                }}
              >
                <g ref={blinkRef} style={{ transformBox: "fill-box", transformOrigin: "center" }}>
                  <ellipse cx="41.5" cy="41" rx="6.5" ry="7.5" fill="url(#bot-eye-halo)" />
                  <ellipse cx="58.5" cy="41" rx="6.5" ry="7.5" fill="url(#bot-eye-halo)" />
                  <ellipse cx="41.5" cy="41" rx="3.3" ry="4.5" fill="oklch(var(--primary-glow))" />
                  <ellipse cx="58.5" cy="41" rx="3.3" ry="4.5" fill="oklch(var(--primary-glow))" />
                </g>
              </g>
            </g>
            <path
              d="M43.5 51 Q50 55.5 56.5 51"
              stroke="oklch(var(--primary-glow))"
              strokeWidth="1.8"
              strokeLinecap="round"
              fill="none"
              opacity="0.9"
            />

            {/* Sleep lid — slides down over the visor; closed-eye arcs ride on it. */}
            <g clipPath="url(#bot-visor-clip)">
              <g
                style={{
                  transform: sleeping ? "translateY(0px)" : "translateY(-34px)",
                  transition: "transform 400ms var(--ease-spring)",
                }}
              >
                <rect x="27.5" y="27" width="45" height="33" fill="#101b36" />
                <path
                  d="M38 42 Q41.5 45 45 42"
                  stroke="oklch(var(--primary) / 0.55)"
                  strokeWidth="1.4"
                  strokeLinecap="round"
                  fill="none"
                />
                <path
                  d="M55 42 Q58.5 45 62 42"
                  stroke="oklch(var(--primary) / 0.55)"
                  strokeWidth="1.4"
                  strokeLinecap="round"
                  fill="none"
                />
              </g>
            </g>

            {/* Torso hint + glowing chat-bubble emblem (clipped by the circle) */}
            <rect x="29" y="71" width="42" height="30" rx="15" fill="url(#bot-shell-lower)" />
            <rect
              x="41"
              y="76"
              width="18"
              height="13"
              rx="4.5"
              fill="#0e1730"
              stroke="oklch(var(--primary-glow))"
              strokeWidth="1"
              opacity="0.95"
            />
            <circle cx="46.5" cy="82.5" r="1.3" fill="oklch(var(--primary-glow))" />
            <circle cx="50" cy="82.5" r="1.3" fill="oklch(var(--primary-glow))" />
            <circle cx="53.5" cy="82.5" r="1.3" fill="oklch(var(--primary-glow))" />
          </g>
        </svg>
      </span>

      {open && (
        <span
          data-testid="avatar-close-badge"
          className="absolute -top-0.5 -right-0.5 w-5 h-5 rounded-full bg-background text-foreground border flex items-center justify-center"
          style={{ borderColor: "oklch(var(--border))" }}
        >
          <X size={11} />
        </span>
      )}
    </span>
  );
}
