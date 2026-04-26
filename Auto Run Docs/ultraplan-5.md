# Ultraplan Phase 5: Verification & Smoke Tests

> **Goal:** Prove end-to-end that the Vercel-hosted frontend talks correctly to the homelab backend.  
> **Run this phase AFTER phases 1–4 are complete and a Vercel deployment exists.**

---

## Context

- Frontend is live at the Vercel URL (e.g. `https://portfolio-ui.vercel.app` or custom domain)
- Backend is live at `https://api.<YOUR_DOMAIN>` via Cloudflare Tunnel
- All env vars are set in Vercel dashboard and homelab K8s secret

---

## Tasks

- [ ] Verify Cloudflare Tunnel health:
  ```bash
  curl -s https://api.<YOUR_DOMAIN>/health | jq .
  ```
  Expected: `{ "status": "ok" }` or similar. If 502/504, check `cloudflared` service on homelab.

- [ ] Verify CORS preflight from Vercel origin:
  ```bash
  curl -v -X OPTIONS https://api.<YOUR_DOMAIN>/api/v1/projects \
    -H "Origin: https://<VERCEL_DOMAIN>" \
    -H "Access-Control-Request-Method: GET" \
    -H "Access-Control-Request-Headers: Authorization"
  ```
  Expected response headers:
  - `Access-Control-Allow-Origin: https://<VERCEL_DOMAIN>`
  - `Access-Control-Allow-Credentials: true`
  - HTTP 204 or 200

- [ ] Verify Vercel deployment renders correctly:
  - Open `https://<VERCEL_DOMAIN>` in browser
  - Confirm hero/landing section loads (no blank screen, no console errors)
  - Open browser DevTools → Network tab, confirm no failed API requests on initial load

- [ ] Test React Router direct navigation (the vercel.json SPA rewrite):
  - Navigate directly to `https://<VERCEL_DOMAIN>/projects`
  - Confirm the Projects page loads (not a 404)
  - Navigate to `https://<VERCEL_DOMAIN>/blog/some-slug` — confirm 404 handling is graceful (app-level, not Vercel-level)

- [ ] Test API connectivity from the live frontend:
  - Open `https://<VERCEL_DOMAIN>` in browser
  - Open DevTools → Console and run:
    ```javascript
    fetch('https://api.<YOUR_DOMAIN>/api/v1/projects')
      .then(r => r.json())
      .then(d => console.log('API OK:', d))
      .catch(e => console.error('API FAIL:', e))
    ```
  - Confirm `API OK:` with project data (not CORS error, not network error)

- [ ] Test WebSocket connection (if Socket.io features are used):
  - In DevTools → Network → WS tab, confirm a WebSocket upgrade request to `wss://api.<YOUR_DOMAIN>` completes with status 101

- [ ] Verify Prisma migrations were applied correctly:
  ```bash
  # On homelab:
  kubectl exec -n portfolio deploy/portfolio-api -- npx prisma migrate status
  ```
  All migrations should show `Applied`.

- [ ] Run GitHub Actions Vercel deploy workflow end-to-end:
  - Go to GitHub → Actions → "Deploy Frontend to Vercel" → Run workflow
  - Confirm all steps pass (install, build, deploy)
  - Confirm deployment URL in workflow output matches expected domain

- [ ] Check Vercel function logs for any runtime errors:
  - Go to Vercel dashboard → project → Deployments → latest → Functions
  - Confirm no 5xx errors in the first 5 minutes after deployment

- [ ] Final checklist before calling it production-ready:
  - [ ] `https://<VERCEL_DOMAIN>` loads in < 3s (check Vercel Analytics or Lighthouse)
  - [ ] No `localhost` or `100.114.75.127` references in production network requests
  - [ ] Auth flow works: login → JWT stored → authenticated API request succeeds
  - [ ] Contact form submits successfully (tests SMTP + CORS + POST)
  - [ ] Code execution demo works (tests backend Docker execution via API)

---

## Acceptance Criteria

- All curl checks return expected status codes and headers
- React Router direct navigation works on all main routes
- API calls from the live frontend succeed with data (no CORS errors)
- WebSocket upgrades to 101
- All Prisma migrations are `Applied`
- GitHub Actions Vercel deploy workflow passes end-to-end
- Lighthouse performance score ≥ 85 on desktop
