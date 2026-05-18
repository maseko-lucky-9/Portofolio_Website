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
      {/* Masthead rule — sits about 96px from top of section. Opacity
          driven by --masthead-opacity (0.65 light / 0.55 dark, defined
          in index.css :root + .dark blocks). */}
      <div
        className="absolute left-0 right-0"
        style={{
          top: "96px",
          height: "1px",
          background:
            "linear-gradient(to right, transparent 0%, oklch(var(--border)) 12%, oklch(var(--border)) 88%, transparent 100%)",
          opacity: "var(--masthead-opacity, 0.65)",
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
              background: "oklch(var(--border))",
              opacity: 0.18,
            }}
          />
        ))}
      </div>

      {/* Folio mark — top-right of the section, vertically centered on
          the masthead rule. Reads as the rule's right-side terminus, the
          way a publication colophon sits at the masthead anchor.
          ShippedMeter at top-6 right-6 sits ABOVE this anchor — no
          collision. Display serif italic at small size for register. */}
      <div
        className="absolute font-display italic"
        style={{
          top: "96px",
          right: "32px",
          transform: "translateY(-50%)",
          fontSize: "13px",
          lineHeight: 1,
          color: "oklch(var(--muted-foreground))",
          opacity: 0.55,
          letterSpacing: "0.01em",
          paddingLeft: "12px",
          paddingRight: "0",
          background: "oklch(var(--background))",
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

// Memoized — props-less, never re-renders after mount.
export const PaperBackground = memo(PaperBackgroundImpl);
