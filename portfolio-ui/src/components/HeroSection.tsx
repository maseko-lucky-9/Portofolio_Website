import { useRef } from "react";
import { animate, stagger } from "animejs";
import { EASE_FN } from "@/lib/motion";
import { useAnime } from "@/lib/use-anime";
import { scrollToSection } from "@/lib/scroll-to-section";
import { personalData } from "@/data/personal";

const BEAMS: Array<{ d: string; delay: string }> = [
  { d: "M -50 150 C 100 150, 100 300, 300 300", delay: "0s" },
  { d: "M 650 100 C 500 100, 500 300, 300 300", delay: "-1s" },
  { d: "M -50 480 C 120 480, 120 300, 300 300", delay: "-2s" },
  { d: "M 650 520 C 480 520, 480 300, 300 300", delay: "-1.5s" },
];

/** Floating mono label with the 1px gradient underline that points back at the core. */
function Readout({
  text,
  style,
  align = "left",
}: {
  text: string;
  style: React.CSSProperties;
  align?: "left" | "right";
}) {
  return (
    <div style={{ position: "absolute", ...style }}>
      <div className="mono on tiny">{text}</div>
      <div
        style={{
          height: 1,
          width: 48,
          marginTop: 4,
          marginLeft: align === "right" ? "auto" : undefined,
          background: `linear-gradient(to ${align === "right" ? "left" : "right"},oklch(var(--signal)),transparent)`,
        }}
      />
    </div>
  );
}

/**
 * The 600x600 instrument diagram: four beams converging on a pulsing core,
 * three sonar rings, two counter-rotating orbits. Entirely decorative — every
 * fact it carries is also stated in text nearby — so it is aria-hidden and the
 * readouts around it are the accessible version.
 */
function Instrument() {
  return (
    <svg
      viewBox="0 0 600 600"
      aria-hidden="true"
      style={{
        position: "absolute",
        inset: 0,
        width: "100%",
        height: "100%",
        overflow: "visible",
        pointerEvents: "none",
      }}
    >
      <defs>
        <radialGradient id="hero-core-glow">
          <stop offset="0%" stopColor="oklch(var(--signal))" stopOpacity=".26" />
          <stop offset="100%" stopColor="oklch(var(--signal))" stopOpacity="0" />
        </radialGradient>
      </defs>
      <circle cx="300" cy="300" r="150" fill="url(#hero-core-glow)" className="pulse" />
      {BEAMS.map(({ d, delay }) => (
        <g key={d}>
          <path d={d} fill="none" stroke="#fff" strokeOpacity=".16" strokeWidth="1" />
          <path
            d={d}
            fill="none"
            stroke="oklch(var(--signal))"
            strokeWidth="1.5"
            strokeLinecap="round"
            className="beam-line"
            style={{ animationDelay: delay }}
            opacity=".95"
          />
        </g>
      ))}
      {["0s", "1s", "2s"].map((delay) => (
        <circle
          key={delay}
          cx="300"
          cy="300"
          r="20"
          fill="none"
          stroke="oklch(var(--signal))"
          strokeWidth="1.5"
          opacity=".75"
          className="sonar"
          style={{ animationDelay: delay }}
        />
      ))}
      <circle
        cx="300"
        cy="300"
        r="118"
        fill="none"
        stroke="#fff"
        strokeOpacity=".22"
        strokeWidth="1"
        strokeDasharray="10 20"
        className="orbit-cw"
      />
      <circle
        cx="300"
        cy="300"
        r="78"
        fill="none"
        stroke="oklch(var(--signal))"
        strokeOpacity=".45"
        strokeWidth="1"
        strokeDasharray="4 6"
        className="orbit-ccw"
      />
      <circle
        cx="300"
        cy="300"
        r="7"
        fill="oklch(var(--signal))"
        className="pulse-fast"
        style={{ filter: "drop-shadow(0 0 8px oklch(var(--signal)))" }}
      />
    </svg>
  );
}

/**
 * The hero.
 *
 * The eyebrow paraphrases availability ("Open to permanent & contract") because
 * the full sourced string is load-bearing for the chatbot (src/chat.ts refuses
 * anything beyond it) and belongs somewhere it can be read in full — it is
 * stated verbatim on #contact.
 */
export function HeroSection() {
  const rootRef = useRef<HTMLElement>(null);

  useAnime(
    rootRef,
    (scope) => {
      if (scope.matches.reducedMotion) return;
      const el = rootRef.current;
      if (!el) return;
      animate(el.querySelectorAll("[data-anime-hero]"), {
        opacity: [0, 1],
        translateY: [16, 0],
        duration: 600,
        delay: stagger(90),
        ease: EASE_FN.emphasized,
      });
    },
    [],
  );

  const go = (href: string) => (e: React.MouseEvent) => {
    e.preventDefault();
    scrollToSection(href);
  };

  return (
    <section id="hero" className="hero" aria-labelledby="hero-heading" ref={rootRef}>
      <div className="wrap" style={{ width: "100%" }}>
        <div className="hero-2col">
          <div>
            <p className="eyebrow mono mb-7" data-anime-hero="badge">
              <span className="dot">
                <i className="halo" />
                <i />
              </span>
              Open to permanent &amp; contract
            </p>

            <h1 id="hero-heading" className="display mb-6" data-anime-hero="name">
              Kubernetes platforms
              <br />
              <span className="lit">for South African</span>
              <br />
              <span className="fade">banking.</span>
            </h1>

            <p className="lede mb-9" data-anime-hero="tagline">
              {personalData.tagline}
            </p>

            <div className="cta-row mb-9 gap-6" data-anime-hero="ctas">
              <a className="shiny-cta" href="#work" onClick={go("#work")}>
                <span>View the work</span>
              </a>
              <a className="btn btn-ghost" href="#contact" onClick={go("#contact")}>
                <span>Get in touch</span>
                {/* The reference's own arrow, path for path: a 16px stroked
                    glyph, not the "\u2192" character. A text arrow inherits the
                    label's weight and sits on its baseline, which is why the
                    pill read a little heavier than the replica's. */}
                <svg
                  className="arw"
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <path d="M5 12h14" />
                  <path d="m12 5 7 7-7 7" />
                </svg>
              </a>
            </div>

            <div className="metrics" data-anime-hero="metrics">
              <div className="metric">
                <b>{personalData.metrics.projects}</b>
                <span className="mono tiny">Projects</span>
              </div>
              <div className="metric">
                <b>{personalData.metrics.experience}</b>
                <span className="mono tiny">Experience</span>
              </div>
              <div className="metric">
                <b>{personalData.metrics.certifications}</b>
                <span className="mono tiny">Certifications</span>
              </div>
            </div>
          </div>

          <div className="instrument" data-anime-hero="right">
            <Instrument />
            <Readout text="8+ years" style={{ top: "14%", left: "6%" }} />
            <Readout text="Azure certified" style={{ bottom: "16%", right: "4%" }} align="right" />
            <Readout text="Gauteng · GMT+2" style={{ top: "48%", left: 0 }} />
          </div>
        </div>
      </div>
    </section>
  );
}
