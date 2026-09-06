# 008 — The Aura "Signal Field" redesign, and shipping it Docker-first

## Status

Accepted (2026-09-06) — implemented on `feat/aura-signal-field`, not yet merged.

## Context

The portfolio shipped a light-default indigo/emerald system with glass cards and
gradient text. It was competent and completely generic: nothing in it said the
author operates production Kubernetes inside a bank. For a page whose entire job
is to be credible to a recruiter in under sixty seconds, that is the failure
mode that matters.

A full design direction was extracted from a dark instrument-panel fintech
template, then built as four complete full-page mockups and iterated to approval
before a single line of `portfolio-ui/` changed. The approved variant is "Signal
Field": an ambient WebGL background, a nav pill, an instrument diagram in place
of a hero photograph, an employer marquee, and an accent slab closing the page.

Two prior decisions constrained the port. `SkillsSection` and `ExperienceSection`
are **frozen layouts** — their mechanics (the toggle→radar swap, the zigzag, the
`0fr→1fr` fold, hover gating by `pointerType`) were built and tested
deliberately, so the redesign restyles them and touches no behaviour. And
`src/data/projects.ts` carries a standing rule, written after invented metrics
and 404ing URLs shipped once: every URL must resolve and every impact line must
be supported by the repo's README. That rule was extended to every new construct
here.

## Decision

**Port the approved mockup CSS-first, and prove it in a container before opening
a pull request.**

The mockup's hand-written CSS becomes `src/styles/aura.css` on top of a single
dark `:root`. Components emit the mockup's markup and class names; Tailwind
utilities stay only where shadcn primitives need them. This keeps the approved
artifact as the source of truth rather than re-deriving the design in JSX.

Specific choices worth recording:

- **Spectral** as the display face, chosen from three candidates rendered on the
  real hero rather than picked from a list. Self-hosted via `@fontsource` —
  production's CSP is `font-src 'self' data:`, so a Google Fonts stylesheet
  would be blocked and would fall back silently to Georgia.
- **One accent** across all three skill categories. The previous per-category
  palette was a measured, contrast-verified decision, not a regression; it is
  replaced because this design spends its single high-chroma colour on one
  signal, and category is already encoded by position and label.
- **Aura's accent renamed `--signal`.** shadcn's own `--accent` is a hover
  surface consumed by 50 files under `components/ui`, and both are valid bare
  OKLCH triples — a collision would have parsed cleanly and repainted every
  dropdown and command-palette row cyan with no error anywhere.
- **No contact form.** Production builds with `VITE_USE_API=false` and has no
  backend, so the form's own fallback was already a `mailto:`. The slab offers
  the three channels directly instead of presenting fields that go nowhere.
- **The ambient field is an enhancement, never a requirement.** It renders a CSS
  gradient in the first paint and upgrades to WebGL at idle after `load`. Every
  bail-out — opt-out flags, no WebGL2, no vendored scene, a lost context — lands
  on that same gradient.
- **The scene will be our own Unicorn Studio export.** The runtime is
  proprietary; self-hosting an exported project JSON is its documented path, but
  only for a project in your own account. The reference template's scene is
  someone else's, so it is used as a visual target and a rebuild recipe and is
  never shipped. `public/field/README.md` holds the hand-off contract.
- **The dithered edge frame is ours, in Canvas 2D.** Amended 2026-09-06. The
  frame around the viewport is the most recognisable part of the reference, and
  waiting on a third-party account for it left the page visibly short of the
  approved design. It is now `src/lib/dither.ts` + `DitherBorder`: an ordered
  (Bayer 4x4) quantisation of a squared edge falloff, painted into a canvas —
  no vendored asset, no licence question, nothing to hand off.

  Canvas 2D rather than WebGL, deliberately. Playwright's WebKit on Linux has
  no WebGL at all, which is why the scene tests probe and skip; a 2D context
  exists everywhere, so `e2e/field.spec.ts` asserts real painted pixels on both
  projects. It obeys the same bail-outs as the field above, plus a browser that
  refuses a 2D context.

  Its constants are fitted to measurements of the reference render rather than
  chosen: 5 px cells, a 60 px rim decaying as a square, peak alpha 0.62, and a
  bottom mask — the reference frame is three-sided, its bottom edge measuring
  luminance 6 against 145 on the other three. Depth is proportional below
  desktop: a flat 60 px is a third of a 375 px phone on each side.

  This does not retire the export path; the two layers are independent. If a
  scene is ever vendored and carries its own border, that is the point to
  decide which one wins.

**Docker before PR.** The trial runs the real image (`node:24-alpine` build →
`nginx:1.27-alpine`) and fires the whole Playwright suite at it, gated behind an
explicit `E2E_FULL_SUITE=1`. A second base-URL variable was rejected: two env
vars a character apart with opposite `testMatch` semantics is precisely the
footgun that the live-domain restriction exists to prevent.

## Consequences

**Removed:** light mode and `ThemeContext`, `SectionBridge`, `CustomCursor`,
`ScrollProgress`, the Blog and Case-studies sections, `framer-motion` and
`@gsap/react` (no real imports remained), and 279 lines of `index.css` whose
every class belonged to the old design.

**Anchors renamed:** `#about` → `#operator`, `#projects` → `#work`, plus a new
`#how`. Any published deep link to the old anchors now lands at the top of the
page rather than the intended section.

**The static content pages did not change.** `scripts/seo/page-template.mjs`
carries its own inline CSS and never imports `index.css`, so `/blog`, `/answers`
and `/projects` still render in the old visual language. They are still linked
from the footer. Restyling them is a separate pass.

**Budgets improved rather than degraded.** CSS went from 36.4 KB to 16.4 KB
gzip against a 40 KB limit — the lever was the font imports (25 `@font-face`
blocks down to 7), not the CSS. Lighthouse: performance 1.00, LCP 530 ms,
CLS 0.000, measured before the field is vendored.

**Four defects were found by looking at the running page, not by a test**, and
are recorded here because each was invisible to every gate the project has:

1. A bare `section` element rule gave Sonner's top-level toast container 128 px
   of block padding — 257 px of invisible layout above the fold, pushing the
   whole page down.
2. The scene probe accepted any `200`. Behind an SPA fallback a missing file
   answers `200 text/html`, so the runtime was injected against a page of HTML.
   The same class of bug was hiding a Playwright guard, which had been asserting
   against the app shell rather than skipping.
3. The nav pill centred itself with `translateX(-50%)`, which the entrance
   animation overwrote with `translateY` — half a pill right of centre at 1440,
   half off-screen at 375.
4. nginx `add_header` is replace-not-merge, so both location blocks that set
   `Cache-Control` discarded every security header, and the CSP never reached a
   single HTML response. Pre-existing, and only reachable because the trial
   asked the container for its headers.

**Deferred:** vendoring our own scene export (the site is complete without it),
regenerating the hand-made `public/og/home.png`, and restyling the prerendered
content pages.
