# Bot & Crawler Policy

Source of truth: `portfolio-ui/public/robots.txt`. This doc explains the *reasoning* behind each category so future edits stay coherent.

## Categories

### 1. Allow — major search engines
Googlebot, Bingbot, DuckDuckBot, Slurp (Yahoo), Baiduspider, YandexBot, Applebot.
**Why:** organic discovery. These bots respect robots.txt, rate-limit themselves, and provide measurable referral traffic.

### 2. Allow — social preview fetchers
Twitterbot, facebookexternalhit, LinkedInBot, Telegrambot, Discordbot, WhatsApp.
**Why:** unfurl previews when the site is shared. They fetch only the page being linked, never crawl.

### 3. Allow with Crawl-delay — AI engines
GPTBot, OAI-SearchBot, ChatGPT-User, ClaudeBot, Claude-Web, anthropic-ai, PerplexityBot, Perplexity-User, Google-Extended, Applebot-Extended, Amazonbot, Bytespider, CCBot, cohere-ai, Diffbot, FacebookBot.
**Why (AEO/GEO):** these are the bots that make the site *citable* in AI answers. The throttle (`Crawl-delay: 10s`, 20-30s for Bytespider/CCBot/Diffbot) prevents bandwidth abuse. If a specific engine is later found to harm rather than help, flip to Disallow.

### 4. Deny — SEO data-aggregation
AhrefsBot, SemrushBot, MJ12bot, DotBot, BLEXBot, DataForSeoBot, PetalBot, SeznamBot, serpstatbot, ZoominfoBot, Sogou, SiteAuditBot, BacklinksExtendedBot, Barkrowler.
**Why:** these crawlers resell the data to competitors (rank trackers, lead-gen tools). They consume bandwidth and provide no inbound value. Denying them is industry standard for personal sites.

### 5. Default `*`
`Disallow: /api/`, `/private/`, `/_well-known/internal/` only. Public surface is crawlable by unknown-but-benign bots — Cloudflare WAF picks up the slack on misbehavior.

## Defense layers (defense in depth)

| Layer | Mechanism | Catches |
|---|---|---|
| L1 | `robots.txt` | Polite bots that read it |
| L2 | `<meta name="robots" content="noai, noimageai">` | AI-training scrapers that respect the convention |
| L3 | `X-Robots-Tag: noai, noimageai` HTTP header | Same as L2 but for non-HTML resources |
| L4 | `/.well-known/tdmrep.json` + `tdm-policy.json` | EU TDM reservation (legal signal) |
| L5 | Cloudflare Bot Fight Mode | Headless / scripted browsers, TLS-fingerprint anomalies |
| L6 | Cloudflare WAF custom rules | Datacenter ASN block on HTML, UA substring matches |
| L7 | Fastify rate-limit on `/api/*` | Application-layer abuse on JSON endpoints |
| L8 | Honeypot field in contact form | Naive form-fillers |
| L9 | Content fingerprint comment | Post-hoc proof of theft → DMCA |

L1–L4 are voluntary; L5–L9 are enforced. Both stacks must work together — a misbehaving bot that ignores robots.txt is still blocked at L5.

## Cloudflare WAF custom rules (to configure in dashboard)

These can't be expressed in `robots.txt`. Configure in the Cloudflare dashboard under **Security → WAF → Custom rules**:

1. **Block empty/missing User-Agent on HTML** — `http.request.uri.path` matches `^/$|\.html$` AND `http.user_agent` eq `""` → Block.
2. **Managed challenge on known scripted UAs** — `http.user_agent` contains any of `scrapy`, `python-requests`, `Go-http-client`, `node-fetch`, `Java/`, `okhttp/`, `Apache-HttpClient/`, `libwww-perl`, `aiohttp`, `Postman` → Managed Challenge. Override: allow on `/api/health`.
3. **Datacenter ASN block on HTML** — `ip.geoip.asnum` in `{14618 16509 15169 8075 14061 16276 24940 19527}` AND `http.request.uri.path` matches `^/$|\.html$` AND `cf.client.bot` not_in `{verified}` → Block.
4. **Rate limit HTML** — 60 req/min per IP on `^/$|\.html$` → Block for 10 min.
5. **Rate limit API** — 30 req/min per IP on `/api/*` → Block for 5 min.

Verify after each deploy with:
```
curl -A "AhrefsBot" -I https://thulanimaseko.com/        # expect 403
curl -A "Googlebot/2.1" -I https://thulanimaseko.com/    # expect 200
curl -A "python-requests/2.31" -I https://thulanimaseko.com/  # expect challenge page
```
