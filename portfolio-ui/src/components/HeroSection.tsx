import { useEffect, useRef, useState } from "react";
import { animate, createTimeline } from "animejs";
import { ArrowDown, Github, Linkedin, Twitter } from "lucide-react";
import { personalData } from "@/data/personal";
import { PaperBackground } from "@/components/PaperBackground";
import { DURATION, EASE_FN, useMagnetic, useReducedMotion } from "@/lib/motion";
import { useAnime } from "@/lib/use-anime";

// Build-time commit count — reflects real shipping cadence, no runtime cost.
const SHIPPED_TOTAL = Number.parseInt(__SHIPPED_COUNT__, 10) || 0;

/**
 * `shipped: <n>` meter — quiet signal of real, shipping work.
 * 600ms count-up on first paint; static under prefers-reduced-motion.
 */
function ShippedMeter({ reduced }: { reduced: boolean }) {
  const [n, setN] = useState(reduced ? SHIPPED_TOTAL : 0);

  useEffect(() => {
    if (reduced || SHIPPED_TOTAL === 0) {
      setN(SHIPPED_TOTAL);
      return;
    }
    const start = performance.now();
    const dur = 600;
    let rafId = 0;
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / dur);
      // ease-out cubic
      const eased = 1 - Math.pow(1 - t, 3);
      setN(Math.round(SHIPPED_TOTAL * eased));
      if (t < 1) rafId = requestAnimationFrame(tick);
    };
    rafId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafId);
  }, [reduced]);

  return (
    <div
      aria-label={`shipped: ${SHIPPED_TOTAL} commits`}
      className="pointer-events-none absolute top-6 right-6 z-20 hidden font-sans text-[11px] uppercase tracking-[0.18em] font-semibold sm:block"
      style={{ color: "oklch(var(--secondary))", opacity: 0.85 }}
    >
      <span className="opacity-60">shipped:</span>{" "}
      <span tabIndex={-1}>{n}</span>
    </div>
  );
}

export function HeroSection() {
  const prefersReducedMotion = useReducedMotion();
  const heroRef = useRef<HTMLElement>(null);
  const pillRef = useRef<HTMLDivElement>(null);
  const scrollIndicatorRef = useRef<HTMLButtonElement>(null);
  // Initial: true so the timeline starts immediately on mount (matches the
  // previous framer-motion `useInView({ initial: true })`).
  const [heroInView, setHeroInView] = useState(true);
  const [pastFold, setPastFold] = useState(false);
  // Subtle magnetic-cursor effect on the two primary CTAs (Plan 3).
  // 5 px is the senior-eng-taste sweet spot — felt, not seen.
  const primaryCtaRef = useMagnetic<HTMLButtonElement>(5);
  const secondaryCtaRef = useMagnetic<HTMLButtonElement>(5);

  const scrollToProjects = () => {
    document.querySelector("#projects")?.scrollIntoView({ behavior: "smooth" });
  };

  const scrollToContact = () => {
    document.querySelector("#contact")?.scrollIntoView({ behavior: "smooth" });
  };

  // Hide the scroll indicator once the user has scrolled past ~200 px.
  // Passive listener; cleaned up on unmount. Single read per scroll event.
  useEffect(() => {
    const onScroll = () => setPastFold(window.scrollY > 200);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // IntersectionObserver to drive heroInView (replaces framer-motion's
  // useInView). Triggers hero-paused className + ShippedMeter behaviour.
  useEffect(() => {
    const el = heroRef.current;
    if (!el || typeof IntersectionObserver === "undefined") return;
    const io = new IntersectionObserver(
      ([entry]) => setHeroInView(entry.isIntersecting),
      { rootMargin: "0px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  // Entrance choreography — single timeline with offsets matching the
  // previous framer staggered `delay:` values. The timeline starts on
  // mount; under reduced-motion the factory bails out and CSS shows the
  // static end-state.
  useAnime(
    heroRef,
    (scope) => {
      if (scope.matches.reducedMotion) return;
      const root = heroRef.current;
      if (!root) return;

      const q = (sel: string) => root.querySelector<HTMLElement>(sel);

      const tl = createTimeline({
        defaults: { ease: EASE_FN.emphasized, duration: 700 },
      });

      // Left column lead-in (whole column slides from -40 → 0).
      const left = q('[data-anime-hero="left"]');
      if (left) {
        tl.add(left, { opacity: [0, 1], translateX: [-40, 0] }, 0);
      }

      // Per-element fade-up cascade. Offsets in ms mirror the previous
      // framer delays (0.15, 0.25, 0.35, 0.45, 0.55, 0.65 s).
      const cascade: Array<[string, number]> = [
        ['[data-anime-hero="badge"]', 150],
        ['[data-anime-hero="name"]', 250],
        ['[data-anime-hero="title"]', 350],
        ['[data-anime-hero="tagline"]', 450],
        ['[data-anime-hero="ctas"]', 550],
        ['[data-anime-hero="social"]', 650],
      ];
      for (const [selector, atMs] of cascade) {
        const el = q(selector);
        if (!el) continue;
        tl.add(
          el,
          { opacity: [0, 1], translateY: [16, 0], duration: DURATION.base * 1000 },
          atMs,
        );
      }

      // Right column: column slide + profile scale + metrics fade.
      const right = q('[data-anime-hero="right"]');
      if (right) {
        tl.add(right, { opacity: [0, 1], translateX: [40, 0] }, 200);
      }
      const profile = q('[data-anime-hero="profile"]');
      if (profile) {
        tl.add(
          profile,
          { opacity: [0, 1], scale: [0.85, 1], duration: 600 },
          400,
        );
      }
      const metrics = q('[data-anime-hero="metrics"]');
      if (metrics) {
        tl.add(
          metrics,
          { opacity: [0, 1], translateY: [16, 0], duration: DURATION.base * 1000 },
          700,
        );
      }
    },
    [],
  );

  // "Open to work" pill — y-bobble loop. Auto-pauses when section
  // leaves viewport via the [data-anime-loop] toggle in useEffect below.
  useAnime(
    pillRef,
    (scope) => {
      if (scope.matches.reducedMotion) return;
      const el = pillRef.current;
      if (!el) return;
      animate(el, {
        translateY: [0, -6, 0],
        duration: 4000,
        loop: true,
        ease: "inOutSine",
      });
    },
    [],
  );

  // Scroll indicator — y-bobble + opacity pulse loop.
  useAnime(
    scrollIndicatorRef,
    (scope) => {
      if (scope.matches.reducedMotion) return;
      const el = scrollIndicatorRef.current;
      if (!el) return;
      animate(el, {
        translateY: [0, 8, 0],
        opacity: [0.4, 0.9, 0.4],
        duration: 2000,
        loop: true,
        ease: "inOutSine",
      });
    },
    [pastFold],
  );

  return (
    <section
      ref={heroRef}
      id="about"
      aria-labelledby="hero-heading"
      className={`relative min-h-screen flex items-center justify-center overflow-hidden bg-background${
        heroInView ? "" : " hero-paused"
      }`}
    >
      {/* Paper-tinted editorial backdrop — replaces aurora */}
      <PaperBackground />

      {/* Quiet operator signal — real shipping cadence */}
      <ShippedMeter reduced={!!prefersReducedMotion} />

      <div className="section-container relative z-10">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          {/* Left — Text content */}
          <div data-anime-hero="left" className="text-center lg:text-left">
            {/* Availability badge — monochrome treatment for full WCAG AA
                contrast. The single coral dot carries the "available"
                signal; the text itself stays on the foreground token. */}
            <div
              data-anime-hero="badge"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full mb-7 bg-muted border border-border"
            >
              <span className="relative flex h-2 w-2 flex-shrink-0">
                <span
                  className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-70"
                  style={{ background: "oklch(var(--primary))" }}
                />
                <span
                  className="relative inline-flex rounded-full h-2 w-2"
                  style={{ background: "oklch(var(--primary))" }}
                />
              </span>
              <span className="text-sm font-medium text-foreground">
                {personalData.availability}
              </span>
            </div>

            {/* Name */}
            <h1
              id="hero-heading"
              data-anime-hero="name"
              className="text-5xl sm:text-6xl lg:text-7xl xl:text-8xl font-bold mb-4"
              style={{ letterSpacing: "-0.03em", lineHeight: "1.05" }}
            >
              {(() => {
                const [first, ...rest] = personalData.name.split(" ");
                const surname = rest.join(" ");
                return (
                  <>
                    <span className="font-normal text-foreground">Hi, I am</span>{" "}
                    <span className="text-foreground">{first}</span>{" "}
                    <span
                      className="text-foreground [text-underline-offset:0.14em] [text-decoration-thickness:2px]"
                      style={{
                        textDecoration: "underline",
                        textDecorationColor: "oklch(var(--primary))",
                      }}
                    >
                      {surname}
                    </span>
                  </>
                );
              })()}
            </h1>

            {/* Title */}
            <h2
              data-anime-hero="title"
              className="text-xl sm:text-2xl lg:text-3xl font-semibold text-muted-foreground mb-6"
            >
              {personalData.title}
            </h2>

            {/* Tagline */}
            <p
              data-anime-hero="tagline"
              className="text-base md:text-lg text-muted-foreground max-w-xl mb-9 mx-auto lg:mx-0 leading-relaxed"
            >
              {personalData.tagline}
            </p>

            {/* CTAs */}
            <div
              data-anime-hero="ctas"
              className="flex flex-col sm:flex-row gap-3 justify-center lg:justify-start mb-9"
            >
              <button ref={primaryCtaRef} onClick={scrollToProjects} className="btn-hero-primary">
                See what I have built
                <ArrowDown className="w-4 h-4" />
              </button>
              <button ref={secondaryCtaRef} onClick={scrollToContact} className="btn-hero-secondary">
                Contact Me
              </button>
            </div>

            {/* Social links */}
            <div
              data-anime-hero="social"
              className="flex gap-3 justify-center lg:justify-start"
            >
              {[
                { href: personalData.social.github, Icon: Github, label: "GitHub" },
                { href: personalData.social.linkedin, Icon: Linkedin, label: "LinkedIn" },
                { href: personalData.social.twitter, Icon: Twitter, label: "Twitter" },
              ].map(({ href, Icon, label }) => (
                <a
                  key={label}
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={label}
                  className="p-3 rounded-xl transition-all focus-visible:ring-2 focus-visible:ring-primary/30"
                  style={{
                    background: "oklch(var(--muted))",
                    border: "1px solid oklch(var(--border))",
                    transition: "all 250ms cubic-bezier(0.16, 1, 0.3, 1)",
                  }}
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLElement).style.background = "oklch(var(--primary))";
                    (e.currentTarget as HTMLElement).style.color = "oklch(var(--primary-foreground))";
                    (e.currentTarget as HTMLElement).style.transform = "translateY(-3px) scale(1.08)";
                    (e.currentTarget as HTMLElement).style.boxShadow = "var(--shadow-sm)";
                    (e.currentTarget as HTMLElement).style.borderColor = "transparent";
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLElement).style.background = "oklch(var(--muted))";
                    (e.currentTarget as HTMLElement).style.color = "";
                    (e.currentTarget as HTMLElement).style.transform = "";
                    (e.currentTarget as HTMLElement).style.boxShadow = "";
                    (e.currentTarget as HTMLElement).style.borderColor = "oklch(var(--border))";
                  }}
                >
                  <Icon className="w-5 h-5" />
                </a>
              ))}
            </div>
          </div>

          {/* Right — Profile + metrics */}
          <div data-anime-hero="right" className="relative flex flex-col items-center">
            {/* Profile image — single hairline ring + quiet halo. No gradient. */}
            <div
              data-anime-hero="profile"
              className="relative mx-auto w-56 h-56 sm:w-72 sm:h-72 lg:w-80 lg:h-80 mb-9 rounded-full"
              style={{
                border: "1px solid oklch(var(--primary))",
                boxShadow: "0 0 0 16px oklch(var(--primary) / 0.10)",
              }}
            >
              <picture>
                <source
                  type="image/avif"
                  srcSet={`${personalData.profileImageSources.avif.sm} 256w, ${personalData.profileImageSources.avif.md} 512w, ${personalData.profileImageSources.avif.lg} 1024w`}
                  sizes="(min-width: 1024px) 320px, 240px"
                />
                <source
                  type="image/webp"
                  srcSet={`${personalData.profileImageSources.webp.sm} 256w, ${personalData.profileImageSources.webp.md} 512w, ${personalData.profileImageSources.webp.lg} 1024w`}
                  sizes="(min-width: 1024px) 320px, 240px"
                />
                <img
                  src={personalData.profileImage}
                  srcSet={`${personalData.profileImageSources.jpg.sm} 256w, ${personalData.profileImageSources.jpg.md} 512w, ${personalData.profileImageSources.jpg.lg} 1024w`}
                  sizes="(min-width: 1024px) 320px, 240px"
                  alt={`${personalData.name} profile photo`}
                  fetchPriority="high"
                  decoding="async"
                  loading="eager"
                  width={320}
                  height={320}
                  className="absolute inset-0 z-10 w-full h-full rounded-full object-cover"
                />
              </picture>
              {/* "Open to work" pill — solid accent, y-bobble loop. */}
              <div
                ref={pillRef}
                className="absolute -bottom-3 -right-3 z-20 px-3 py-1.5 rounded-xl text-xs font-semibold text-primary-foreground"
                style={{
                  background: "oklch(var(--primary))",
                  boxShadow: "var(--shadow-sm)",
                  willChange: heroInView ? "transform" : "auto",
                }}
              >
                Open to work
              </div>
            </div>

            {/* Metrics — inline sentence, not a card grid. */}
            <p
              data-anime-hero="metrics"
              className="font-sans text-sm md:text-base text-muted-foreground max-w-sm text-center leading-relaxed"
            >
              Shipped{" "}
              <span className="font-display font-bold text-foreground">
                {personalData.metrics.projects}
              </span>{" "}
              projects with{" "}
              <span className="font-display font-bold text-foreground">
                {personalData.metrics.clients}
              </span>{" "}
              clients over{" "}
              <span className="font-display font-bold text-foreground">
                {personalData.metrics.experience}
              </span>
              .
            </p>
          </div>
        </div>
      </div>

      {/* Scroll indicator — unmounts after the user scrolls past the fold. */}
      {!pastFold && (
        <div
          className="absolute bottom-8 left-1/2 -translate-x-1/2"
          style={{ opacity: heroInView ? 1 : 0, transition: "opacity 400ms ease-out" }}
        >
          <button
            ref={scrollIndicatorRef}
            onClick={scrollToProjects}
            className="flex flex-col items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
            aria-label="Scroll to projects"
          >
            <span className="text-[10px] uppercase tracking-[0.2em] font-medium">Scroll</span>
            <div className="w-5 h-8 rounded-full border border-current flex items-start justify-center pt-1.5">
              <div className="w-1 h-2 rounded-full bg-current" />
            </div>
          </button>
        </div>
      )}
    </section>
  );
}
