---
title: "Portfolio site: React SPA + 3D scroll + edge SSR for SEO"
description: "Self-hosted portfolio built on Vite + React 18 + @react-three/fiber, deployed to Cloudflare Workers. Static content pages generated from markdown so AI engines can cite individual posts."
datePublished: "2026-05-19T08:00:00+02:00"
programmingLanguages:
  - TypeScript
  - React
  - GLSL
codeRepository: "https://github.com/maseko-lucky-9/Portofolio_Website"
runtimePlatform: "Cloudflare Workers"
keywords:
  - portfolio
  - vite
  - react
  - three.js
  - cloudflare-workers
  - seo
---

The site you're reading right now. Vite + React 18 SPA with a `@react-three/fiber` scroll-bound scene on the home, plus statically-generated content pages for `/blog/*` and `/answers/*` so crawlers and AI engines see real HTML instead of an empty `<div id="root">`.

## Architecture

```
┌─────────────────────────────────────────────────┐
│        Cloudflare Workers (single global)        │
│                                                  │
│   ┌────────────────────────────────────────┐    │
│   │  src/worker.ts (header middleware)     │    │
│   │  - HSTS, CSP, Permissions-Policy       │    │
│   │  - X-Robots-Tag: noai, noimageai       │    │
│   └─────────────────┬──────────────────────┘    │
│                     │                            │
│                     ▼                            │
│   ┌────────────────────────────────────────┐    │
│   │  [assets] - static files from dist/    │    │
│   │  ├── index.html       (SPA shell + 3D) │    │
│   │  ├── blog/<slug>/     (static HTML)    │    │
│   │  ├── answers/<slug>/  (static HTML)    │    │
│   │  ├── projects/<slug>/ (static HTML)    │    │
│   │  ├── sitemap.xml                       │    │
│   │  ├── rss.xml                           │    │
│   │  └── assets/*.js, *.css, *.woff2       │    │
│   └────────────────────────────────────────┘    │
└─────────────────────────────────────────────────┘
```

## Build pipeline

```
vite build
  -> Vite + Rollup -> dist/index.html + chunked assets
                       (vendor splits: react, three, radix, motion, monaco)
node scripts/build-static-pages.mjs
  -> reads content/{blog,answers,projects}/*.md via unified + remark
  -> writes dist/<kind>/<slug>/index.html with JSON-LD per page
  -> emits dist/content-manifest.json
node scripts/build-sitemap.mjs
  -> static routes + manifest -> dist/sitemap.xml
node scripts/build-rss.mjs
  -> manifest -> dist/rss.xml
node scripts/inject-verification.mjs   # GSC + Bing tokens
node scripts/inject-fingerprint.mjs    # build identifier for theft detection
```

## SEO posture

- robots.txt explicitly allow-lists 16 AI bots (GPTBot, ClaudeBot, PerplexityBot, ...) with `Crawl-delay`; denies 14 SEO data-aggregators (Ahrefs, Semrush, ...).
- Cloudflare WAF (codified as Terraform in `infra/cloudflare/`) blocks empty UAs, challenges scripted UAs, blocks datacenter ASNs on HTML routes.
- AI training opt-out via `<meta robots noai, noimageai>` + `X-Robots-Tag: noai` + `/.well-known/tdmrep.json`.
- Per-page JSON-LD: Person + ProfessionalService on `/`, BlogPosting on `/blog/*`, SpeakableArticle on `/answers/*`, CreativeWork + SoftwareSourceCode on `/projects/*`, BreadcrumbList everywhere.

## Bundle budgets

Enforced by `size-limit` in CI (`.github/workflows/bundle-size.yml`):

| Chunk | Limit | Actual |
|---|---|---|
| main JS (app code) | 90 KB gz | ~78 KB |
| react-vendor | 60 KB gz | ~53 KB |
| three-vendor | 300 KB gz | ~277 KB |
| radix-vendor | 35 KB gz | ~31 KB |
| motion-vendor | 30 KB gz | ~25 KB |
| CSS | 40 KB gz | ~35 KB |

## What's deliberately NOT here

- **Full Vite + Puppeteer prerender of every route** — collides with the R3F home scene (frame-0 black canvas in headless Chromium). Deferred unless the 3D scene becomes optional.
- **Server-side rendering** — Workers Assets serves prerendered HTML for content pages; the SPA hydrates `/` on the client. No Node SSR server to manage.
- **External analytics** — Plausible self-hosted on the [homelab cluster](/projects/homelab-kubernetes); no Google Analytics.

## See also

- [Repo](https://github.com/maseko-lucky-9/Portofolio_Website)
- [/answers/argocd-vs-flux-2026](/answers/argocd-vs-flux-2026)
- [/blog/welcome-to-the-blog](/blog/welcome-to-the-blog)
