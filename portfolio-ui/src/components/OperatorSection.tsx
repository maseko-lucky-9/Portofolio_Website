import { useRef } from "react";
import { revealOnScroll } from "@/lib/use-anime";
import { useAnime } from "@/lib/use-anime";
import { personalData } from "@/data/personal";

/**
 * The portrait, in Aura's frame but in colour.
 *
 * The reference treatment is monochrome always — grayscale + luminosity blend
 * at 60% — and the frame, radius, hairline and bottom scrim all keep it. Only
 * the desaturation comes off (see aura.css `.portrait img`), and the veil goes
 * with it: a colour photograph held at 60% over the page ground reads as a
 * mistake rather than a treatment.
 *
 * Below the fold, so `loading="lazy"` — the LCP element is the hero headline.
 */
function Portrait() {
  const { avif, webp, jpg } = personalData.profileImageSources;
  return (
    <figure className="portrait">
      <picture>
        <source
          type="image/avif"
          srcSet={`${avif.sm} 256w, ${avif.md} 512w, ${avif.lg} 1024w`}
          sizes="(min-width:1024px) 400px, 90vw"
        />
        <source
          type="image/webp"
          srcSet={`${webp.sm} 256w, ${webp.md} 512w, ${webp.lg} 1024w`}
          sizes="(min-width:1024px) 400px, 90vw"
        />
        <img
          src={jpg.lg}
          alt={`${personalData.name} profile photo`}
          width={1024}
          height={1024}
          loading="lazy"
          decoding="async"
        />
      </picture>
      <div className="scrim" />
      <figcaption className="hud">
        <span className="mono tiny">REF · TM-01</span>
        <span className="mono tiny on">ZA / GMT+2</span>
      </figcaption>
    </figure>
  );
}

export function OperatorSection() {
  const rootRef = useRef<HTMLElement>(null);

  useAnime(
    rootRef,
    (scope) => {
      if (scope.matches.reducedMotion) return;
      const el = rootRef.current;
      if (!el) return;
      return revealOnScroll(el, "[data-anime]", { staggerMs: 90 });
    },
    [],
  );

  return (
    // No id — the LazySection wrapper in Index.tsx owns `#operator` as the
    // anchor target, because it exists before this section mounts. Carrying it
    // here too puts two elements with the same id in the document.
    <section className="s-80" aria-labelledby="operator-heading" ref={rootRef}>
      <div className="wrap">
        <p className="eyebrow mono mb-6" data-anime>
          <span className="dot">
            <i className="halo" />
            <i />
          </span>
          Built for regulated environments
        </p>

        <h2 id="operator-heading" className="display mb-24" style={{ maxWidth: "22ch" }} data-anime>
          Most platform work fails in production, <span className="fade">not in review.</span>
        </h2>

        <div className="op-grid" style={{ display: "grid", gap: 48, alignItems: "end" }}>
          <div data-anime>
            <Portrait />
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 32 }} data-anime>
            <p className="body">
              Four of five permanent roles inside South African banking. The work is migrations that
              had to keep clearing, services that had to stay auditable, and clusters that had to
              survive the change-control window they were given.
            </p>

            <div style={{ display: "flex", flexWrap: "wrap", gap: 12 }}>
              <span className="stat-pill">
                <span className="mono tiny">Microsoft Certified</span>
                <span className="mono tiny on">Azure Developer Associate</span>
              </span>
              <span className="stat-pill">
                <span className="mono tiny">Based</span>
                <span className="mono tiny on">{personalData.location}</span>
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
