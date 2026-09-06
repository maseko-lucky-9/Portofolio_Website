import { useRef } from "react";
import { Zap } from "lucide-react";
import { services, type Service } from "@/data/services";
import { revealOnScroll, useAnime } from "@/lib/use-anime";
import { useSpotlight } from "@/lib/use-spotlight";
import { scrollToSection } from "@/lib/scroll-to-section";

function CapabilityCard({ service, icon }: { service: Service; icon?: boolean }) {
  return (
    <>
      {/* Two cursor-tracked layers: a soft spotlight and a masked edge light.
          Both are driven by --mx/--my from useSpotlight on the section root. */}
      <span className="cap-glow" aria-hidden="true" />
      <span className="cap-ring" aria-hidden="true" />

      <p className="mono tiny on" style={{ marginBottom: 16 }}>
        {service.eyebrow}
      </p>

      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12 }}>
        {icon && (
          <span style={{ color: "oklch(var(--signal))", display: "flex", flex: "none" }}>
            <Zap className="w-6 h-6" aria-hidden="true" />
          </span>
        )}
        <h3
          id={`service-${service.id}-heading`}
          className="display"
          style={{ fontSize: "var(--t-2xl)" }}
        >
          {service.name}
        </h3>
      </div>

      <p className="small" style={{ color: "var(--ink-70)", marginBottom: 20 }}>
        {service.body}
      </p>

      {/* flex:1 so the tech rows line up across all three cards regardless of
          how many capability lines each one carries. */}
      <ul
        style={{
          display: "flex",
          flexDirection: "column",
          gap: 10,
          flex: 1,
          marginBottom: 20,
        }}
      >
        {service.caps.map((cap) => (
          <li
            key={cap}
            style={{
              display: "flex",
              gap: 10,
              color: "var(--ink-70)",
              fontSize: "var(--t-sm)",
              lineHeight: 1.6,
            }}
          >
            <span
              aria-hidden="true"
              style={{
                flex: "none",
                marginTop: 8,
                width: 4,
                height: 4,
                borderRadius: 9999,
                background: "oklch(var(--signal))",
              }}
            />
            {cap}
          </li>
        ))}
      </ul>

      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: 6,
          paddingTop: 20,
          borderTop: "1px solid var(--border-section)",
        }}
      >
        {service.tech.map((t) => (
          <span key={t} className="chip">
            {t}
          </span>
        ))}
      </div>
    </>
  );
}

/**
 * What I take on.
 *
 * Three equal cards, the middle one raised with a gradient hairline instead of
 * a border. The lift is compositional, not a "most popular" claim — there are
 * no prices and no tiers here to rank.
 */
export function ServicesSection() {
  const rootRef = useRef<HTMLElement>(null);
  useSpotlight(rootRef, ".cap");

  useAnime(
    rootRef,
    (scope) => {
      const root = rootRef.current;
      if (!root) return;
      if (scope.matches.reducedMotion) return;
      return revealOnScroll(root, "[data-anime]", { staggerMs: 100 });
    },
    [],
  );

  const [first, middle, last] = services;

  return (
    <section
      ref={rootRef}
      // No id — the LazySection wrapper in Index.tsx owns `#services`.
      aria-labelledby="services-heading"
      className="s-50"
    >
      <div className="wrap">
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            textAlign: "center",
            marginBottom: 80,
          }}
          data-anime
        >
          <span className="eyebrow-pill" style={{ marginBottom: 32 }}>
            <span className="dot">
              <i className="halo" />
              <i />
            </span>
            <span className="mono tiny on">What I take on</span>
          </span>
          <h2 id="services-heading" className="display">
            Three kinds of engagement, <span className="fade">one delivery path.</span>
          </h2>
          <p className="lede" style={{ marginTop: 24, maxWidth: "42rem" }}>
            Drawn from eight years inside South African banking. Each line is delivered the same
            way: version-controlled, observable, and reviewable.
          </p>
        </div>

        <div className="cap-grid">
          <article className="cap" data-anime>
            <CapabilityCard service={first} />
          </article>

          <div className="cap-edge cap-lift" data-anime>
            <article className="cap">
              <CapabilityCard service={middle} icon />
            </article>
          </div>

          <article className="cap" data-anime>
            <CapabilityCard service={last} />
          </article>
        </div>

        <div style={{ display: "flex", justifyContent: "center", marginTop: 96 }} data-anime>
          <a
            className="shiny-cta sm"
            href="#how"
            onClick={(e) => {
              e.preventDefault();
              scrollToSection("#how");
            }}
          >
            <span>How an engagement starts</span>
          </a>
        </div>
      </div>
    </section>
  );
}
