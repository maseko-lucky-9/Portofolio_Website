# Outstanding Manual Tasks — Execution Runbook

**Compiled:** 2026-07-26 · **Repo:** `career/portfolio-website` · **Branch:** `main` (clean)
**Audience:** you, executing outside the session that wrote this. Self-contained — no prior context needed.

Every item below was **verified against the live repo/cluster/DNS on 2026-07-26**, not inferred from
older docs. Where an existing doc is wrong, this runbook says so and supersedes it.

---

## 0. State check — what is NOT outstanding

Do not redo these. Verified already done:

| Previously flagged | Verified state (2026-07-26) |
|---|---|
| 3 dead project cards (404 GitHub links) | ✅ Fixed. Cards are now `k8s-ref`, `n8n-self-hosting`, `fraud-rule-engine`, `reelsmith` — **all 4 repos exist and are public**. |
| Fabricated impact metrics | ✅ Addressed in the truthfulness pass (commit `7a71f6c`). |
| Backend `tsc \|\| true` suppressing errors | ✅ Fixed — `portfolio-api/package.json` build is now plain `tsc`. |
| Profile photo missing | ✅ Present — 9 files under `portfolio-ui/public/brand/photo/` (avif/webp/jpg × 256/512/1024). |
| `infra/cloudflare/terraform.tfvars` leaking a token | ✅ Not tracked; ignored via `infra/cloudflare/.gitignore:5`. |

---

## Task index (execute in this order — M1 gates M2)

| # | Task | Effort | Needs |
|---|---|---|---|
| **M1** | Onboard custom domain `thulanimaseko.com` | 30–60 min | Domain purchase, Cloudflare dash |
| **M2** | Search Console + Bing + IndexNow | 30 min + 48h wait | **M1 done**, GitHub repo access |
| **M3** | Fix the vacuous TypeScript gate (17 real errors hidden) | 1–3 h | Local dev only |
| **M4** | Reconcile the stale homelab drift section | 30 min | SSH to homelab |
| **M5** | Verify/apply Cloudflare WAF rules | 20 min | CF API token |
| **M6** | Write content posts (AEO pipeline is built and idle) | ongoing | Writing time |

**Highest leverage:** M3 (a CI gate that silently enforces nothing) and M1→M2 (a whole SEO pipeline
built, shipped, and currently unverifiable). If you only do one thing, do **M3** — it is free, local,
and it is the same failure class as the PII-gate defect: *a control that looks green while checking nothing.*

---

## M1 — Onboard the custom domain `thulanimaseko.com`

### Why this is first
`dig +short thulanimaseko.com A` returns **empty** — the domain does not resolve. This blocks:
- All of M2 (Search Console verification targets that exact hostname).
- Canonical URLs / sitemap correctness (`docs/seo/` runbooks assume it).
- The real contact-form endpoint (production currently falls back to `mailto:` **by design** because
  there is no backend — see `docs/deployment/TWO_REPO_WORKFLOW.md`).

Production today serves from `https://thulani-portfolio.masekotlg.workers.dev` (verified **HTTP 200**).

### Steps
1. **Confirm you own the domain.** If not purchased, buy `thulanimaseko.com` (Cloudflare Registrar is
   simplest — it lands in the same account as the Worker).
2. **Add the zone to Cloudflare:** dash.cloudflare.com → *Add a site* → `thulanimaseko.com`.
3. **Point the nameservers** at the two Cloudflare NS records shown. If bought via Cloudflare
   Registrar, this is automatic. Propagation: minutes to 24 h.
4. **Attach the domain to the Worker:** Workers & Pages → `thulani-portfolio` → *Settings* →
   *Domains & Routes* → **Add custom domain** → `thulanimaseko.com`. Add `www` too if you want it.
   Cloudflare provisions the TLS cert automatically.
5. **Decide the canonical host** (apex vs `www`) and redirect the other. Pick **apex**
   (`thulanimaseko.com`) — it is what every doc in `docs/seo/` already assumes.

### Verify
```bash
dig +short thulanimaseko.com A
curl -s -o /dev/null -w "%{http_code}\n" https://thulanimaseko.com/
curl -s https://thulanimaseko.com/sitemap.xml | head -5
```
Expect: non-empty A record, `200`, valid sitemap XML.

### Then update these (code, not dashboard)
- Any hardcoded `thulani-portfolio.masekotlg.workers.dev` — notably the smoke-check
  `DEPLOYED_URL` at `.github/workflows/cloudflare-cd.yml:147`.
- `lighthouserc.json` target URLs, if they point at the workers.dev host.
- Re-run `npm run build --workspace=portfolio-ui` so `sitemap.xml` / `rss.xml` emit the new origin.

> **If you decide NOT to buy the domain:** that is a legitimate choice — but then M2 is permanently
> blocked, and you should rewrite `docs/seo/*.md` to target the `workers.dev` host so the runbooks
> stop describing a system that cannot exist. Do not leave them pointing at a dead domain.

---

## M2 — Search Console + Bing + IndexNow  *(blocked until M1 is green)*

### ⚠️ The existing runbook is wrong — read this before following it
`docs/seo/search-console-setup.md` step 4 says to store the token via:
```
echo "<token>" | npx wrangler secret put VITE_GSC_VERIFICATION   # ❌ DOES NOT WORK
```
**Why it fails:** `wrangler secret` creates a **runtime** binding. The token is consumed by
`portfolio-ui/scripts/inject-verification.mjs`, which runs at **build time** (after `vite build`, per
the pipeline in `README.md`). A runtime secret is not in `process.env` during the build, so the script
logs `no tokens in env — skipping` and ships **no meta tag**. Verification then fails with no error.

**Correct mechanism:** a build-time env var in the CD workflow. The script accepts any of
`GSC_VERIFICATION`, `VITE_GSC_VERIFICATION`, or `CF_VAR_GSC_VERIFICATION`
(`inject-verification.mjs:36-38`).

**Second trap:** `wrangler deploy` **rebuilds `dist`** (that is what commit `406afc7` fixed). So the
env block must be added to **both** the *Build portfolio-ui* step (`cloudflare-cd.yml:79`) **and** the
*deploy* step (`:140`) — exactly the lockstep pattern already used for `VITE_USE_API`. Adding it to
only one silently produces an unverified site.

### Steps
1. **Google Search Console** → <https://search.google.com/search-console/welcome> → *Add property* →
   **URL prefix** → `https://thulanimaseko.com/` → verification method **HTML tag** → copy the
   `content` value (the token only, not the whole tag).
2. **Store it as a GitHub Actions variable** (not a secret — it is a public meta tag, and secrets are
   masked in ways that complicate debugging):
   ```bash
   gh variable set GSC_VERIFICATION --repo maseko-lucky-9/Portofolio_Website --body "<token>"
   ```
3. **Wire it into both steps** of `.github/workflows/cloudflare-cd.yml` — add to the `env:` block at
   line ~79 **and** the one at line ~140:
   ```yaml
   GSC_VERIFICATION: ${{ vars.GSC_VERIFICATION }}
   BING_VERIFICATION: ${{ vars.BING_VERIFICATION }}
   ```
   Commit via PR (main is protected; see §Ship notes).
4. **Redeploy** (merging the PR triggers it). Then confirm the tag actually shipped:
   ```bash
   curl -s https://thulanimaseko.com/ | grep -i 'google-site-verification'
   ```
   **Do not click Verify until this grep returns a line.** That grep is the whole point — it is the
   check the original runbook lacked.
5. Back in GSC → **Verify** → then *Sitemaps* → submit `https://thulanimaseko.com/sitemap.xml`.
6. **Bing:** <https://www.bing.com/webmasters> → *Import from Google Search Console* (fastest path).
   If import fails, repeat steps 1–4 with `BING_VERIFICATION` (meta name `msvalidate.01`).
7. **IndexNow:** key `00b81fad70da4ae7acdbfd756d25c510`, already served at
   `/00b81fad70da4ae7acdbfd756d25c510.txt`. Confirm it resolves on the new domain, then paste into
   Bing Webmaster → IndexNow.

### Verify (after 48 h)
- [ ] Both properties verified.
- [ ] Sitemap discovered, ≥ 1 URL listed.
- [ ] `site:thulanimaseko.com` returns ≥ 1 result on Google and Bing.
- [ ] No coverage errors.

If nothing indexes after 14 days: check `robots.txt`, canonical tags, and Cloudflare WAF logs for
blocked Googlebot/Bingbot (M5 tightened bot rules — a false positive there would freeze indexing).

### Finally
Fix `docs/seo/search-console-setup.md` step 4 so the next person does not hit the same wall.

---

## M3 — Fix the vacuous TypeScript gate  ⭐ highest value, zero external dependencies

### The defect
`.github/workflows/frontend-ci.yml:65` runs:
```bash
npx tsc --noEmit
```
`portfolio-ui/tsconfig.json` is a **solution-style** config: `"files": []` plus `references` to
`tsconfig.app.json` / `tsconfig.node.json`. A bare `tsc --noEmit` on that config compiles
**zero files** and exits **0, always**. The "TypeScript check" in CI has never checked anything.

**Measured 2026-07-26:**
| Command | Result |
|---|---|
| `npx tsc --noEmit` (what CI runs) | exit 0, **0 files checked** |
| `npx tsc -b --noEmit` (real check) | **17 errors** |

This is the same class as the PII-gate defect: a control that reports green while enforcing nothing.

### Steps
1. **Reproduce:**
   ```bash
   cd portfolio-ui
   npx tsc -b --noEmit 2>&1 | grep -E 'error TS' | head -20
   ```
2. **Triage.** Most known errors are `TS2786` "cannot be used as a JSX component" in `App.tsx` and
   `auth/LoginForm.tsx` — a classic **duplicate `@types/react`** problem (two copies resolving at
   different versions, one hoisted to the monorepo root). Confirm before fixing anything by hand:
   ```bash
   npm ls @types/react @types/react-dom
   ```
   If two versions appear, the real fix is deduplication, **not** editing 17 call sites:
   ```jsonc
   // package.json (monorepo root)
   "overrides": { "@types/react": "^18.3.x", "@types/react-dom": "^18.3.x" }
   ```
   then `rm -rf node_modules package-lock.json && npm install`. Re-run step 1 — the count usually
   collapses to near zero. Fix whatever genuinely remains.
3. **Make the gate real.** In `.github/workflows/frontend-ci.yml:65`, replace
   `npx tsc --noEmit` with `npx tsc -b --noEmit`.
4. **Add a local script** so it is runnable without remembering the flag —
   in `portfolio-ui/package.json`: `"typecheck": "tsc -b --noEmit"`.

### Verify — prove the gate now fails when it should
Do not skip this; it is what distinguishes a fixed gate from a differently-broken one.
```bash
cd portfolio-ui
npx tsc -b --noEmit && echo "CLEAN"          # must print CLEAN
# now break it on purpose:
echo 'const x: number = "nope";' >> src/main.tsx
npx tsc -b --noEmit || echo "GATE CAUGHT IT" # must print GATE CAUGHT IT
git checkout src/main.tsx                     # revert the sabotage
```
A gate that cannot be made to fail is not a gate.

> **Ordering note:** land M3 as its own PR *before* M2's workflow edit. Once the gate is real it may
> surface errors in unrelated files, and you do not want that tangled with an SEO change.

---

## M4 — Reconcile the stale "Known Homelab Configuration" section

### The finding: the drift is already fixed; the doc is what's stale
`README.md:466` claims four fixes are "applied directly on the cluster (**not yet committed to
manifests**)". Verified against the repo — **3 of 4 are committed**, and the 4th is a soft item:

| README claim | Actual state in git |
|---|---|
| Ingress class not in manifests | ❌ Stale — `ingressClassName: public` is in `portfolio-api/k8s/base/ingress.yaml:37`, `overlays/dev/ingress-patch.yaml:16`, and both `portfolio-ui` overlays |
| NetworkPolicy has wrong namespace selector | ❌ Stale — `portfolio-api/k8s/base/networkpolicy.yaml:24-26` already uses `kubernetes.io/metadata.name: ingress` (fixed in `60a3d76`, `96733f4`) |
| Redis `protected-mode` not in ConfigMap | ❌ Stale — `portfolio-api/k8s/base/redis/configmap.yaml:51` already has `protected-mode no` |
| Postgres password → "document in runbook" | ⚠️ Soft — the hex-not-base64 rule *is* documented under §Secrets Setup |

The section also points at `overlays/homelab`, **which does not exist** — the overlays are `dev` and
`prod`.

A stale "known drift" section is worse than none: it tells a reader (or an interviewer) that your
GitOps repo does not reproduce your cluster, which is the one claim GitOps must never break — and here
it is not even true.

### Steps
1. **Confirm the live cluster matches git** (this is the part that needs your hands):
   ```bash
   ssh homelab-tailscale
   microk8s kubectl get ingress -A -o custom-columns=NS:.metadata.namespace,NAME:.metadata.name,CLASS:.spec.ingressClassName
   microk8s kubectl get networkpolicy -A
   microk8s kubectl get configmap redis-config -n prod -o yaml | grep -i 'protected-mode'
   ```
   Expect: ingress class `public`; NetworkPolicies **present** (README says they were deleted — if
   they are still missing, re-apply from git: `microk8s kubectl apply -k portfolio-api/k8s/overlays/prod`);
   `protected-mode no`.
2. **If ArgoCD shows drift**, reconcile toward git (git is the source of truth):
   ```bash
   microk8s kubectl get applications -n argocd    # look for OutOfSync
   ```
   Sync from the ArgoCD UI/CLI rather than hand-patching, so the cluster returns to matching the repo.
3. **Rewrite `README.md:466-476`.** Replace the drift table with either:
   - a one-line "cluster reconciled to manifests as of `YYYY-MM-DD`; no known drift", or
   - if step 1 finds *real* drift, a table listing only what is genuinely still uncommitted.
   Also fix or drop the `overlays/homelab` reference (correct paths: `overlays/dev`, `overlays/prod`).

### Verify
```bash
grep -n 'overlays/homelab' README.md   # expect: no matches
```
Plus: ArgoCD shows all Applications **Synced/Healthy**.

---

## M5 — Verify / apply Cloudflare WAF rules

`infra/cloudflare/waf.tf` defines layers L5–L7 of the bot policy. There is **no local `*.tfstate`**,
so either state is remote or the rules were never applied from this machine — unknown without checking.

### Steps
1. Check whether the rules exist live: Cloudflare dash → your zone → *Security* → *WAF* → *Custom rules*.
   (This only becomes fully meaningful once M1 puts the site on a real zone.)
2. If missing, apply:
   ```bash
   cd infra/cloudflare
   terraform init
   terraform plan -var-file=terraform.tfvars     # REVIEW the plan before applying
   terraform apply -var-file=terraform.tfvars
   ```
   `terraform.tfvars` already exists locally and is correctly gitignored — **never commit it**. It
   needs a scoped CF API token (Zone → WAF edit), not a global key.
3. Record the outcome in `docs/seo/bot-policy.md` so the L1–L9 table reflects reality.

### Verify
```bash
curl -s -I -A "GPTBot" https://thulanimaseko.com/ | head -3     # expect block/challenge per policy
curl -s -I -A "Googlebot" https://thulanimaseko.com/ | head -3  # MUST stay allowed
```
> The second command matters more than the first. A WAF rule that blocks Googlebot silently kills M2.

---

## M6 — Write content (pipeline is built and idle)

The static-render + JSON-LD + sitemap + RSS pipeline works and currently carries almost nothing:
`content/blog/` **1** post, `content/answers/` **1**, `content/projects/` **2**.

This is the cheapest credibility-per-hour left: each post is a skill demonstration that needs **zero
new code**.

### Steps
1. Create `portfolio-ui/content/<kind>/<slug>.md` where `<kind>` ∈ `blog` | `answers` | `projects`.
2. Required frontmatter:
   ```yaml
   ---
   title: "Post title"
   description: "One-paragraph summary — used in <meta description> + OG cards."
   datePublished: "2026-07-26T08:00:00+02:00"
   keywords: [kubernetes, gitops]
   # projects only:
   programmingLanguages: [TypeScript, Go]
   codeRepository: "https://github.com/..."
   runtimePlatform: "Kubernetes"
   ---
   ```
3. Body in GitHub-flavoured Markdown (code fences fine).
4. `npm run build --workspace=portfolio-ui` — the post, its index entry, `sitemap.xml`, and `rss.xml`
   all update automatically.

### Suggested first three (write what you have already lived — no research overhead)
- **answers/** — "Why my portfolio runs on MicroK8s instead of a managed cluster" (cost + learning trade-off).
- **blog/** — "A CI gate that checked zero files" — the M3 defect above. Genuinely interesting, and it
  demonstrates exactly the rigor an interviewer wants to see.
- **projects/** — a `fraud-rule-engine` write-up: deterministic-vs-AI decision boundary, transactional
  outbox, the Python red-team simulator.

### Verify
```bash
curl -s https://thulanimaseko.com/sitemap.xml | grep -c '<url>'   # count rises per post
```

---

## Ship notes (applies to every code change above)

`main` is protected — **PR only**, no direct pushes.

```bash
git checkout -b fix/<slug>
# ... edit ...
git add <specific files>        # never `git add -A` — docker-compose.ports.yml is untracked on purpose
git commit -m "fix: <what>"
git push -u origin fix/<slug>
gh pr create --base main --title "..." --body "..."
gh pr checks --watch
```

> **⚠️ Known trap — get formatting and size right in the FIRST commit.**
> Branch protection requires only **Lighthouse, Security Scan, gitleaks**. `Code Quality` (prettier)
> and `size` (size-limit) run but are **not required**, so auto-merge fires the moment the required
> checks pass — **stranding any fix commit you push afterwards**. Before pushing:
> ```bash
> cd portfolio-ui
> npx prettier --write "src/**/*.{ts,tsx,js,jsx,json,css}"
> npm run build && npx size-limit
> ```

**Two-repo topology:** `main` (remote `origin`) → Cloudflare production. Branch `homelab`
(remote `homelab`) → homelab k8s dev. After shipping to `main`, sync dev or the next promotion will
look like a regression:
```bash
git checkout homelab && git merge origin/main && git push homelab homelab:homelab
```

---

## Completion checklist

- [ ] **M1** `thulanimaseko.com` resolves, serves 200, Worker custom domain attached
- [ ] **M2** verification meta tag present in live HTML (grep-confirmed) → GSC + Bing verified → sitemaps submitted
- [ ] **M2b** `docs/seo/search-console-setup.md` step 4 corrected (build-time env, not `wrangler secret`)
- [ ] **M3** `tsc -b --noEmit` clean, CI updated, **sabotage test proves the gate fails**
- [ ] **M4** cluster confirmed synced; README drift section rewritten; no `overlays/homelab` references
- [ ] **M5** WAF rules confirmed live; **Googlebot confirmed NOT blocked**
- [ ] **M6** ≥ 3 new content posts live and in sitemap
