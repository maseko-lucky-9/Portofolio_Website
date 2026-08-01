# ADR 005 — Self-hosted Umami for first-party analytics

- Status: **Accepted**
- Date: 2026-08-01
- Plan: `~/.claude/plans/i-want-to-add-moonlit-hejlsberg.md`
- Supersedes: the "no analytics, deliberately" position taken in `724bdcf`

## Context

`724bdcf` (2026-07-31) removed Plausible. The reasoning held — the site had never been registered against a Plausible account, so it recorded literally nothing, and Plausible Cloud is a paid subscription. But it left the site with **zero** visibility, which is the wrong end state for a portfolio whose purpose is a job search.

Five questions need answering: how many people visited and how many were unique; which page they landed on; where they came from (LinkedIn, GitHub, a recruiter's email, Google); rough country/device breakdown; and which outbound links got clicked.

Constraints set up front: free, self-hosted on the existing homelab MicroK8s cluster, an existing tool's dashboard rather than a hand-built one, and first-party/cookieless.

## Decision

Run **Umami v3.2.0** self-hosted in the homelab cluster, backed by its own Postgres, published to the internet through a **dedicated Cloudflare Tunnel** at `t.thulanimaseko.co.za` that is path-scoped to exactly two endpoints. The dashboard stays Tailscale-only.

The browser talks to that hostname **directly**. The site's CSP gains one self-owned origin in `script-src` and `connect-src`.

Umami answers four of the five questions out of the box (visitors/unique, Entry Pages, referrers + UTM, country/device/browser/OS). Outbound clicks are not captured by any tool without help, so `portfolio-ui/public/outbound.js` adds a delegated click listener.

## Alternatives considered

| Option | Pros | Cons | Verdict |
|---|---|---|---|
| **Umami v3, self-hosted** | MIT, no feature gating, mature dashboard, Entry Pages report, Postgres-only, retains history indefinitely | Outbound clicks need our own click handler | **Chosen** |
| Cloudflare Web Analytics | Free, zero infra, no cookies | **No custom events at all** — cannot answer outbound clicks. Third-party script. No unique-visitor metric | Rejected |
| Counterscale (Workers + Analytics Engine) | Cloudflare-native, no servers, free tier | **No custom events at all** (open issue #200). 90-day retention cap. Unmerged bug PRs since 2025-12 | Rejected |
| Plausible Community Edition | Only tool with *automatic* outbound tracking | Postgres **+ ClickHouse**, ≥2 GB RAM, requires SSE4.2 CPU, CE ships only basic bot filtering, releases ~2×/yr | Rejected — heaviest option for one feature we can write in 40 lines |
| GoatCounter | Single Go binary + SQLite, tiny | Per-link `data-goatcounter-click` attributes only; weaker events UI; copyleft EUPL | Rejected |
| Matomo / PostHog / Rybbit | Feature-rich | 3–6 containers, 4–16 GB RAM | Rejected — overkill for a portfolio |
| Build a custom collector on Workers + Analytics Engine | ~200 LOC, always-up edge ingest | Would have meant hand-rolling bot filtering, unique-visitor hashing, and a whole dashboard — i.e. rebuilding Umami | Rejected |

## The design that was built and thrown away

The first design routed the beacon through the site's existing Cloudflare Worker at `/u/*`, proxying to the tunnel, to keep the CSP single-origin. Three findings killed it, and they are worth recording because the idea is superficially attractive:

1. **The premise was false.** `worker.ts` already carried `connect-src 'self' https://api.indexnow.org`. The CSP purity being defended had been given up long before. (That directive was also dead — the only IndexNow caller is `scripts/indexnow-submit.mjs`, a Node build script CSP does not govern. It has been removed.)

2. **A Worker cannot set `CF-Connecting-IP`.** On a same-zone subrequest the Cloudflare edge *derives* that header from `x-real-ip`; whatever the Worker writes is discarded. Umami's session identity is `hash(websiteId + hostname + ip + userAgent)`, so a constant wrong IP collapses every visitor into a single session. The failure is invisible: `CF-IPCountry` still forwards correctly, so the country breakdown looks healthy while the headline unique-visitor number is wrong by an order of magnitude. **A wrong number that looks right is worse than no number.**

3. **Blast radius.** `worker.ts` is the `fetch` entry point for every request to the site. An analytics bug there is a site outage.

Going direct also means the zone's WAF rate limiting actually applies to the ingest hostname — a Worker same-zone subrequest bypasses it.

## Consequences

**Good**

- All five questions answered; history retained indefinitely in our own Postgres.
- No cookies and nothing written to the visitor's device, so no consent banner is required. No third-party processor sees the traffic.
- No inbound firewall ports opened; the tunnel is outbound UDP/443 only.
- Failures are loud rather than silent: the browser sees the real status code from Umami instead of a Worker's optimistic `202`.

**Bad / accepted**

- **Homelab downtime loses events.** Deliberate, having weighed it against edge collection. A daily heartbeat CronJob asserting non-zero events over 7 days, wired into the existing `KubeJobFailed` → Alertmanager → Telegram path, is what keeps that from going unnoticed for weeks.
- **Ad-blocker exposure.** A cross-origin tracker is blockable in a way a same-origin path is not. Mitigated by naming the host `t.` rather than something filter-list-shaped, and by `TRACKER_SCRIPT_NAME` if it becomes a problem.
- **One new public hostname.** Path-scoped by an *anchored* regex — cloudflared's `path` is an unanchored Go regex, so `^/(api/send|script\.js)$` rather than the bare paths is what actually keeps Umami's login off the internet.
- **The zone's single free WAF rate-limit rule is now spent** on the ingest hostname.
- **The site's published copy changed.** `content/projects/portfolio-website.md` claimed "no analytics of any kind"; that claim would have become false on deploy, so it now describes the first-party setup and discloses the transient IP use.
- **No backup yet.** The Postgres PVC is `microk8s-hostpath`, i.e. the node's root disk. Until it moves to a ZFS-backed `local-storage` PV inside the existing snapshot schedule, "retained indefinitely" means "until that disk dies".

## Guardrails added

- `src/seo/domainConsistency.test.ts` asserts every external `<script src>` origin across all three injection surfaces appears in `worker.ts`'s `script-src`, that the analytics origin is *also* in `connect-src` (script-src alone loads the tracker but blocks its beacon — silent), and that the website id is a real UUID rather than the shipped placeholder.
- `src/analytics/outbound.test.ts` imports `public/outbound.js` directly, so the tested code is the shipped code.
- `argocd/applications/umami.yaml` deliberately omits `resources-finalizer.argocd.argoproj.io`. That finalizer plus the root app's `prune: true` is the mechanism that previously cascade-deleted a live Postgres PVC during an ordinary git refactor (`portfolio-ui/k8s/argocd/app-of-apps.yaml:25-33`). Omitting it is what makes rollback non-destructive.
