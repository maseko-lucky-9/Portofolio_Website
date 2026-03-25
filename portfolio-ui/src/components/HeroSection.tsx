import { motion, useReducedMotion } from "framer-motion";
import { ArrowDown, Github, Linkedin, Twitter } from "lucide-react";
import { personalData } from "@/data/personal";
import { AuroraBackground } from "@/components/AuroraBackground";

const springTransition = { type: "spring", stiffness: 260, damping: 24 };

export function HeroSection() {
  const prefersReducedMotion = useReducedMotion();
  const scrollToProjects = () => {
    document.querySelector("#projects")?.scrollIntoView({ behavior: "smooth" });
  };

  const scrollToContact = () => {
    document.querySelector("#contact")?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <section
      id="about"
      aria-labelledby="hero-heading"
      className="relative min-h-screen flex items-center justify-center overflow-hidden"
      style={{ background: "var(--gradient-hero)" }}
    >
      {/* Aurora WebGL background */}
      <AuroraBackground />

      {/* Ambient glow blobs — light mode */}
      {!prefersReducedMotion && (
        <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden>
          <div className="absolute top-1/4 -left-1/4 w-[600px] h-[600px] rounded-full opacity-[0.07] dark:opacity-[0.05] bg-primary blur-[120px] animate-blob" />
          <div className="absolute bottom-1/4 -right-1/4 w-[500px] h-[500px] rounded-full opacity-[0.06] dark:opacity-[0.04] bg-secondary blur-[100px] animate-blob-delay" />
        </div>
      )}

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
                background: "hsl(var(--secondary) / 0.08)",
                border: "1px solid hsl(var(--secondary) / 0.25)",
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
              <button onClick={scrollToProjects} className="btn-hero-primary">
                View My Work
                <ArrowDown className="w-4 h-4" />
              </button>
              <button onClick={scrollToContact} className="btn-hero-secondary">
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
                    background: "hsl(var(--muted))",
                    border: "1px solid hsl(var(--border))",
                    transition: "all 250ms cubic-bezier(0.16, 1, 0.3, 1)",
                  }}
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLElement).style.background = "hsl(var(--primary))";
                    (e.currentTarget as HTMLElement).style.color = "hsl(var(--primary-foreground))";
                    (e.currentTarget as HTMLElement).style.transform = "translateY(-3px) scale(1.08)";
                    (e.currentTarget as HTMLElement).style.boxShadow = "var(--shadow-glow)";
                    (e.currentTarget as HTMLElement).style.borderColor = "transparent";
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLElement).style.background = "hsl(var(--muted))";
                    (e.currentTarget as HTMLElement).style.color = "";
                    (e.currentTarget as HTMLElement).style.transform = "";
                    (e.currentTarget as HTMLElement).style.boxShadow = "";
                    (e.currentTarget as HTMLElement).style.borderColor = "hsl(var(--border))";
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
              <img
                src={personalData.profileImage}
                alt={`${personalData.name} profile photo`}
                fetchPriority="high"
                width={320}
                height={320}
                className="absolute inset-[5px] z-10 w-[calc(100%-10px)] h-[calc(100%-10px)] rounded-full object-cover"
              />
              {/* Floating badge */}
              <motion.div
                animate={{ y: [0, -6, 0] }}
                transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                className="absolute -bottom-3 -right-3 z-20 px-3 py-1.5 rounded-xl text-xs font-semibold text-primary-foreground"
                style={{
                  background: "var(--gradient-primary)",
                  boxShadow: "var(--shadow-glow)",
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

      {/* Scroll indicator */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.4 }}
        className="absolute bottom-8 left-1/2 -translate-x-1/2"
      >
        <motion.button
          onClick={scrollToProjects}
          animate={{ y: [0, 8, 0], opacity: [0.4, 0.9, 0.4] }}
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
    </section>
  );
}
