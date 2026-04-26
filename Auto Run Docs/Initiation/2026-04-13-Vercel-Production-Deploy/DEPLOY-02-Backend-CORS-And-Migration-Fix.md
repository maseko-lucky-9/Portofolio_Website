# Phase 02: Backend CORS Multi-Origin + Migration Execution Fix

The backend's CORS config currently accepts a single origin string — but production requires two simultaneous origins: the Vercel frontend URL and the homelab dev URL. This phase updates the CORS layer to parse a comma-separated `CORS_ORIGIN` environment variable into an array of allowed origins. It also fixes a long-standing gap in `backend-cd.yml`: the "migration-plan" job runs only a dry-run count and never actually applies `prisma migrate deploy` before new pods start, which risks schema drift on every deploy.

## Tasks

- [ ] Update `portfolio-api/src/config/security.ts` CORS origin to support multiple origins:
  - Read the file first; the current `origin` field is `process.env.CORS_ORIGIN || 'http://localhost:5173'` (a plain string)
  - Replace it with a parsed array: split `CORS_ORIGIN` on commas, trim each value, filter empty strings — result is `string[]`
  - Example pattern: `(process.env.CORS_ORIGIN || 'http://localhost:5173').split(',').map(o => o.trim()).filter(Boolean)`
  - If only one value is present, the result is a single-element array — still valid for Fastify's CORS plugin
  - Also add `process.env.FRONTEND_URL` to the `oauth.allowedRedirects` array (currently only APP_URL and FRONTEND_URL are conditionally included, but FRONTEND_URL may be undefined — ensure it appears when set)

- [ ] Update `portfolio-api/.env.example` with multi-origin CORS examples and production URL placeholders:
  - Change `CORS_ORIGIN=http://localhost:5173` to `CORS_ORIGIN=https://your-vercel-project.vercel.app,http://localhost:5173`
  - Add `FRONTEND_URL=https://your-vercel-project.vercel.app` (already referenced in `security.ts` oauth.allowedRedirects and connectSrc)
  - Ensure `APP_URL=https://api.yourdomain.com` is present (used for OAuth callback base URL)
  - Add a comment block above CORS section: `# For multi-origin: comma-separate values, e.g. https://prod.vercel.app,http://localhost:5173`

- [ ] Fix `backend-cd.yml` to run `prisma migrate deploy` before rolling out new pods:
  - Read `.github/workflows/backend-cd.yml` — the `migration-plan` job (Job 2) only counts migration files and prints a dry-run message; it never calls `prisma migrate deploy`
  - Add a new step inside the `deploy-homelab` job (Job 3) that runs migrations via SSH **before** the `kubectl rollout restart` step:
    ```
    - name: Apply database migrations
      uses: appleboy/ssh-action@v1.0.3
      with:
        host: ${{ env.HOMELAB_HOST }}
        username: ${{ env.HOMELAB_USER }}
        key: ${{ secrets.HOMELAB_SSH_KEY }}
        command_timeout: 5m
        script: |
          kubectl exec -n prod deployment/prod-backend-api -- \
            npx prisma migrate deploy
          echo "Migrations applied"
    ```
  - This step must run before the `kubectl rollout restart` step — order matters
  - If `skip_migrations` workflow input is `true`, wrap this step in `if: github.event.inputs.skip_migrations != 'true'`

- [ ] Create `docs/deployment/CLOUDFLARE_TUNNEL_SETUP.md` as a structured reference for the homelab public ingress step (required reading before Phase 05 smoke tests pass):
  - Use YAML front matter: `type: reference`, `title: Cloudflare Tunnel Setup`, `tags: [deployment, homelab, networking]`, `related: ['[[ENV_VARS_AUDIT]]']`
  - Document cloudflared installation: `curl -L https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64 -o cloudflared`
  - Document tunnel creation: `cloudflared tunnel create portfolio-api` → saves UUID and credentials JSON
  - Include a `config.yml` template section showing ingress for `api.yourdomain.com` → `http://localhost:3000`
  - Document DNS CNAME setup: `cloudflared tunnel route dns portfolio-api api.yourdomain.com`
  - Document systemd service setup for persistent tunnel on homelab
  - Note: After tunnel is live, set `VITE_API_URL=https://api.yourdomain.com` and `VITE_WS_URL=wss://api.yourdomain.com` in Vercel dashboard
