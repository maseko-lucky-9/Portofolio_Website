# Aura "Signal Field" → portfolio-ui — task ledger

Branch: `feat/aura-signal-field` (from `main` @ 001ebaf) · Plan: `docs/superpowers/plans/2026-09-06-aura-signal-field.md`
**No push, no PR, no deploy until the user's explicit go-ahead.**

## Tasks
- [x] T1  Branch, stable spec copy (`~/.claude/plans/aura-signal-field-src/`), todo ledger
- [x] T2  Fonts in (Spectral + Public Sans Variable), field slot + hand-off recipe for the user
- [ ] T2b Vendor the user's Unicorn runtime version + their scene export  *(blocked on user)*
- [x] T3  Tokens, shadcn alias table, `src/styles/aura.css`  *(opens intentional red window)*
- [x] T4  `FieldBackground` (runtime-loaded, CSS fallback, bail-outs)
- [x] T5  Navbar pill, TrustStrip marquee, `useSpotlight`
- [x] T6  HeroSection + OperatorSection (colour portrait)
- [x] T7  Restyle-only: Skills, SkillsRadar, Experience (layouts frozen)
- [x] T8  Data (services, faq) + Work, Services, FAQ, Contact slab, Footer
- [x] T9  Page shell: Index, App, index.html, manifest, ChatWidget
- [x] T10 Deletions + dependency hygiene
- [x] T11 Budget gate (size-limit)
- [x] T12 Unit sweep green
- [x] T13 E2E rewrite + field.spec + design.spec  *(closes the red window)*
- [x] T14 Playwright full-suite opt-in + nginx CSP alignment
- [x] T15 Docker trial — build, run, full e2e against the container (Phase 1 fallback / Phase 2 exact field)
- [x] T16 Lighthouse gate
- [x] T17 Docs: `.impeccable.md` rev 6, ADR 008, README runbook
- [ ] T18 Close-out — present evidence, stop

## Gate results

All run on `feat/aura-signal-field`, Phase 1 (no scene vendored — the field
renders its CSS gradient, and the two scene-running e2e tests skip).

| Gate | Result |
| --- | --- |
| `tsc -b --noEmit` | clean |
| `eslint .` | 0 errors, 16 warnings (all pre-existing shadcn fast-refresh) |
| `prettier --check` | all matched files clean |
| `vitest run` | **27 files, 250 passed, 2 skipped** (the 2 are pre-existing `TODO(test-debt)`) |
| `size-limit` | 5/5 under budget — main JS 34.9/90 KB · react 73.6/78 · radix 11.8/35 · motion 21.2/30 · **CSS 16.4/40 KB** (was 36.4) |
| e2e, local preview | **100 passed, 0 failed, 30 skipped** (chromium + mobile) |
| docker build | image `portfolio-ui:aura` built from `portfolio-ui/Dockerfile` |
| container health | `curl localhost:18080/health` → `healthy` |
| container headers | CSP + X-Frame-Options + nosniff + Referrer-Policy present on **both** the document and hashed assets |
| **e2e vs container** | **98 passed, 0 failed, 32 skipped** (`E2E_BASE_URL=http://localhost:18080 E2E_FULL_SUITE=1`) |
| container logs | 0 error/emerg/crit lines |
| contrast audit | PASS — 951 nodes, every text node clears its AA floor |
| focus audit | PASS — every visible interactive element shows a ≥2px ring |
| overflow | 0 px at 375 / 768 / 1024 / 1440 |
| Lighthouse | perf **1.00** · a11y 1.00 · best-practices 0.96 · seo 1.00 · LCP **530 ms** · CLS **0.000** · TBT 0 |

Lighthouse budgets are perf ≥0.90, LCP ≤2000 ms, CLS ≤0.05 (all error-level).
The feared CLS from the Spectral swap did not materialise, so no font preload
was added.

**Re-run required in Phase 2** (after the Unicorn export lands): Lighthouse
(the runtime is ~39 KB gzip of extra work at idle) and the two `field.spec.ts`
scene tests, which must go from skipped to passed.

## Review
_(written at T18)_
