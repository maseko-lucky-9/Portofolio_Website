# Two-repo workflow: homelab (dev) → Cloudflare (production)

Two repos, sharing one git history.

| | Repo A — production | Repo B — development |
|---|---|---|
| Repo | `maseko-lucky-9/Portofolio_Website` | `maseko-lucky-9/portfolio-homelab` |
| Branch | `main` | `homelab` |
| Deploys | frontend → Cloudflare Workers | full stack → homelab k8s `dev` namespace |
| Workflow | [cloudflare-cd.yml](../../.github/workflows/cloudflare-cd.yml) | [homelab-cd.yml](../../.github/workflows/homelab-cd.yml) |
| URL | `thulani-portfolio.masekotlg.workers.dev` | `dev.portfolio.homelab` + a Cloudflare preview URL |

Repo A keeps its name: the GHCR path `ghcr.io/maseko-lucky-9/portofolio_website/backend`
does not follow a rename, and five ArgoCD Applications hardcode the `repoURL`.

Repo B is **public**, like repo A. It holds the same code, so private would only cost
metered Actions minutes and lose free secret-scanning push protection on the repo where
experimental code lands.

## Day-to-day

```bash
# work on the homelab branch
git switch homelab
# ... make changes ...
git push homelab homelab                 # -> builds + deploys to the dev namespace
```

Then check it: `https://dev.portfolio.homelab`, plus the Cloudflare preview URL printed by
the `preview` job.

## Promotion

**Promotion is a pull request, not a fast-forward push.**

```bash
git push origin homelab:promote/$(git rev-parse --short HEAD)
gh pr create --repo maseko-lucky-9/Portofolio_Website \
  --base main --head promote/<sha> --title "promote: <subject>"
```

A direct `git push origin homelab:main` does not work and should not be attempted:

- **It breaks the moment the branches diverge.** `main` receives squash-merged PRs, each a
  new SHA that never existed on `homelab`, so `main` stops being an ancestor and the
  fast-forward is rejected permanently. Recovery is a force-push to production or a rebase
  that invalidates every already-deployed SHA.
- **It is a direct push to a protected branch**, which the repo's own workflow rule forbids.
- **It would skip the PR-only CI gates.** `lighthouse-ci.yml` and `bundle-size.yml` trigger on
  `pull_request` and would silently never run again.

## What the two environments do and do not share

The homelab is an **API and database sandbox**. It is not a frontend staging environment,
because almost nothing about the frontend path is shared:

| | Cloudflare (production) | Homelab (dev) |
|---|---|---|
| Build | `npm run build` — vite + 6 SEO scripts | `npm run build:app` — vite only ([Dockerfile](../../portfolio-ui/Dockerfile), resvg has no musl binary) |
| Server | Workers runtime + [worker.ts](../../portfolio-ui/src/worker.ts) | nginx 1.27-alpine |
| SPA fallback | `not_found_handling` in wrangler.toml | nginx `try_files` |
| CSP | `worker.ts` | a *different* policy in [nginx.conf](../../portfolio-ui/nginx.conf) |
| Backend | none | API + Postgres + Redis |

`/rss.xml`, `/sitemap.xml`, `/og/*`, the security headers and the CSP are production-only and
never exercised on the homelab. That is why `homelab-cd.yml` also runs
`wrangler versions upload` — the preview URL runs the real runtime against the real build, so
the thing actually shipped gets staged somewhere.

## Configuration that must differ

There is no "identical files in both repos" rule; these legitimately diverge.

`portfolio-ui/.env.production` **is not tracked, and must not be re-added.** `vite build`
loads it on *every* production build, so a homelab-shaped file (`VITE_USE_API=true`,
`VITE_API_URL=/api`) was silently baked into the Cloudflare bundle — which has no backend. The
contact form POSTed to a static host, took a bare `405`, and discarded every message.

Per-target values now come from:

- **Cloudflare** — the `env:` block in `cloudflare-cd.yml` (`VITE_USE_API: 'false'`), enforced
  by an assertion step that greps the built bundle and fails the deploy if it ships
  `useApi=true`.
- **Homelab** — `ARG` defaults in `portfolio-ui/Dockerfile`, overridden by `build-args` in
  `homelab-cd.yml`.

Production has no backend by design. The contact form detects this (`env.useApi === false`)
and hands the message to the visitor's mail client instead of dropping it. To give production
a real endpoint later, onboard a domain to Cloudflare Email Sending and add a
`POST /api/v1/contact/submit` route to `worker.ts` — `thulanimaseko.com` is not currently
resolvable, which is why the mailto path exists.

## One-time setup

**Repo B secrets** — mint NEW credentials; do not copy repo A's `HOMELAB_SSH_KEY`. That key is
an unrestricted shell for a user in the `docker` group (root-equivalent) with `kubectl exec`
into the prod namespace.

- `HOMELAB_DEV_SSH_KEY` — key for a **dedicated dev-only user** (`svc-deploy-dev`), constrained
  in `authorized_keys` with `restrict,from="100.64.0.0/10"` (kills PTY/agent/port forwarding,
  accepts only Tailscale-CGNAT sources). Two honest caveats, because earlier drafts of this
  doc overclaimed:
  - **No forced `command=`.** sshd substitutes a forced command for *every* client command,
    which would break both the scp upload and the inline deploy script this workflow sends.
    A forced-command dispatcher only becomes possible once the deploy logic moves server-side
    (see follow-up below).
  - **The user needs docker access** — the mirror step runs `docker pull/tag/push`. Docker
    group membership is root-equivalent on the host; the boundaries that actually contain
    this key are the RoleBound-to-`dev`-only kubeconfig and the `tag:ci-dev` Tailscale ACL
    (reach: this host only).
  - *Follow-up that removes both caveats:* let the cluster pull images straight from GHCR
    (make the two packages public, or add an imagePullSecret in `dev`) and delete the mirror
    step. The SSH script then shrinks to `sha256sum + kubectl`, needs no docker group, and
    becomes simple enough for a forced-command dispatcher. This also lets images be pinned by
    digest instead of the mutable `:dev` tag.
- `TS_DEV_OAUTH_CLIENT_ID` / `TS_DEV_OAUTH_SECRET` — Tailscale OAuth client tagged `tag:ci-dev`
- `CF_API_TOKEN` / `CF_ACCOUNT_ID` — for the preview upload

Also: protect the `homelab` branch, and enable secret scanning + push protection.

**Vault** — the dev `SecretStore` uses the `portfolio-dev` role. Its policy must be explicit;
a `kv/data/portfolio/*` wildcard (the obvious copy of prod's role) would hand the dev
namespace the live database credentials.

```hcl
path "kv/data/portfolio/dev"     { capabilities = ["read"] }
path "kv/metadata/portfolio/dev" { capabilities = ["read", "list"] }
```

All 15 properties must exist at `kv/portfolio/dev` — External Secrets Operator fails the
*entire* ExternalSecret if one `remoteRef.property` is missing:
`database-url`, `redis-url`, `redis-password`, `jwt-secret`, `jwt-access-expiry`,
`jwt-refresh-expiry`, `postgres-username`, `postgres-password`, `postgres-root-password`,
`github-client-id`, `github-client-secret`, `google-client-id`, `google-client-secret`,
`smtp-user`, `smtp-pass`.

The SecretStore also resolves `vault-tls-ca` in **its own** namespace:

```bash
kubectl -n dev create secret generic vault-tls-ca --from-file=ca.crt=<path-to-vault-ca>
```

**DNS** — `dev.portfolio.homelab` and `api.dev.portfolio.homelab` → homelab ingress.

## Related

- [PROD_FREEZE.md](PROD_FREEZE.md) — why the homelab `prod` namespace is frozen and how to
  retire it safely (its ArgoCD Application carries a cascade-delete finalizer).
