# ADR 004 — Prerender the SPA at build time for SEO + AEO

- Status: Accepted
- Date: 2026-05-19
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
