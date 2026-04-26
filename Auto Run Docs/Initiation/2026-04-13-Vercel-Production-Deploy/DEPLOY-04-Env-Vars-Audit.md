# Phase 04: Environment Variables Audit + TypeScript Type Safety

Every environment variable across both apps needs to be catalogued, validated, and reflected in TypeScript type definitions. Without this, a missing variable in the Vercel dashboard or homelab K8s ExternalSecrets will silently cause undefined values at runtime. This phase produces an authoritative env var reference document and ensures the frontend's TypeScript env type definitions are complete.

## Tasks

- [ ] Audit `portfolio-ui/src/vite-env.d.ts` against `portfolio-ui/src/config/env.ts` and add any missing VITE_ type definitions:
  - Read both files; `env.ts` is the source of truth for what the app actually reads
  - Current `vite-env.d.ts` likely only declares `VITE_API_URL`, `VITE_API_VERSION`, `VITE_WS_URL` — add all others that `env.ts` references: `VITE_APP_NAME`, `VITE_APP_DESCRIPTION`, `VITE_USE_API`, `VITE_ENABLE_MSW`, `VITE_ENABLE_ANALYTICS`, `VITE_ENABLE_CODE_EXECUTION`, `VITE_ENABLE_COMMENTS`, `VITE_DEBUG`
  - All should be typed as `string` (Vite always provides strings; `env.ts` handles boolean coercion internally)
  - Run `npx tsc --noEmit` from `portfolio-ui/` after changes to confirm no regressions

- [ ] Create `docs/deployment/ENV_VARS_AUDIT.md` as a structured reference for both apps:
  - Use YAML front matter: `type: reference`, `title: Environment Variables Audit`, `tags: [deployment, env-vars, vercel, homelab]`, `related: ['[[VERCEL_PROJECT_SETUP]]', '[[CLOUDFLARE_TUNNEL_SETUP]]']`
  - **Frontend section** — table with columns: Variable | Required | Where Set | Description
    - Include all VITE_ vars from `portfolio-ui/.env.production.example`
    - "Where Set" values: `Vercel Dashboard` for production VITE_ vars
  - **Backend section** — table with same columns
    - Source from `portfolio-api/.env.example` and `portfolio-api/src/config/index.ts` schema
    - Mark `DATABASE_URL`, `JWT_SECRET`, `REDIS_URL` as Required
    - Mark OAuth vars (`GITHUB_CLIENT_ID`, etc.) and `SMTP_*` as Optional
    - "Where Set" values: `K8s ExternalSecret / Vault` for production backend vars
  - **GitHub Secrets section** — list all secrets needed by all four workflows: `frontend-ci.yml`, `frontend-cd.yml`, `vercel-deploy.yml`, `backend-cd.yml`
    - Include: `VITE_API_URL`, `VERCEL_TOKEN`, `VERCEL_ORG_ID`, `VERCEL_PROJECT_ID`, `TAILSCALE_OAUTH_CLIENT_ID`, `TAILSCALE_OAUTH_SECRET`, `HOMELAB_SSH_KEY`
  - **`vercel env add` command reference** — show the CLI pattern for adding each required frontend env var:
    ```
    vercel env add VITE_API_URL production
    vercel env add VITE_WS_URL production
    vercel env add VITE_API_VERSION production
    vercel env add VITE_USE_API production
    ```

- [ ] Update `portfolio-api/.env.example` if any variables referenced in `config/index.ts` schema are missing from the example file:
  - Read `portfolio-api/src/config/index.ts` — the Zod schema is the authoritative list of all accepted env vars
  - Cross-reference with `portfolio-api/.env.example`
  - Add any missing entries as commented-out optional vars, or uncommented required vars with `<PLACEHOLDER>` values
  - Never write actual secrets, tokens, or passwords — use `<PLACEHOLDER>` form per vault security policy
