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

## Environment Variables (Vite build args)

| Variable | Default | Description |
|----------|---------|-------------|
| `VITE_API_URL` | `/api` | Backend API base URL |
| `VITE_API_VERSION` | `v1` | API version prefix |
| `VITE_USE_API` | `true` | Use live API (false = MSW mocks) |
| `VITE_ENABLE_MSW` | `false` | Enable Mock Service Worker |
| `VITE_APP_NAME` | `Portfolio` | App display name |

> Vite bakes these into the static bundle at build time — they cannot be changed at runtime.
