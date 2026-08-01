# ADR 004 — Prerender the SPA at build time for SEO + AEO

- Status: **Superseded in scope** by 2026-05-20 addendum (see bottom)
- Date: 2026-05-19
- Addendum: 2026-05-20
- Plan: `~/.claude/plans/now-create-a-seo-nifty-finch.md`

## Context

The portfolio is a Vite + React 18 single-page app served by Cloudflare Workers. The HTML shipped to crawlers contains only `<div id="root"></div>` plus a `<script>` tag — every section is mounted client-side. Three concrete consequences:

1. Search engines that *do* execute JavaScript (Googlebot since 2019) still rank such pages lower than equivalent pre-rendered HTML, because their two-pass crawler defers render to the "rendering queue" which can lag by days to weeks.
2. AI engines (ChatGPT browse, Claude.ai, Perplexity) generally *do not* execute JavaScript when fetching for citation. They see the empty shell and skip the page.
3. Social preview fetchers (Twitterbot, LinkedInBot) often time out on JS hydration and fall back to whatever is in the static `<meta>` tags — so per-route OG previews are impossible without server-rendered HTML per route.

The plan calls for ranking globally on Google + Bing + DuckDuckGo and being citable by AI engines. Both requirements are blocked by client-only rendering.

## Decision

Adopt **build-time prerendering** via `@prerenderer/rollup-plugin` + `@prerenderer/renderer-puppeteer`. Every route in the manifest is rendered to static HTML at build time and shipped as `dist/<route>/index.html`. The React app continues to hydrate on top for human users — navigation stays instant.

Routes split out of the current `Index.tsx` god-page:

| Route | Content |
|---|---|
| `/` | Hero, brief summary, CTAs |
| `/about` | Experience, skills, bio |
| `/projects` | Project index |
| `/projects/:slug` | Per-project case study |
| `/services` | Offer catalog |
| `/blog` | Blog index |
| `/blog/:slug` | Per-post page |
| `/answers/:slug` | AEO-focused long-form Q&A posts |
| `/contact` | Contact form |

The prerender plugin fires `app-rendered` via `document.dispatchEvent` once all `LazySection` Suspense boundaries resolve; Puppeteer waits for the event before snapshotting, ensuring no missing below-fold content.

## Alternatives considered

| Option | Pros | Cons | Verdict |
|---|---|---|---|
| **Build-time prerender (chosen)** | Keeps Vite + React + Workers stack. Zero runtime SSR cost. Fully static output. Atomic deploy. | One-time refactor cost (~6h). Adds Puppeteer dep. | ✅ |
| Migrate to Next.js App Router | First-class SSG + ISR + image opt + RSC. Best long-term. | Multi-week migration. Vendor lock-in. Loses Workers static-asset cost profile. | ❌ overkill |
| Migrate to Astro | Excellent for content sites. Per-route islands. | Different rendering model. Need to port all sections. ~2 week migration. | ❌ later option |
| Cloudflare Workers SSR (HTMLRewriter) | Edge SSR. No Puppeteer dep. | Requires full React server-render pipeline on the edge; not idiomatic for Workers. Cold-start cost on every page. | ❌ |
| Stay CSR + rely on Googlebot JS | Lowest effort. | Blocks AEO entirely. Slower indexation. Per-route OG impossible. | ❌ |
| Use `react-snap` (older approach) | Simple. | Unmaintained since 2020. Puppeteer too old. | ❌ |

## Consequences

**Positive:**
- AI engines see full page content; citation becomes possible.
- Per-route metadata + OG images become possible.
- Faster first paint (HTML is already there before JS runs).
- Lighthouse SEO score reaches 95+.

**Negative:**
- Build time grows (one Puppeteer instance per route — ~30s for ~10 routes).
- One more npm dep (`puppeteer` is heavy; ~250 MB in node_modules).
- Slight risk of hydration mismatch if components render differently between Puppeteer and browser — mitigated by the `app-rendered` event signal.

**Reversal cost:** Low. Remove the plugin from `vite.config.ts`; the SPA still works.

## References

- Plan of record: `~/.claude/plans/now-create-a-seo-nifty-finch.md`
- `@prerenderer/rollup-plugin`: <https://github.com/prerenderer/prerenderer>
- Google two-pass indexing: <https://developers.google.com/search/docs/crawling-indexing/javascript/javascript-seo-basics>
- AI engine crawler behavior matrix: `docs/seo/bot-policy.md`

---

## Addendum — 2026-05-20: Scope reduction

When implementation started, a hard architectural collision surfaced: the home page now eagerly mounts a 3D scene built on `@react-three/fiber` (`src/components/canvas/Scene.tsx`). Build-time prerendering via Puppeteer would:

1. Render the page in headless Chromium where WebGL is software-rendered through SwiftShader — slow, brittle, and the captured snapshot is whatever frame the scene happens to be at when the `app-rendered` event fires (usually frame 0: a black canvas).
2. Embed thousands of lines of post-hydration DOM that mismatch what R3F generates on the client, triggering React hydration warnings and potentially aborting hydration entirely.
3. Add Puppeteer (~250 MB) to the dev dependency tree purely to capture a snapshot that crawlers don't actually need on the home page — the existing static `<title>`, `<meta>`, and JSON-LD blocks in `index.html` already give crawlers and AI engines enough to index the home as a Person/ProfessionalService entity.

### Revised approach (implemented in commit `<TBD>`)

Static generation is now scoped to **content pages only**, where AEO benefit is highest and the 3D experience does not exist:

| Route | Strategy | Reason |
|---|---|---|
| `/` | Stays SPA + 3D (CSR) | R3F runtime-dependent; static meta already strong |
| `/about`, `/projects`, `/services`, `/contact` | Stays SPA, accessible via hash anchors on `/` | Low individual SEO value; site is small enough that on-page content covers it |
| `/blog`, `/blog/<slug>` | **Statically generated** from `content/blog/*.md` via `scripts/build-static-pages.mjs` | High AEO value; crawlers + AI engines see real content |
| `/answers`, `/answers/<slug>` | **Statically generated** from `content/answers/*.md` | Highest AEO value (long-form Q&A is the citation target) |

### Pipeline

```
vite build
  -> dist/index.html (SPA shell)
node scripts/build-static-pages.mjs
  -> dist/blog/<slug>/index.html (one per markdown post)
  -> dist/blog/index.html (post index)
  -> dist/answers/<slug>/index.html
  -> dist/answers/index.html
  -> dist/content-manifest.json
node scripts/build-sitemap.mjs
  -> dist/sitemap.xml (reads STATIC_ROUTES + content-manifest.json)
node scripts/inject-verification.mjs
node scripts/inject-fingerprint.mjs
```

Each generated content page:

- Is fully self-contained: no React, no JS dependency, no Vite asset hash to maintain.
- Ships its own `<title>`, `<meta name="description">`, canonical link, hreflang cluster (en-ZA / en / x-default), geo meta, OG card, Twitter card, robots `noai` meta.
- Embeds `BlogPosting` (or `SpeakableArticle` for `/answers`) + `BreadcrumbList` JSON-LD via the same schema builders used by the SPA.
- Includes a minimal CSS (~3 KB) so it reads cleanly without the app bundle.
- Links back to the SPA (`/`, `/blog`, `/answers`) so humans can dive into the full experience.

### Deferred work

- Full Vite + Puppeteer prerender of `/`, `/about`, etc. — only worth doing if the 3D scene is later refactored to render a non-interactive fallback during prerender (e.g., a hero image snapshot). Reopen as ADR 005 if pursued.
- `react-helmet-async` integration — not needed under this scope; static meta in `index.html` covers the SPA routes and the generator handles per-content-page meta.
- Per-route OG image generation via `satori` — content pages currently use the home OG image; revisit if individual post OGs become valuable for social syndication.

### Reversal cost

Lower than the original plan. To reverse: delete `scripts/build-static-pages.mjs`, `scripts/seo/page-template.mjs`, and `content/` directory. The SPA continues to work unchanged.
