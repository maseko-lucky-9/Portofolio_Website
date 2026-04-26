# Ultraplan Phase 2: Backend — Public Ingress & CORS

> **Goal:** Make the Fastify backend reachable from Vercel's edge network and correctly configured for CORS.  
> **Working directory:** `/Users/ltmas/Repo/apps/portfolio-website/portfolio-api`

---

## Context

- Backend runs on homelab K8s. Tailscale IP `100.114.75.127` is **private** — Vercel cannot reach it.
- CORS is set via `CORS_ORIGIN` env var in `portfolio-api/src/config/security.ts` (line 23).
  - Current default: `http://localhost:5173`
  - Production needs: the Vercel deployment URL (e.g. `https://portfolio.vercel.app` or custom domain)
- Backend uses Socket.io, BullMQ, Redis, and Docker-based code execution — incompatible with Vercel Functions. Must stay on homelab.
- Recommended ingress: **Cloudflare Tunnel** (free, no open ports, works through NAT/Tailscale).

---

## Tasks

- [ ] Set up Cloudflare Tunnel on homelab to expose the backend publicly:
  - Install `cloudflared` on the homelab node if not present:
    ```bash
    curl -L --output cloudflared.deb https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64.deb
    sudo dpkg -i cloudflared.deb
    ```
  - Authenticate with Cloudflare: `cloudflared tunnel login`
  - Create a named tunnel: `cloudflared tunnel create portfolio-api`
  - Create `~/.cloudflared/config.yml`:
    ```yaml
    tunnel: <TUNNEL_ID>
    credentials-file: /root/.cloudflared/<TUNNEL_ID>.json
    ingress:
      - hostname: api.<YOUR_DOMAIN>
        service: http://localhost:3000
      - service: http_status:404
    ```
  - Route the tunnel DNS: `cloudflared tunnel route dns portfolio-api api.<YOUR_DOMAIN>`
  - Run as systemd service: `cloudflared service install`
  - Verify: `curl https://api.<YOUR_DOMAIN>/health`

- [ ] Update `portfolio-api/src/config/security.ts` CORS to support multiple origins:
  - Change `origin: process.env.CORS_ORIGIN || 'http://localhost:5173'` to support a comma-separated list:
    ```typescript
    cors: {
      origin: (process.env.CORS_ORIGIN || 'http://localhost:5173')
        .split(',')
        .map(o => o.trim()),
      credentials: true,
    }
    ```
  - This allows `CORS_ORIGIN=https://portfolio.vercel.app,http://localhost:5173` for local dev + prod simultaneously.

- [ ] Update the backend deployment's environment variables (K8s Secret or `.env` on homelab):
  - Set `CORS_ORIGIN=https://<YOUR_VERCEL_DOMAIN>,http://localhost:5173`
  - Set `API_PUBLIC_URL=https://api.<YOUR_DOMAIN>` (for any self-referential links)

- [ ] Update `portfolio-api/.env.example` to document production CORS values:
  ```
  # Comma-separated list of allowed origins
  CORS_ORIGIN=https://yourportfolio.vercel.app,http://localhost:5173
  API_PUBLIC_URL=https://api.yourdomain.com
  ```

- [ ] Verify CORS by running a preflight check after tunnel is live:
  ```bash
  curl -v -X OPTIONS https://api.<YOUR_DOMAIN>/api/v1/projects \
    -H "Origin: https://<YOUR_VERCEL_DOMAIN>" \
    -H "Access-Control-Request-Method: GET"
  ```
  Confirm `Access-Control-Allow-Origin: https://<YOUR_VERCEL_DOMAIN>` in response.

- [ ] Run backend TypeScript build to confirm CORS change compiles:
  ```bash
  cd /Users/ltmas/Repo/apps/portfolio-website/portfolio-api && npm run build
  ```

---

## Acceptance Criteria

- `cloudflared` tunnel is active and `https://api.<YOUR_DOMAIN>/health` returns 200
- CORS config accepts comma-separated origins
- `CORS_ORIGIN` includes the Vercel deployment URL
- Preflight OPTIONS check returns correct `Access-Control-Allow-Origin` header
- Backend TypeScript builds without errors
