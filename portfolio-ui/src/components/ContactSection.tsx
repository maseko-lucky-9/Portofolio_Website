import { useRef } from "react";
import { personalData } from "@/data/personal";
import { revealOnScroll, useAnime } from "@/lib/use-anime";

interface SlabCardProps {
  href: string;
  label: string;
  detail: string;
  ariaLabel: string;
}

function SlabCard({ href, label, detail, ariaLabel }: SlabCardProps) {
  const external = href.startsWith("http");
  return (
    <a
      className="slab-card"
      href={href}
      aria-label={ariaLabel}
      {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          gap: 12,
        }}
      >
        <div>
          <div style={{ fontWeight: 600, marginBottom: 4 }}>{label}</div>
          <div className="mono tiny" style={{ color: "oklch(var(--surface-page) / 0.8)" }}>
            {detail}
          </div>
        </div>
        <span aria-hidden="true">&#8599;</span>
      </div>
    </a>
  );
}

/**
 * The closing slab — the page's single brightest surface and its only large
 * accent fill.
 *
 * Ink is near-black, not white: white on this fill measures 2.14:1 and fails
 * outright, while the page ground on it clears 9.63:1.
 *
 * Three direct channels instead of a form. Production has no backend
 * (VITE_USE_API=false), so the form's own fallback was already a mailto: — this
 * drops the intermediate step rather than presenting fields that go nowhere.
 * The full availability string lives here because src/chat.ts quotes it
 * verbatim and refuses anything beyond it; the hero only paraphrases it.
 */
export function ContactSection() {
  const rootRef = useRef<HTMLElement>(null);

  useAnime(
    rootRef,
    (scope) => {
      const root = rootRef.current;
      if (!root) return;
      if (scope.matches.reducedMotion) return;
      return revealOnScroll(root, "[data-anime]", { staggerMs: 90 });
    },
    [],
  );

  return (
    <section
      ref={rootRef}
      // No id — the LazySection wrapper in Index.tsx owns `#contact`.
      aria-labelledby="contact-heading"
      className="s-80"
    >
      <div className="wrap">
        <div className="slab" data-anime>
          <div className="orb" aria-hidden="true" />
          <div className="ripple" aria-hidden="true" />

          <div className="slab-grid" style={{ position: "relative", display: "grid", gap: 48 }}>
            <div>
              <h2 id="contact-heading" className="display" style={{ marginBottom: 24 }}>
                Need someone who has already <span className="fade">shipped this in a bank?</span>
              </h2>
              <p className="body" style={{ maxWidth: "36rem" }}>
                {personalData.availability}
              </p>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <SlabCard
                href={`mailto:${personalData.email}`}
                label="Email directly"
                detail={personalData.email}
                ariaLabel="Email"
              />
              <SlabCard
                href={personalData.social.linkedin}
                label="LinkedIn"
                detail={personalData.name}
                ariaLabel="LinkedIn"
              />
              <SlabCard
                href={personalData.social.github}
                label="GitHub"
                detail="maseko-lucky-9"
                ariaLabel="GitHub"
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
