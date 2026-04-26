# Ultraplan Phase 1: Frontend — Vercel Configuration

> **Goal:** Make the React/Vite frontend deployable to Vercel as a production SPA.  
> **Working directory:** `/Users/ltmas/Repo/apps/portfolio-website/portfolio-ui`

---

## Context

- Env var mismatch: `vite.config.ts` + `src/config/env.ts` read `VITE_API_URL`, but `frontend-cd.yml` line 93 injects `VITE_API_BASE_URL` as the Docker build arg. Vercel also needs `VITE_API_URL`.
- No `vercel.json` exists — React Router will 404 on direct URL navigation without a rewrite rule.
- `lovable-tagger` is already dev-only in vite.config ✅
- Three.js vendor chunk split already configured ✅

---

## Tasks

- [ ] Create `portfolio-ui/vercel.json` with SPA rewrite rules:
  - Add `rewrites`: `[{ "source": "/(.*)", "destination": "/index.html" }]`
  - Add `headers` for cache-control on static assets (`/_next/static`, `/assets`) with `Cache-Control: public, max-age=31536000, immutable`
  - Set `framework` to `"vite"`
  - Set `buildCommand` to `"npm run build"`
  - Set `outputDirectory` to `"dist"`
  - Set `installCommand` to `"npm install"`

- [ ] Create `portfolio-ui/.env.production.example` documenting all required Vercel environment variables:
  ```
  VITE_API_URL=https://api.yourdomain.com
  VITE_WS_URL=wss://api.yourdomain.com
  VITE_API_VERSION=v1
  VITE_APP_NAME=Portfolio
  VITE_USE_API=true
  VITE_ENABLE_ANALYTICS=true
  VITE_ENABLE_CODE_EXECUTION=true
  VITE_ENABLE_COMMENTS=true
  VITE_DEBUG=false
  ```

- [ ] Fix the env var name mismatch in `.github/workflows/frontend-cd.yml`:
  - On line 93, change `VITE_API_BASE_URL=${{ secrets.API_BASE_URL }}` → `VITE_API_URL=${{ secrets.VITE_API_URL }}`
  - Update the comment block at top of the file: replace `API_BASE_URL` with `VITE_API_URL`

- [ ] Verify `portfolio-ui/src/config/env.ts` is correct — it should read `import.meta.env.VITE_API_URL` (it already does ✅). No changes needed there.

- [ ] Run TypeScript type check to confirm no regressions:
  ```bash
  cd /Users/ltmas/Repo/apps/portfolio-website/portfolio-ui && npx tsc --noEmit
  ```

- [ ] Run the Vite build to confirm it compiles cleanly:
  ```bash
  cd /Users/ltmas/Repo/apps/portfolio-website/portfolio-ui && npm run build
  ```
  Confirm `dist/` is produced with no errors.

---

## Acceptance Criteria

- `portfolio-ui/vercel.json` exists with rewrites and framework config
- `.env.production.example` documents all VITE_ vars
- `frontend-cd.yml` references `VITE_API_URL` (not `VITE_API_BASE_URL`)
- `tsc --noEmit` passes
- `npm run build` produces `dist/` successfully
