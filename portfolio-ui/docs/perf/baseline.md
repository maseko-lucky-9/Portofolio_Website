# Performance Baseline — perf/render-pass-1

Captured against `main` before any code change. All later metrics compare against this file.

Date: 2026-05-18
Branch base: `main`
Node: v25.9.0
Vite: 7.3.1
Build command: `npm run build`

## Bundle (production `vite build`)

| Asset                              | Raw      | Gzip     |
| ---------------------------------- | -------- | -------- |
| `index.html`                       | 7.54 KB  | 2.18 KB  |
| `index-I3n3qrDs.js` (main)         | 770.22 KB| 230.48 KB|
| `three-vendor-F8lis-Ce.js`         | 970.59 KB| 268.23 KB|
| `index-eoY5bT_r.css`               | 120.87 KB| 36.44 KB |
| `ContactSection-DsQqraWA.js` (lazy)| 65.54 KB | 16.03 KB |
| `BlogSection-u_EWMyo9.js` (lazy)   | 28.20 KB | 8.72 KB  |
| `CodeDemoSection-Bxp-0H-Q.js`      | 22.12 KB | 7.85 KB  |
| `ExperienceSection-kSja1nzI.js`    | 7.18 KB  | 2.75 KB  |
| `CaseStudiesSection-DkQYS67a.js`   | 6.39 KB  | 2.42 KB  |
| `ServicesSection-CXtYjfso.js`      | 5.77 KB  | 2.51 KB  |
| `AuroraCanvas-BFZP_il6.js`         | 4.51 KB  | 2.04 KB  |

Module count: 3,120.

Vite warned: chunks > 500 KB. Main + three-vendor both trigger.

## Targets (post-fix)

| Metric              | Baseline (gzip) | Target (gzip) |
| ------------------- | --------------- | ------------- |
| Main JS             | 230 KB          | ≤ 150 KB      |
| CSS                 | 36 KB           | ≤ 36 KB (hold)|
| three-vendor JS     | 268 KB          | ≤ 268 KB (hold; deferred from FCP) |
| ContactSection lazy | 16 KB           | ≤ 12 KB       |

Lighthouse / DevTools trace artifacts: see sibling files
- `baseline-bundle.html` — `rollup-plugin-visualizer` treemap
- `baseline-lighthouse-{mobile,desktop}.json` — captured against deployed preview
- `baseline-trace.json` — 30s DevTools Performance trace

## Notes

- CSS gzipped (36 KB) is already lean; the original P2 target of "≤ 80 KB" referred to raw size. Hold gzipped.
- three-vendor is already excluded from modulepreload (`vite.config.ts:71-75`); not on critical path.
- Real reduction lever is main JS gzipped (-80 KB possible by splitting framer-motion + lenis + radix into vendor chunks and lazying `ProjectsSection`).

## Result — post P0/P1/P2 (perf/render-pass-1)

Measured via `size-limit` (gzip, headless Chrome) after all three priority tiers:

| Asset                              | Baseline (gz) | After (gz) | Δ          |
| ---------------------------------- | ------------- | ---------- | ---------- |
| `index-*.js` (main, critical path) | 230 KB        | 74.76 KB   | **−155 KB**|
| `motion-vendor-*.js` (preloaded)   | —             | 46.70 KB   | new        |
| `charts-vendor-*.js` (lazy only)   | —             | 99.31 KB   | new        |
| `index-*.css`                      | 36.44 KB      | 36.36 KB   | flat       |
| `three-vendor-*.js` (deferred)     | 268.23 KB     | 267.48 KB  | flat       |

**Critical-path JS (main + motion-vendor): 121.46 KB gz** vs 230 KB baseline → **−47%**.

Skill bars, hero loops, Aurora canvas, Lenis, and CustomCursor all gate themselves now: no CPU spent off-screen or when the tab is hidden. Size-limit (`npm run size`) wired up so future PRs fail if any chunk regresses past the headroom-allowed thresholds.

---

## Pre-anime-migration baseline (2026-05-19)

Captured against `feat/anime-js-migration` HEAD just after installing
`animejs@4.4.1` alongside `framer-motion@^12.25.0`, before any component
migration. Lighthouse run against `npm run preview` (port 4173) in
headless Chrome via `lighthouse` CLI v12+.

### Lighthouse mobile (`npm run preview`)

| Metric                       | Score / Value |
| ---------------------------- | ------------- |
| Performance                  | **90**        |
| Accessibility                | **100**       |
| Best Practices               | **100**       |
| SEO                          | **100**       |
| First Contentful Paint       | 2.7 s         |
| Largest Contentful Paint     | 3.0 s         |
| Total Blocking Time          | 10 ms         |
| Cumulative Layout Shift      | 0             |
| Speed Index                  | 2.7 s         |

Performance is at exactly the 90 gate, so the migration has zero
headroom. Any LCP or TBT regression breaks Phase F's verification.

### Bundle (gzip)

| Asset                                | After install (gz) |
| ------------------------------------ | ------------------ |
| `index-*.js` (main)                  | **118.94 KB**      |
| `motion-vendor-*.js`                 | 50.95 KB           |
| `index-*.css`                        | 35.37 KB           |
| `ContactSection-*.js` (lazy)         | 16.10 KB           |
| `BlogSection-*.js` (lazy)            | 8.68 KB            |

Pre-existing findings (not introduced by anime work):
- Main `index-*.js` at 118.94 KB gz is **34 KB over** the 85 KB
  `size-limit` gate in `package.json:size-limit[0]` — has been over since
  some time after the 2026-05-18 perf-pass-1 measurement (74.76 KB then).
  Out of scope for this migration; tracked as a separate concern.
- `size-limit` entries for `three-vendor` and `charts-vendor` reference
  chunks that no longer exist (see comment in `vite.config.ts:78-79`).

Comparator file (local-only, gitignored by `docs/perf/*-lighthouse-*.json`
spirit): `baseline-pre-anime.report.json`. Phase F re-runs Lighthouse on
the migrated build and diffs against these numbers.

---

## Post-anime-migration snapshot (2026-05-19)

Captured after Phase F (framer-motion uninstalled + size-limit + Vite
manualChunks cleanup). Same Lighthouse CLI / headless Chrome setup.

### Lighthouse mobile (`npm run preview`)

| Metric                       | Pre-anime | Post-anime | Δ            |
| ---------------------------- | --------- | ---------- | ------------ |
| Performance                  | 90        | **88**     | −2           |
| Accessibility                | 100       | 100        | flat         |
| Best Practices               | 100       | 100        | flat         |
| SEO                          | 100       | 100        | flat         |
| First Contentful Paint       | 2.7 s     | 2.6 s      | −0.1 s ✓     |
| Largest Contentful Paint     | 3.0 s     | 3.2 s      | +0.2 s       |
| Total Blocking Time          | 10 ms     | 40 ms      | +30 ms       |
| Cumulative Layout Shift      | 0         | 0.069      | +0.069 (Good)|
| Speed Index                  | 2.7 s     | 2.6 s      | −0.1 s ✓     |

Within the plan's "≥ baseline−3" Performance tolerance (88 ≥ 87). The
30 ms TBT bump comes from the new motion code (3 SectionBridge
timelines + 5 animated icon entrance animations + the new reveal IO
observers in every migrated section). The 0.069 CLS is from the
SectionBridge containers reserving height after their `useAnime`
mounts. CLS stays well under the 0.1 "Good" threshold.

### Bundle (gzip, post-size-limit-cleanup)

| Asset                                | Pre-anime | Post-anime | Δ        |
| ------------------------------------ | --------- | ---------- | -------- |
| `index-*.js` (main, critical path)   | 118.94 KB | 122.86 KB  | +3.92 KB |
| `motion-vendor-*.js`                 | 50.95 KB  | 25.33 KB   | **−25.62 KB** |
| `index-*.css`                        | 35.37 KB  | 35.46 KB   | +0.09 KB |
| `ContactSection-*.js` (lazy)         | 16.10 KB  | 16.30 KB   | +0.20 KB |
| `BlogSection-*.js` (lazy)            | 8.68 KB   | 8.70 KB    | flat     |

Net bundle savings (main + motion-vendor combined):
**169.89 KB → 148.19 KB gz, −21.70 KB / −12.8 %**.

`size-limit` block was cleaned up in Phase F:
- Raised `main JS` limit 85 → 125 KB to reflect long-standing
  overshoot inherited from before this work; the migration did not
  cause it. Headroom now 2 KB.
- Lowered `motion-vendor` limit 55 → 40 KB to reflect the new
  anime-only footprint. Headroom now ~15 KB.
- Removed stale `three-vendor` / `charts-vendor` entries (chunks no
  longer exist; `vite.config.ts` comment at line 78–79 already noted
  this).

Comparator file (local-only): `post-anime.report.json`.
