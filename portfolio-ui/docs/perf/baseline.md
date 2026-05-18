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
