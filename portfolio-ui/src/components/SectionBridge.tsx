/**
 * SectionBridge — connective tissue between two adjacent sections.
 *
 * The signature "animejs.com-like" moment of the portfolio:
 *   - Horizontal mint hairlines draw from the centre outward as the
 *     boundary enters the viewport.
 *   - A `</>` SVG bracket pair stroke-draws on, tying the two sections
 *     together with a software-dev semantic mark.
 *   - A single anime.js timeline orchestrates the sequence (hairlines
 *     first, then brackets, then caption fade).
 *
 * Timeline trigger: a plain IntersectionObserver plays the timeline
 * once when the bridge first enters the viewport. We previously tried
 * anime.js's `onScroll({ sync: 'linear' })` for true scroll scrubbing
 * but it does not fire reliably when the target is already in view at
 * observer registration time (a common case here — bridges render
 * eagerly while the user may already be near them). Same lesson as
 * Phase B's `revealOnScroll` helper.
 *
 * Reduced-motion: renders the static end-state SVG (hairline at 100%
 * scaleX, brackets fully drawn). No observer, no animation.
 *
 * Rendered OUTSIDE the surrounding LazySection wrappers in
 * `pages/Index.tsx` so the scroll observer registers on first paint.
 */
import { useRef } from "react";
import { createDrawable, createTimeline } from "animejs";
import { useReducedMotion } from "@/lib/motion";
import { useAnime } from "@/lib/use-anime";

export interface SectionBridgeProps {
  /** Optional caption shown centre-bridge; e.g. "Skills · Projects". */
  caption?: string;
  /** Optional id for differentiating multiple bridges in a page. */
  id?: string;
}

export function SectionBridge({ caption, id }: SectionBridgeProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const reduced = useReducedMotion();

  useAnime(
    rootRef,
    (scope) => {
      if (scope.matches.reducedMotion) return;
      const root = rootRef.current;
      if (!root) return;

      const hairlineL = root.querySelector<SVGPathElement>(
        '[data-bridge="hairline-left"]',
      );
      const hairlineR = root.querySelector<SVGPathElement>(
        '[data-bridge="hairline-right"]',
      );
      const bracketL = root.querySelector<SVGPathElement>(
        '[data-bridge="bracket-left"]',
      );
      const bracketR = root.querySelector<SVGPathElement>(
        '[data-bridge="bracket-right"]',
      );
      const slash = root.querySelector<SVGPathElement>('[data-bridge="slash"]');
      const captionEl = root.querySelector<HTMLElement>(
        '[data-bridge="caption"]',
      );

      if (!hairlineL || !hairlineR || !bracketL || !bracketR) return;

      // Wrap bracket + slash paths with createDrawable so anime can
      // animate stroke-dasharray via the `draw` shorthand.
      const drawables = [
        createDrawable(bracketL),
        createDrawable(bracketR),
        ...(slash ? [createDrawable(slash)] : []),
      ];

      const tl = createTimeline({ autoplay: false });

      // Phase 1 (0 – 400ms): hairlines grow outward from centre.
      tl.add(hairlineL, { scaleX: [0, 1], duration: 400, ease: "outQuart" }, 0);
      tl.add(hairlineR, { scaleX: [0, 1], duration: 400, ease: "outQuart" }, 0);

      // Phase 2 (400 – 800ms): brackets stroke-draw on.
      drawables.forEach((d, i) => {
        tl.add(
          d,
          {
            draw: ["0 0", "0 1"],
            duration: 400,
            ease: "inOutQuad",
          },
          400 + i * 40,
        );
      });

      // Phase 3 (800 – 1000ms): caption fades in.
      if (captionEl) {
        tl.add(
          captionEl,
          {
            opacity: [0, 1],
            translateY: [4, 0],
            duration: 200,
            ease: "outQuart",
          },
          800,
        );
      }

      // Trigger the timeline when the bridge first enters viewport.
      // IntersectionObserver fires on initial observe with current
      // intersection state — works whether the bridge is below the
      // fold at page load or already in view.
      if (typeof IntersectionObserver === "undefined") {
        tl.play();
        return;
      }
      const io = new IntersectionObserver(
        (entries) => {
          for (const entry of entries) {
            if (entry.isIntersecting) {
              tl.play();
              io.disconnect();
              break;
            }
          }
        },
        { rootMargin: "0px 0px -20px 0px", threshold: 0 },
      );
      io.observe(root);
      return () => io.disconnect();
    },
    [],
  );

  // Reduced-motion end-state styles. Applied via inline style so the
  // SVG transforms render statically with no scroll observer attached.
  const hairlineStartStyle = reduced
    ? { transform: "scaleX(1)" }
    : { transform: "scaleX(0)" };
  const bracketStartStyle = reduced
    ? { strokeDasharray: "none", strokeDashoffset: "0" }
    : undefined;
  const captionStartStyle = reduced ? { opacity: 1 } : { opacity: 0 };

  return (
    <div
      ref={rootRef}
      aria-hidden="true"
      data-section-bridge={id}
      className="relative w-full h-24 md:h-32 overflow-visible select-none"
    >
      {/* SVG bridge graphic — viewBox lets it stretch fluidly. */}
      <svg
        viewBox="0 0 1200 100"
        preserveAspectRatio="xMidYMid meet"
        className="absolute inset-0 w-full h-full"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Left hairline — grows from centre (x=600) leftward. */}
        <path
          data-bridge="hairline-left"
          d="M 600 50 L 0 50"
          stroke="oklch(var(--primary))"
          strokeWidth="1"
          strokeLinecap="round"
          style={{
            ...hairlineStartStyle,
            transformOrigin: "600px 50px",
          }}
        />

        {/* Right hairline — grows from centre (x=600) rightward. */}
        <path
          data-bridge="hairline-right"
          d="M 600 50 L 1200 50"
          stroke="oklch(var(--primary))"
          strokeWidth="1"
          strokeLinecap="round"
          style={{
            ...hairlineStartStyle,
            transformOrigin: "600px 50px",
          }}
        />

        {/* `</>` bracket group — centred. */}
        {/* Left bracket `<` */}
        <path
          data-bridge="bracket-left"
          d="M 555 30 L 535 50 L 555 70"
          fill="none"
          stroke="oklch(var(--primary))"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          style={bracketStartStyle}
        />

        {/* Slash `/` */}
        <path
          data-bridge="slash"
          d="M 588 32 L 612 68"
          fill="none"
          stroke="oklch(var(--primary) / 0.55)"
          strokeWidth="2"
          strokeLinecap="round"
          style={bracketStartStyle}
        />

        {/* Right bracket `>` */}
        <path
          data-bridge="bracket-right"
          d="M 645 30 L 665 50 L 645 70"
          fill="none"
          stroke="oklch(var(--primary))"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          style={bracketStartStyle}
        />
      </svg>

      {/* Optional caption below the bracket */}
      {caption && (
        <div
          data-bridge="caption"
          className="absolute inset-x-0 bottom-2 md:bottom-3 text-center pointer-events-none"
          style={captionStartStyle}
        >
          <span className="text-[10px] font-mono uppercase tracking-[0.25em] text-muted-foreground/70">
            {caption}
          </span>
        </div>
      )}
    </div>
  );
}
