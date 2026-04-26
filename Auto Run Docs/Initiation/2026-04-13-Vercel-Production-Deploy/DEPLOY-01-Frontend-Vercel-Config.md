# Phase 01: Frontend Vercel Configuration + Build Verification

This phase prepares the React/Vite frontend for production Vercel deployment by resolving a critical environment variable name mismatch, creating the required `vercel.json` SPA rewrite configuration, and proving the build is clean. By the end, `portfolio-ui/` will be Vercel-deployable and the `dist/` artifact will be verified. This is the unblocking foundation for all subsequent Vercel work.

## Tasks

- [ ] Fix the `VITE_API_BASE_URL` → `VITE_API_URL` mismatch in `.github/workflows/frontend-cd.yml`:
  - Read the file first to confirm the exact text on line 93 and the comment block near line 8
  - Change line 93 build-arg from `VITE_API_BASE_URL=${{ secrets.API_BASE_URL || 'http://api.portfolio.homelab' }}` to `VITE_API_URL=${{ secrets.VITE_API_URL || 'http://api.portfolio.homelab' }}`
  - Update the required-secrets comment block at the top of the file: replace `API_BASE_URL` with `VITE_API_URL`
  - The codebase reads `VITE_API_URL` in both `vite.config.ts` (proxy target) and `src/config/env.ts` (env.apiUrl) — the build arg must match these

- [ ] Create `portfolio-ui/vercel.json` with complete Vercel project configuration:
  - `framework`: `"vite"`
  - `buildCommand`: `"npm run build"`
  - `outputDirectory`: `"dist"`
  - `installCommand`: `"npm install"`
  - `rewrites`: `[{ "source": "/(.*)", "destination": "/index.html" }]` — required for React Router; without this, direct URL navigation returns 404 on Vercel
  - `headers`: cache-control rule for `/assets/(.*)` with `Cache-Control: public, max-age=31536000, immutable` — Three.js vendor chunks and other hashed assets benefit from long-lived caching

- [ ] Create `portfolio-ui/.env.production.example` documenting every VITE_ variable the app reads (cross-reference `src/config/env.ts` and `src/vite-env.d.ts` to ensure completeness):
  - `VITE_API_URL=https://api.yourdomain.com` — full base URL of the production backend
  - `VITE_WS_URL=wss://api.yourdomain.com` — WebSocket base URL (same host, different scheme)
  - `VITE_API_VERSION=v1`
  - `VITE_APP_NAME=Portfolio`
  - `VITE_APP_DESCRIPTION=My Portfolio Website`
  - `VITE_USE_API=true` — must be true in production to hit the real API (not MSW mocks)
  - `VITE_ENABLE_ANALYTICS=true`
  - `VITE_ENABLE_CODE_EXECUTION=true`
  - `VITE_ENABLE_COMMENTS=true`
  - `VITE_DEBUG=false`
  - Add a header comment block explaining that these values go in the Vercel dashboard under Project → Settings → Environment Variables

- [ ] Run the TypeScript check and Vite production build to verify the frontend compiles without errors:
  - `cd portfolio-ui && npx tsc --noEmit` — must exit 0
  - `cd portfolio-ui && npm run build` — must produce `dist/` with no build errors
  - If either command fails, read the error output, identify the root cause, fix it, and re-run before proceeding
  - Confirm `dist/index.html` and at least one JS chunk in `dist/assets/` exist after the build
