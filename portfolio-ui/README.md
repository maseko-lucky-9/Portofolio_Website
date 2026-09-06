# Portfolio UI

React 18 + TypeScript + Vite single-page application for the portfolio website frontend.

## Stack

- React 18, TypeScript
- Vite (build tooling)
- shadcn-ui + Tailwind CSS (component library / styling)
- React Router (client-side routing)
- Mock Service Worker (MSW) for local development without a live API

## Development

```bash
npm install

# Start dev server with MSW (no backend required)
VITE_ENABLE_MSW=true npm run dev

# Start dev server pointing at local backend
VITE_API_URL=http://localhost:3000 npm run dev
```

## Build

```bash
npm run build        # Output to dist/
npm run preview      # Preview production build locally
```

## Docker

Built as part of the full-stack local environment. See `docker-compose.dev.yml` at the monorepo root.

```bash
# Build standalone (from portfolio-ui/ directory)
docker build -t portfolio-frontend .

# Or via docker compose from monorepo root
docker compose -f ../docker-compose.dev.yml build frontend
```

### Trial run: the real image, with the real test suite

Verifies the nginx image rather than the Vite preview — different artifact,
different headers, and the only way to check that the CSP and the SPA fallback
behave. Run from the monorepo root:

```bash
docker build --build-arg VITE_USE_API=false -t portfolio-ui:aura portfolio-ui/
docker run -d --name aura-trial -p 18080:8080 --add-host backend-api:127.0.0.1 portfolio-ui:aura
until curl -fsS http://localhost:18080/health >/dev/null; do sleep 1; done
```

`--add-host` is required standalone: nginx resolves the `backend-api` upstream at
config-parse time and refuses to start if the name does not exist.

Then point the suite at it. `E2E_FULL_SUITE=1` is the explicit opt-in that lifts
the live-domain-only restriction `E2E_BASE_URL` normally imposes — without it a
stale export could aim the whole suite at production:

```bash
cd portfolio-ui
E2E_BASE_URL=http://localhost:18080 E2E_FULL_SUITE=1 npx playwright test
```

The image builds with `build:app` (vite only), so the six SEO scripts do not
run and `/blog`, `/answers`, `/projects`, `/sitemap.xml`, `/rss.xml` and `/og/*`
are absent from it. Specs that need them detect the SPA fallback and skip.

## Theme

Dark only. There is no theme toggle and no light palette — `index.html` carries
`class="dark"` and `color-scheme: dark`, and every token is defined once in a
single `:root` block. See `docs/decisions/008-aura-signal-field-redesign.md`.

## Environment Variables (Vite build args)

| Variable | Default | Description |
|----------|---------|-------------|
| `VITE_API_URL` | `/api` | Backend API base URL |
| `VITE_API_VERSION` | `v1` | API version prefix |
| `VITE_USE_API` | `true` | Use live API (false = MSW mocks) |
| `VITE_ENABLE_MSW` | `false` | Enable Mock Service Worker |
| `VITE_APP_NAME` | `Portfolio` | App display name |

> Vite bakes these into the static bundle at build time — they cannot be changed at runtime.
