/**
 * PaperBackground — refined editorial backdrop for the hero section.
 *
 * Replaces the WebGL aurora. Static, paper-tinted, hairline-ruled.
 * Conceptually: the inside cover of a typeset engineering field manual,
 * not a SaaS hero. No animation, no gradients, no blur. Honors light/dark.
 *
 * Layers (back to front):
 *   1. Paper base — solid `--background` token (already warm-tinted).
 *   2. Column rules — three vertical hairlines marking a 4-column gutter
 *      grid. Tinted toward the border token, very low opacity.
 *   3. Masthead rule — one horizontal hairline near the top, full-width.
 *   4. Folio mark — small fixed-position publication-style mark in the
 *      lower-right corner. The intentional, memorable detail.
 *
 * Zero JS state, zero observers, zero rAF. Ships as a single render.
 */
import { memo } from "react";

function PaperBackgroundImpl() {
  return (
    <div
      aria-hidden
      className="pointer-events-none absolute inset-0 overflow-hidden select-none"
    >
      {/* Masthead rule — sits about 96px from top of section */}
      <div
        className="absolute left-0 right-0"
        style={{
          top: "96px",
          height: "1px",
          background:
            "linear-gradient(to right, transparent 0%, hsl(var(--border)) 12%, hsl(var(--border)) 88%, transparent 100%)",
          opacity: 0.55,
        }}
      />

      {/* Column rules — four-column gutter grid, drawn full-height */}
      <div className="absolute inset-y-0 left-0 right-0">
        {[25, 50, 75].map((pct) => (
          <span
            key={pct}
            className="absolute top-0 bottom-0"
            style={{
              left: `${pct}%`,
              width: "1px",
              background: "hsl(var(--border))",
              opacity: 0.18,
            }}
          />
        ))}
      </div>

      {/* Folio mark — bottom-LEFT corner (right is reserved for the
          ShippedMeter widget; functional widgets win — see
          .impeccable.md). Display serif italic at small size reads as
          a publication colophon, not as developer-IDE chrome. */}
      <div
        className="absolute bottom-6 left-8 font-display italic"
        style={{
          fontSize: "13px",
          lineHeight: 1,
          color: "hsl(var(--muted-foreground))",
          opacity: 0.55,
          letterSpacing: "0.01em",
        }}
      >
        <span>N&deg;&nbsp;01</span>
        <span aria-hidden className="mx-2 opacity-50 not-italic">
          &mdash;
        </span>
        <span>Field Notes</span>
      </div>
    </div>
  );
}

/**
 * Memoized — props-less, never re-renders after mount. Cheaper than the
 * aurora it replaces by several orders of magnitude.
 */
export const PaperBackground = memo(PaperBackgroundImpl);

/**
 * Back-compat shim: HeroSection imported {AuroraBackground} historically.
 * Re-exporting the new component under the old name lets us flip the
 * implementation without touching call sites if we ever want to A/B.
 * Kept un-exported by default — callers should migrate to PaperBackground.
 */
