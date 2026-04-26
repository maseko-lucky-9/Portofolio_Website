# Phase 05: End-to-End Smoke Tests + Production Validation

With the frontend on Vercel and the backend exposed via Cloudflare Tunnel, this phase validates the entire stack end-to-end. Every gap identified in the project audit gets a targeted verification: SPA routing, CORS preflight, API reachability, WebSocket upgrade, migration status, and a Lighthouse performance baseline. This phase only passes when every check exits 0 or returns the expected HTTP status.

## Tasks

- [ ] Create `execution/smoke-test-prod.sh` — a runnable bash script that validates the full production stack:
  - Accept `VERCEL_URL` and `API_URL` as required environment variables (fail fast if unset)
  - Test 1 — API liveness: `curl -sf "$API_URL/api/v1/health/live"` — must return 200
  - Test 2 — API readiness: `curl -sf "$API_URL/api/v1/health/ready"` — must return 200
  - Test 3 — CORS preflight: `curl -sf -X OPTIONS -H "Origin: $VERCEL_URL" -H "Access-Control-Request-Method: GET" "$API_URL/api/v1/projects"` — response must include `Access-Control-Allow-Origin: $VERCEL_URL` in headers (use `-I` flag and grep)
  - Test 4 — SPA routing: `curl -sf "$VERCEL_URL/projects"` — must return 200 with `<!DOCTYPE html>` in body (confirms `vercel.json` rewrite is active; without it this returns 404)
  - Test 5 — SPA routing deep path: `curl -sf "$VERCEL_URL/blog/some-article"` — must return 200
  - Test 6 — Static asset cache headers: `curl -sI "$VERCEL_URL/" | grep -i "cache-control"` — must include `public` or `immutable`
  - Test 7 — WebSocket upgrade check: `curl -sf -H "Upgrade: websocket" -H "Connection: Upgrade" "$API_URL/ws"` — expect 101 or 426 (not 404); a 404 means the WS endpoint is missing
  - Print PASS/FAIL per test with emoji indicators; exit 1 if any test fails, exit 0 if all pass
  - Make the script executable (`chmod +x`)

- [ ] Create `docs/deployment/SMOKE_TEST_CHECKLIST.md` with a structured pre-release checklist:
  - Use YAML front matter: `type: reference`, `title: Production Smoke Test Checklist`, `tags: [deployment, testing, production]`, `related: ['[[ENV_VARS_AUDIT]]', '[[VERCEL_PROJECT_SETUP]]', '[[CLOUDFLARE_TUNNEL_SETUP]]']`
  - Section 1 — Pre-flight (manual steps before running script):
    - [ ] Cloudflare Tunnel is running and `api.yourdomain.com` resolves publicly
    - [ ] Vercel deploy succeeded (check GitHub Actions → `vercel-deploy.yml` run)
    - [ ] All VITE_ vars set in Vercel dashboard
    - [ ] `prisma migrate deploy` ran successfully in last backend CD run (check Actions log)
  - Section 2 — Automated checks (run `VERCEL_URL=... API_URL=... ./execution/smoke-test-prod.sh`):
    - List each test from the script with expected result
  - Section 3 — Manual browser checks:
    - Navigate to `$VERCEL_URL/projects` directly (no redirect from home) — page loads correctly
    - Open browser DevTools → Network tab → check that API calls go to `api.yourdomain.com` (not `localhost`)
    - Open DevTools → Console — no CORS errors
    - Test auth flow if applicable: login, refresh token, logout
  - Section 4 — Lighthouse baseline:
    - Run `npx lighthouse $VERCEL_URL --output=json --output-path=docs/deployment/lighthouse-baseline.json --chrome-flags="--headless"`
    - Target scores: Performance ≥ 80, Accessibility ≥ 90, Best Practices ≥ 90, SEO ≥ 90
    - Record the scores in this document under "Baseline Scores" with the date

- [ ] Run `execution/smoke-test-prod.sh` and fix any failures before marking this phase complete:
  - If the Cloudflare Tunnel is not yet running (Phase 02 setup was deferred), skip Test 1, 2, 3, 7 and note them as "pending tunnel setup" in output
  - If CORS preflight fails: re-read `portfolio-api/src/config/security.ts` and verify the comma-split fix from Phase 02 was applied correctly; check that the Vercel URL is in `CORS_ORIGIN` on the homelab
  - If SPA routing Test 4/5 fails: re-read `portfolio-ui/vercel.json` and confirm the rewrite rule uses `"source": "/(.*)"` with proper escaping; redeploy to Vercel if needed
  - If all tests pass, append a "Validation Complete" section to `SMOKE_TEST_CHECKLIST.md` with the timestamp and results summary
