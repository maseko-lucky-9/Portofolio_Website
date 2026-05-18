import { useEffect, useRef, useState } from "react";
import { motion, useInView, useReducedMotion } from "framer-motion";
import { ArrowDown, Github, Linkedin, Twitter } from "lucide-react";
import { personalData } from "@/data/personal";
import { PaperBackground } from "@/components/PaperBackground";
import { useMagnetic } from "@/lib/motion";

const springTransition = { type: "spring", stiffness: 260, damping: 24 };

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
      className="pointer-events-none absolute top-6 right-6 z-20 hidden font-mono text-[11px] tracking-tight sm:block"
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
  // `initial: true` so animations start immediately on mount — the IO callback
  // is async and would otherwise leave looping animations un-started for 1+ frame.
  const heroInView = useInView(heroRef, { initial: true });
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
          <motion.div
            initial={{ opacity: 0, x: -40 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.7, ...springTransition }}
            className="text-center lg:text-left"
          >
            {/* Availability badge */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15, ...springTransition }}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full mb-7"
              style={{
                background: "oklch(var(--secondary) / 0.08)",
                border: "1px solid oklch(var(--secondary) / 0.25)",
              }}
            >
              <span className="relative flex h-2 w-2 flex-shrink-0">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-secondary opacity-70" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-secondary" />
              </span>
              <span className="text-sm font-medium text-secondary">{personalData.availability}</span>
            </motion.div>

            {/* Name */}
            <motion.h1
              id="hero-heading"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.25, ...springTransition }}
              className="text-5xl sm:text-6xl lg:text-7xl xl:text-8xl font-bold mb-4"
              style={{ letterSpacing: "-0.03em", lineHeight: "1.05" }}
            >
              Hi, I'm{" "}
              <span className="text-gradient-primary">{personalData.name}</span>
            </motion.h1>

            {/* Title */}
            <motion.h2
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.35, ...springTransition }}
              className="text-xl sm:text-2xl lg:text-3xl font-semibold text-muted-foreground mb-6"
            >
              {personalData.title}
            </motion.h2>

            {/* Tagline */}
            <motion.p
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.45, ...springTransition }}
              className="text-base md:text-lg text-muted-foreground max-w-xl mb-9 mx-auto lg:mx-0 leading-relaxed"
            >
              {personalData.tagline}
            </motion.p>

            {/* CTAs */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.55, ...springTransition }}
              className="flex flex-col sm:flex-row gap-3 justify-center lg:justify-start mb-9"
            >
              <button ref={primaryCtaRef} onClick={scrollToProjects} className="btn-hero-primary">
                See what I've built
                <ArrowDown className="w-4 h-4" />
              </button>
              <button ref={secondaryCtaRef} onClick={scrollToContact} className="btn-hero-secondary">
                Contact Me
              </button>
            </motion.div>

            {/* Social links */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.65, ...springTransition }}
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
                    (e.currentTarget as HTMLElement).style.boxShadow = "var(--shadow-glow)";
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
            </motion.div>
          </motion.div>

          {/* Right — Profile + metrics */}
          <motion.div
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.7, delay: 0.2, ...springTransition }}
            className="relative flex flex-col items-center"
          >
            {/* Profile image with premium gradient ring */}
            <motion.div
              initial={{ scale: 0.85, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.4, duration: 0.6, ...springTransition }}
              className="relative mx-auto w-56 h-56 sm:w-72 sm:h-72 lg:w-80 lg:h-80 mb-9"
            >
              {/* Outer glow ring */}
              <div
                className="absolute inset-0 rounded-full animate-pulse-glow"
                style={{ background: "var(--gradient-primary)", padding: "3px" }}
              >
                <div className="w-full h-full rounded-full bg-background" />
              </div>
              {/* Inner gradient ring */}
              <div
                className="absolute inset-[3px] rounded-full"
                style={{ background: "var(--gradient-primary)" }}
              />
              {/* Photo */}
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
                  className="absolute inset-[5px] z-10 w-[calc(100%-10px)] h-[calc(100%-10px)] rounded-full object-cover"
                />
              </picture>
              {/* Floating badge — only animates while hero is in view. */}
              <motion.div
                animate={heroInView && !prefersReducedMotion ? { y: [0, -6, 0] } : { y: 0 }}
                transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                className="absolute -bottom-3 -right-3 z-20 px-3 py-1.5 rounded-xl text-xs font-semibold text-primary-foreground"
                style={{
                  background: "var(--gradient-primary)",
                  boxShadow: "var(--shadow-glow)",
                  willChange: heroInView ? "transform" : "auto",
                }}
              >
                Open to work
              </motion.div>
            </motion.div>

            {/* Metrics grid */}
            <div className="grid grid-cols-3 gap-4 w-full max-w-sm">
              {[
                { label: "Projects", value: personalData.metrics.projects },
                { label: "Years Exp.", value: personalData.metrics.experience },
                { label: "Clients", value: personalData.metrics.clients },
              ].map((metric, index) => (
                <motion.div
                  key={metric.label}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.7 + index * 0.1, ...springTransition }}
                  className="text-center p-4 rounded-2xl glass-card"
                >
                  <div className="text-2xl lg:text-3xl font-bold text-gradient-primary mb-0.5">
                    {metric.value}
                  </div>
                  <div className="text-xs text-muted-foreground font-medium">{metric.label}</div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>

      {/* Scroll indicator — unmounts after the user scrolls past the fold,
          and pauses its bounce when the hero is no longer visible. */}
      {!pastFold && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: heroInView ? 1 : 0 }}
          transition={{ delay: 1.4 }}
          className="absolute bottom-8 left-1/2 -translate-x-1/2"
        >
          <motion.button
            onClick={scrollToProjects}
            animate={
              heroInView && !prefersReducedMotion
                ? { y: [0, 8, 0], opacity: [0.4, 0.9, 0.4] }
                : { y: 0, opacity: 0.6 }
            }
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
            className="flex flex-col items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
            aria-label="Scroll to projects"
          >
            <span className="text-[10px] uppercase tracking-[0.2em] font-medium">Scroll</span>
            <div className="w-5 h-8 rounded-full border border-current flex items-start justify-center pt-1.5">
              <div className="w-1 h-2 rounded-full bg-current" />
            </div>
          </motion.button>
        </motion.div>
      )}
    </section>
  );
}
