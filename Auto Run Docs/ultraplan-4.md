# Ultraplan Phase 4: Environment Variables — Full Audit & Vercel Dashboard Setup

> **Goal:** Document every environment variable for both apps, configure them in the Vercel dashboard, and ensure no secrets leak into git.  
> **Working directory:** `/Users/ltmas/Repo/apps/portfolio-website`

---

## Context

- The frontend has 9 `VITE_` env vars read in `src/config/env.ts`.
- The backend has 12+ env vars across DB, Redis, auth, CORS, email, OAuth.
- Vercel env vars must be set in the Vercel dashboard (or via `vercel env add`) — they are **not** read from `.env` files in production.
- `.env` files with real secrets must never be committed.

---

## Tasks

- [ ] Audit all frontend environment variables and verify each is used in `src/config/env.ts`:
  | Variable | Required | Production Value |
  |---|---|---|
  | `VITE_API_URL` | ✅ | `https://api.<YOUR_DOMAIN>` |
  | `VITE_WS_URL` | ✅ | `wss://api.<YOUR_DOMAIN>` |
  | `VITE_API_VERSION` | optional | `v1` |
  | `VITE_APP_NAME` | optional | `Portfolio` |
  | `VITE_USE_API` | ✅ | `true` |
  | `VITE_ENABLE_ANALYTICS` | optional | `true` |
  | `VITE_ENABLE_CODE_EXECUTION` | optional | `true` |
  | `VITE_ENABLE_COMMENTS` | optional | `true` |
  | `VITE_DEBUG` | optional | `false` |

- [ ] Add all frontend production env vars to the Vercel dashboard:
  ```bash
  # From portfolio-ui/ with vercel linked:
  vercel env add VITE_API_URL production
  vercel env add VITE_WS_URL production
  vercel env add VITE_USE_API production
  vercel env add VITE_DEBUG production
  vercel env add VITE_ENABLE_ANALYTICS production
  vercel env add VITE_ENABLE_CODE_EXECUTION production
  vercel env add VITE_ENABLE_COMMENTS production
  ```

- [ ] Audit all backend environment variables — verify each has a value in the homelab K8s secret:
  | Variable | Required | Notes |
  |---|---|---|
  | `DATABASE_URL` | ✅ | PostgreSQL connection string |
  | `REDIS_URL` | ✅ | Redis connection string |
  | `JWT_SECRET` | ✅ | min 32 chars |
  | `JWT_REFRESH_SECRET` | ✅ | min 32 chars |
  | `CORS_ORIGIN` | ✅ | Comma-separated: Vercel URL + localhost |
  | `NODE_ENV` | ✅ | `production` |
  | `PORT` | optional | `3000` |
  | `SMTP_HOST` | optional | For contact form emails |
  | `SMTP_PORT` | optional | `587` |
  | `SMTP_USER` | optional | |
  | `SMTP_PASS` | optional | |
  | `GITHUB_CLIENT_ID` | optional | OAuth |
  | `GITHUB_CLIENT_SECRET` | optional | OAuth |
  | `GOOGLE_CLIENT_ID` | optional | OAuth |
  | `GOOGLE_CLIENT_SECRET` | optional | OAuth |
  | `SESSION_SECRET` | ✅ | min 32 chars |

- [ ] Verify `portfolio-api/.env.example` contains all the above variables with `<PLACEHOLDER>` values (no real secrets). Update it if any are missing.

- [ ] Verify `portfolio-ui/.env.example` (or create if absent) contains all `VITE_` variables with placeholder values.

- [ ] Check both `.gitignore` files confirm `.env`, `.env.local`, `.env.production.local` are excluded:
  - `portfolio-ui/.gitignore`
  - `portfolio-api/.gitignore`
  Add entries if missing.

- [ ] Check `portfolio-ui/src/config/env.ts` for any hardcoded URLs or secrets — replace with `import.meta.env.VITE_*` references if found.

---

## Acceptance Criteria

- All `VITE_` production vars are set in Vercel dashboard (verify with `vercel env ls`)
- All backend vars are present in homelab K8s secret (verify with `kubectl get secret portfolio-api-secret -n portfolio -o yaml | grep -c "key:"`)
- `.env.example` files for both apps are complete and contain only `<PLACEHOLDER>` values
- Neither `.env` is tracked by git (`git ls-files portfolio-ui/.env portfolio-api/.env` returns empty)
- No hardcoded production URLs or secrets in source code
