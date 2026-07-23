# Portfolio Roadmap & Skills-Demonstration Report

**Date:** 2026-07-23 · **Owner:** Thulani Maseko · **Positioning:** Senior Backend & DevOps / Kubernetes Engineer
**Repo:** `career/portfolio-website` · **Branch reviewed:** `homelab`

> Verdict in one line: **the shell is production-grade and already demonstrates senior skill; the
> substance it points to is 1-of-4 real. Fix the credibility gap before adding any new feature.**

> **Decisions locked (2026-07-23):** (1) repoint dead cards to existing repos where possible;
> (2) audience = job-seeking, weeks not days; (3) positioning = full-stack senior (keep .NET *and*
> platform/DevOps, but every headline claim must be verifiable). See §5 for the grounded disposition
> — repointing turned out to be only partly feasible (§5a).

---

## 1. Executive summary

This portfolio is not a beginner project. The infrastructure *is* the skill demonstration:
self-hosted MicroK8s + ArgoCD GitOps, a two-repo dev→prod split (homelab dev / Cloudflare prod),
99 tests (49 unit + 50 E2E), a 9-layer bot policy, Lighthouse/bundle-size CI gates, and a
build-time SEO/AEO content pipeline. For a DevOps/K8s role, that stack is the strongest asset on
the site — stronger than any prose claim.

But the **Projects section makes verifiable claims that currently fail verification**, and that is
the one thing on a senior portfolio that does active damage. See §3.

**Roadmap call: REVISE, then CONTINUE.** Don't start new features. Spend the next cycle closing the
credibility gap (§5, P0). Everything else is genuinely "continue where you left off."

---

## 2. Current-state scorecard

| Area | State | Evidence |
|---|---|---|
| Frontend design/UX | ✅ Strong | WebGL aurora shader w/ reduced-motion fallback, glassmorphism, dark/light, a11y (skip-link, aria, focus-visible) |
| Backend API | ✅ Solid | Fastify 5 + Prisma + Postgres + Redis cache + BullMQ, Swagger, JWT access/refresh |
| Infra / GitOps | ✅ Senior-grade | MicroK8s, ArgoCD auto-sync, Kustomize overlays, Helm, HPA/PDB/NetworkPolicy |
| CI/CD | ✅ Real gates | Lighthouse CI (SEO≥95, a11y≥95, perf≥90), bundle-size budgets, Trivy, gitleaks/trufflehog |
| SEO / AEO | ✅ Differentiator | static prerender pipeline, JSON-LD per kind, sitemap/RSS, L1–L9 bot policy |
| Testing | ✅ Good | 99 tests; Three.js mocked in jsdom |
| **Projects substance** | 🔴 **Broken** | 3 of 4 showcased repos 404 (§3) |
| Content depth | 🟡 Thin | 1 blog post, 1 answer, 2 project write-ups |
| TypeScript hygiene | 🟡 Debt | backend builds with `tsc \|\| true` — type errors suppressed (README §Dev Notes) |
| Homelab manifests | 🟡 Drift | 4 fixes applied on-cluster, not in git (README §Known Homelab Configuration) |
| Profile photo | 🟡 Check | `personal.ts` points at `/brand/photo/thulani-512.jpg` — verify it ships in `dist/` |

---

## 3. 🔴 The credibility gap (P0 — do this first)

`portfolio-ui/src/data/projects.ts` showcases four projects. GitHub reality (checked 2026-07-23):

| Project | Link in data | Repo exists? | Ships specific metrics? |
|---|---|---|---|
| Production K8s Reference Architecture | `maseko-lucky-9/k8s-ref` | ✅ **yes** | p95 < 200ms, zero-touch deploys |
| AWS EKS Terraform Module | `maseko-lucky-9/terraform-aws-eks-opinionated` | ❌ **404** | "skip 2 weeks", Terraform Registry validation |
| .NET Microservices + Kafka | `maseko-lucky-9/dotnet-events` | ❌ **404** | ">5k msg/sec, zero loss" |
| RAG Pipeline + MCP Server | `maseko-lucky-9/rag-mcp-demo` | ❌ **404** | "recall@10 > 85%, p95 < 500ms" |

**Why this is the top risk:** a broken link on a senior portfolio is worse than no link — it reads
as either dishonesty or abandonment. The metrics are precise enough to look measured, but there's
nothing behind three of them to measure. A recruiter who clicks and hits a 404 discounts *all four*.

**This is not a design problem. It's a substance problem, and it's the whole point of "demonstrate
the skills."** The site can't showcase work that doesn't exist yet.

---

## 4. Roadmap verdict: revise or continue?

```
                        REVISE (block new work)          CONTINUE (resume as-is)
  ┌───────────────────────────────────────────┬──────────────────────────────────────┐
  │ • Projects section: make claims true       │ • Design system / aurora / theming    │
  │ • Backend TS: stop suppressing errors      │ • SEO/AEO content pipeline (add posts) │
  │ • Homelab manifest drift → commit fixes    │ • Test suite (extend, don't rebuild)   │
  └───────────────────────────────────────────┴──────────────────────────────────────┘
```

The instinct to "add features to demonstrate skills" is the trap. You already have the features.
The gap is **proof**. Revise for credibility, then continue the content/polish track you were on.

---

## 5. Executable next steps

Ordered. Each is a discrete, shippable unit via your normal `/ship` flow. Lazy-first: the smallest
change that removes the risk beats the impressive one that doesn't.

### 5a. Repoint feasibility — the honest finding

You chose "repoint to existing repos." Inspecting the candidates (2026-07-23) shows repointing only
half-works, because a link is only useful if the target is **public + has a README + matches the claim**:

| Dead card | Best existing candidate | Blocker | Disposition |
|---|---|---|---|
| `terraform-aws-eks-opinionated` | *(none exists)* | No AWS/EKS Terraform repo at all. `homelab-infra` is Shell + **private**. | **Build small or pull.** Cannot honestly repoint. |
| ~~`dotnet-events`~~ → **`fraud-rule-engine`** | `fraud-rule-engine` (Java 21 / Spring Boot 4, public, **has README + ADRs + Kafka + Python sim**) | — | ✅ **DONE (2026-07-23)** — repointed; card rewritten honestly (no fabricated metrics); Java added to Skills beside C#. Turned out to be a strong, real repo, not the "wrong stack" first feared. |
| `rag-mcp-demo` (RAG+MCP) | `pdf-ingestion-pipeline-` (Python, public) / `gemini-mcp-server` (Python) | pipeline repo has no README; `gemini-mcp-server` is **private**. | **Strongest repoint** — make one public, add a README, rewrite metric to what's real. |

Private repos (`gemini-mcp-server`, `llm-eval-harness`, `homelab-infra`, `SecureServiceKit`) are, to a
recruiter, identical to a 404. Making one public is an outward-facing decision — **your call, per repo.**

### P0 — Close the credibility gap (this week)
- [ ] **Per dead card, pick one:** (a) repoint to a *public* repo with a README that backs the claim,
      (b) build a minimal-but-real repo, or (c) pull the card. Do not leave a 404 live one more day.
- [ ] **RAG/MCP card** — best repoint: make `gemini-mcp-server` public + add a README, OR flesh out
      `pdf-ingestion-pipeline-`, then rewrite the `impact:` line to the *measured* number (drop
      "recall@10 > 85%" unless you actually ran that benchmark).
- [ ] **.NET+Kafka card** — no matching public repo. Either build a small `dotnet-events` demo (aligns
      with the .NET-95% skill claim you're keeping) or pull the card. `fraud-rule-engine` is Java, not a
      drop-in.
- [ ] **EKS-Terraform card** — no existing repo. Pull it, or build a genuinely small opinionated module.
      Don't ship "skip 2 weeks of bootstrapping" for code that doesn't exist.
- [ ] Audit every remaining `impact:` string against something reproducible. If a number isn't in a
      linked public repo you can defend in an interview, it's a liability — cut it.

### P1 — Stop lying to the compiler (this month)
- [ ] Remove `tsc || true` from the backend build; fix the type errors it's hiding
      (README flags "type errors exist in several service files"). A DevOps portfolio that ships
      known-broken types undercuts the whole pitch.
- [ ] Commit the 4 on-cluster homelab fixes into the manifests (ingress class, NetworkPolicy
      selector, Redis protected-mode, Postgres secret runbook). Right now the git repo doesn't
      reproduce the running cluster — the one claim GitOps must never break.

### P2 — Continue the content track (ongoing)
- [ ] Add 2–3 `content/answers/*.md` and `content/blog/*.md` posts. The AEO pipeline is built and
      idle; content is the only input it's missing. This is the cheapest credibility-per-hour on the
      site — each post is a skill demonstration that needs no new code.
- [ ] Verify `profile.jpg` / `thulani-512.jpg` actually ships in `dist/` (README lists it as an
      unresolved action item).

### P3 — Nice-to-have (only after P0–P2)
- [ ] Wire the "in-progress" K8s ref-arch case study to a live Grafana/observability screenshot set.
- [ ] Consider a `/uses` or live-metrics page pulling real homelab SLOs — but only if the data is real.

---

## 6. 🔪 Terrifying questions

> **Answered 2026-07-23:** Q1 → repoint where feasible (see §5a — only partly possible).
> Q4 → job-seeking, weeks. Q5 → full-stack senior, keep .NET + platform but every claim verifiable.
> **Q2 and Q3 still open and still blocking:**

**Q1 — The 404s. Build or bluff?**
Three showcased repos don't exist. Do you (a) build `terraform-aws-eks-opinionated`, `dotnet-events`,
`rag-mcp-demo` for real, (b) pull them and ship 1 honest project, or (c) point them at *existing*
repos (you have `homelab-infra`, `gemini-mcp-server`, `pdf-ingestion-pipeline`, `fraud-rule-engine`,
`llm-eval-harness` — several map closely)? **Nothing else in this report matters until this is answered.**

**Q2 — Are the metrics measured or aspirational?**
">5k msg/sec", "recall@10 > 85%", "p95 < 200ms" — is any of this benchmarked, or written to *sound*
benchmarked? If a recruiter asks "how did you measure 5k msg/sec?" in an interview, do you have an
answer? If not, these numbers are downside-only.

**Q3 — What is "the project that we're being worked on"?**
This report assumes it's the portfolio + its showcased projects. If you meant a *separate* flagship
project meant to headline the site, tell me which repo — the roadmap changes.

**Q4 — Who is the audience, and what's the deadline?**
Recruiters for a specific role? Freelance clients (the code says "Prudentia Digital freelance
launch")? A job application due on a date? The P0/P1/P2 ordering assumes "job-seeking, weeks not
days." A hard interview date this week flips the priority to "make it honest today, polish later."

**Q5 — Is the .NET/C# positioning still current?**
Skills lead with .NET 9 / C# at 95%, but every recent repo and all the site infra is
TypeScript/K8s/Python. Are you targeting .NET backend roles, or has the real center of gravity moved
to platform/DevOps? The Skills weighting should match the roles you're actually applying to.

---

## 7. What NOT to do

- Don't add a new section, animation, or framework to "show more skills." The site already shows
  more than the projects prove.
- Don't rebuild the test suite or design system — they're fine. Extend, don't restart.
- Don't ship one more day with three live 404s.
