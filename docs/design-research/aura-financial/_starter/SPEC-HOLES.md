# Spec holes found by the acceptance test

Building `_starter/index.html` from `DESIGN.md` + `tokens.css` alone (raw dumps and the original
site closed) surfaced these gaps. This is the point of Phase 6: every one of these would have
shipped as a silent defect in the spec.

| #   | Hole                                                                                                                                                                                                             | Resolution                                                                                                                                                                      |
| --- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | **Form controls** — no `<input>`/`<textarea>` in the source, so nothing is derivable.                                                                                                                            | **Already handled.** §8 flags it and gives a starting point. Built from that; it holds together.                                                                                |
| 2   | **Stat block** not documented as a component. §11 mentions a "stats band" but §8 had no anatomy.                                                                                                                 | **Fixed** — §8 now specifies it (italic-serif figure, unit in sans, mono label).                                                                                                |
| 3   | **Table / data display** not documented; the source has no `<table>`.                                                                                                                                            | **Fixed** — §8 now carries the derived pattern (mono uppercase `<th>`, hairline rows, `tabular-nums` accent figures).                                                           |
| 4   | **Nav-link vs button cascade.** `.nav a` out-specifies `.btn-solid` → white-on-white, invisible CTA label.                                                                                                       | **Fixed** — §8 states nav-link colour must be scoped `:not(.btn)`.                                                                                                              |
| 5   | **The 48px display rung was missing from the ramp.** It renders _only_ at 375 and 768, so a desktop-only census never sees it. The type ramp was built from the 1440 census and silently dropped it.             | **Fixed** — `--text-5xl: 48px` added; §4 ramp corrected to `…36 · 48 · 60 · 72` and now carries a per-viewport step table. **The strongest argument for sampling five widths.** |
| 6   | **Unit glyphs beside display figures** — prices render `$299` italic serif with `/mo` in small sans; the spec never said the unit drops out of italic.                                                           | **Fixed** — stated in §12.                                                                                                                                                      |
| 7   | **Nav mobile behaviour** undocumented. Source is `w-full max-w-[90vw] lg:w-fit` with links `hidden md:flex`; without it the nav overflows at 375px.                                                              | **Fixed** — §8 now documents it, including that there is no hamburger menu.                                                                                                     |
| 8   | **`overflow-x: hidden` on `<body>`** — the source carries it (`min-h-screen overflow-x-hidden`) and it is load-bearing: the fixed full-bleed background layer exceeds the viewport. Never mentioned in the spec. | **Fixed** — noted in §10; the starter also wraps wide tables in an `overflow-x:auto` container.                                                                                 |
| 9   | **Hero height** — §11 recorded `min-h-[1100px]` for this hero but not whether a tall hero is a system rule, nor that the hero carries no top border.                                                             | **Fixed** — §8 records it as a convention (~820–1100px, no top border).                                                                                                         |

## Deliberate substitutions (not holes)

- **WebGL background** — replaced with the documented radial accent glow plus an animated mesh
  approximation, exactly as §10 prescribes. The starter is visibly flatter behind the hero than the
  original; that is the honest cost of the substitution, and §10 says so up front.
- **Iconify Solar duotone icons** — the starter uses plain CSS dots rather than pulling the Iconify
  CDN. §7 documents the real icon system; this is a build choice, not a missing spec.

## Verdict

**Pass.** The spec was sufficient to build a different product, with a different section mix and two
component types the source does not contain, without reopening the raw dumps or the original site.
Nine gaps were found and all nine are now closed in `DESIGN.md`. The result reads as the same design
family: `screens/_starter-1440.jpg` and `screens/_starter-375.jpg` beside `screens/fullpage-1440.jpg`.

Verified at both viewports: no horizontal overflow, zero unresolved custom properties, display type
stepping 48 → 72 as documented, and a visible focus ring the source does not have.
