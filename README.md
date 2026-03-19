# Portfolio Website

A full-stack developer portfolio with a React/Vite frontend featuring a WebGL aurora background, Fastify/Node.js backend API, PostgreSQL database, and Redis cache — deployed on a self-hosted MicroK8s homelab via GitOps (ArgoCD).

---

## Table of Contents

- [Key Features](#key-features)
- [Tech Stack](#tech-stack)
- [Monorepo Structure](#monorepo-structure)
- [Prerequisites](#prerequisites)
- [Local Development](#local-development)
- [Frontend Architecture](#frontend-architecture)
- [Backend Architecture](#backend-architecture)
- [Environment Variables](#environment-variables)
- [Available Scripts](#available-scripts)
- [Testing](#testing)
- [Deployment](#deployment)
- [Known Homelab Configuration](#known-homelab-configuration)
- [Secrets Setup](#secrets-setup)
- [CI/CD](#cicd)
- [Troubleshooting](#troubleshooting)
- [Development Notes](#development-notes)

---

## Key Features

- **WebGL Aurora Background** — Custom GLSL fragment shader with 3-layer perlin noise, 15-second breathing cycle, and mouse parallax tracking. Falls back gracefully to CSS gradient for devices that don't support WebGL or when `prefers-reduced-motion` is active.
- **Glassmorphism UI** — Layered backdrop-blur, inset highlights, and themed shadows across metric cards, skill containers, and the contact form.
- **API-Driven Projects** — Projects section fetches live data from the backend; static fallback renders instantly if the API is unavailable.
- **Dark / Light Theme** — Theme-aware across all components including the WebGL shader opacity.
- **Auth Flow** — JWT access + refresh tokens with protected routes and OAuth callback support.
- **Full Accessibility** — Skip-to-content link, `aria-labelledby` on all sections, `focus-visible` outlines, and reduced-motion support throughout.
- **Comprehensive Testing** — 49 Vitest unit tests + 50 Playwright E2E tests (desktop Chromium + mobile iPhone 13).

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18, TypeScript, Vite 7, shadcn/ui, Tailwind CSS |
| 3D / WebGL | Three.js v0.170, React Three Fiber v8, React Three Drei v9 |
| Animations | Framer Motion v12 |
| State | TanStack Query v5 (React Query) |
| Backend | Fastify 5, Node.js 20, TypeScript, Prisma ORM |
| Database | PostgreSQL 16 |
| Cache / Queue | Redis 7, BullMQ |
| Orchestration | MicroK8s (self-hosted homelab) |
| CI/CD | GitHub Actions + ArgoCD (GitOps) |
| Container Registry | MicroK8s local registry (`localhost:32000`) |
| Auth | JWT (access + refresh tokens), bcrypt |
| API Docs | Fastify Swagger UI (`/api/v1/docs`) |
| Unit Testing | Vitest 4, React Testing Library |
| E2E Testing | Playwright (Chromium + iPhone 13) |

---

## Monorepo Structure

```
portfolio-website/
├── portfolio-api/          # Fastify backend API
│   ├── src/
│   │   ├── routes/         # API route handlers (projects, contact, auth, health)
│   │   ├── services/       # Business logic
│   │   ├── plugins/        # Fastify plugins (JWT, Swagger, CORS)
│   │   └── index.ts        # Entry point
│   ├── prisma/
│   │   ├── schema.prisma   # Database schema
│   │   └── migrations/     # Migration history
│   ├── k8s/                # Kubernetes manifests
│   │   ├── base/           # Base Kustomize config
│   │   └── overlays/       # Environment overlays (homelab)
│   └── Dockerfile          # Multi-stage — requires monorepo root context
├── portfolio-ui/           # React frontend SPA
│   ├── src/
│   │   ├── components/     # React components
│   │   │   ├── ui/         # shadcn/ui primitives
│   │   │   ├── auth/       # Auth components (LoginForm, ProtectedRoute, OAuthCallback)
│   │   │   ├── examples/   # API integration examples
│   │   │   ├── __tests__/  # Component unit tests
│   │   │   ├── AuroraBackground.tsx  # WebGL aurora shader
│   │   │   ├── HeroSection.tsx
│   │   │   ├── Navbar.tsx
│   │   │   ├── SkillsSection.tsx
│   │   │   ├── ProjectsSection.tsx
│   │   │   ├── ExperienceSection.tsx
│   │   │   ├── BlogSection.tsx
│   │   │   ├── ContactSection.tsx
│   │   │   └── Footer.tsx
│   │   ├── data/           # Static data (personal, projects, skills, experience)
│   │   │   └── __tests__/  # Data validation tests
│   │   ├── hooks/          # Custom React hooks
│   │   ├── services/       # API service layer (axios)
│   │   ├── contexts/       # React contexts (Auth, Theme)
│   │   ├── lib/
│   │   │   └── motion.ts   # Shared useMotionProps() for reduced-motion
│   │   └── pages/
│   │       └── Index.tsx   # Main page (all sections + skip-to-content)
│   ├── e2e/                # Playwright E2E tests
│   │   ├── navigation.spec.ts
│   │   ├── theme.spec.ts
│   │   ├── hero.spec.ts
│   │   ├── projects.spec.ts
│   │   ├── contact.spec.ts
│   │   └── accessibility.spec.ts
│   ├── public/
│   │   └── images/
│   │       └── profile.jpg   # ⚠️  Add your own profile photo here
│   ├── playwright.config.ts
│   ├── vite.config.ts
│   ├── nginx.conf          # Nginx SPA config
│   └── Dockerfile          # Multi-stage — self-contained context
├── shared/                 # Shared TypeScript types & utilities
├── docker-compose.dev.yml  # Full-stack local testing (Docker)
└── .github/workflows/      # CI/CD pipelines
```

---

## Prerequisites

- **Node.js 20+** (frontend and backend)
- **Docker + Docker Compose** (for full-stack local testing)
- **PostgreSQL 16** (or use Docker)
- **Redis 7** (or use Docker)

---

## Local Development

### Option A — Docker Compose (Full Stack)

Run postgres, redis, backend API, and frontend together:

```bash
# Build all images (from monorepo root — required for shared/ package)
docker compose -f docker-compose.dev.yml build --no-cache

# Start full stack
docker compose -f docker-compose.dev.yml up -d

# Check all containers are healthy
docker compose -f docker-compose.dev.yml ps

# View backend logs (includes Prisma migration output)
docker compose -f docker-compose.dev.yml logs backend -f

# Teardown
docker compose -f docker-compose.dev.yml down -v
```

> **Important:** The backend Dockerfile requires the **monorepo root** as build context (`context: .`) so `COPY shared/` resolves correctly. Always run Docker builds from the repo root, not from `portfolio-api/`.

### Option B — Frontend Only (Vite Dev Server)

```bash
cd portfolio-ui
npm install
npm run dev
```

The Vite dev server starts at `http://localhost:8080`. API calls are proxied to `http://localhost:3000` (configurable via `VITE_API_URL`).

### Option C — Backend Only

```bash
cd portfolio-api
npm install
npm run dev
```

Requires PostgreSQL and Redis running locally (or via Docker). See [Environment Variables](#environment-variables).

### Local URLs

| Service | URL |
|---------|-----|
| Frontend | http://localhost:8080 |
| Backend API | http://localhost:3000/api/v1 |
| Health check | http://localhost:3000/api/v1/health/live |
| Swagger UI | http://localhost:3000/api/v1/docs |

---

## Frontend Architecture

### WebGL Aurora Background

The hero section background is a custom WebGL renderer built with React Three Fiber v8 (pinned to R3F v8 for React 18 compatibility — R3F v9 requires React 19).

**Component:** `portfolio-ui/src/components/AuroraBackground.tsx`

- Custom GLSL fragment shader with 3-layer perlin noise
- 15-second breathing cycle oscillation (`uTime` uniform)
- Mouse parallax tracking via `useRef` (throttled to 60fps, no re-renders)
- Theme-aware opacity: 35% in dark mode, 25% in light mode
- Device pixel ratio capped at `Math.min(devicePixelRatio, 2)` for performance
- Colors: primary blue `#2563eb` + violet + emerald blend
- CSS gradient fallback when `prefers-reduced-motion` is active or WebGL fails
- Full cleanup on unmount (Three.js geometry, material, renderer disposal)

The component is code-split from the main bundle via Vite `manualChunks`:

```
three-vendor chunk: ~269KB gzipped  (Three.js, R3F, Drei)
main chunk:         ~220KB gzipped  (down from 491KB before splitting)
```

### Sections

| Section | Component | Data Source |
|---------|-----------|-------------|
| Hero | `HeroSection.tsx` | `data/personal.ts` |
| Skills | `SkillsSection.tsx` | `data/skills.ts` |
| Projects | `ProjectsSection.tsx` | Backend API (TanStack Query) with static fallback |
| Experience | `ExperienceSection.tsx` | `data/experience.ts` |
| Blog | `BlogSection.tsx` | `data/blog.ts` |
| Contact | `ContactSection.tsx` | Backend API (`POST /api/v1/contact`) |

### Theming

Themes are managed via `next-themes`. CSS variables in `index.css` define the full token set (colors, radius, shadows). The theme toggle in the Navbar persists preference to `localStorage`.

### API Integration

API calls use `axios` wrapped in a service layer under `src/services/`. TanStack Query handles caching, loading states, and error boundaries. The `VITE_USE_API` env variable controls whether the frontend calls the live backend or uses static data.

### Profile Photo

> ⚠️ **Action required:** Place your profile photo at `portfolio-ui/public/images/profile.jpg`. The path is referenced in `portfolio-ui/src/data/personal.ts` (`profileImage: "/images/profile.jpg"`). The `public/images/` directory exists but the photo must be provided.

---

## Backend Architecture

### API Routes

| Method | Route | Description |
|--------|-------|-------------|
| GET | `/api/v1/health/live` | Liveness probe |
| GET | `/api/v1/health/ready` | Readiness probe (checks DB + Redis) |
| GET | `/api/v1/projects` | List projects (supports `?featured=true`) |
| POST | `/api/v1/contact` | Submit contact form |
| POST | `/api/v1/auth/login` | Login, returns JWT access + refresh tokens |
| POST | `/api/v1/auth/refresh` | Refresh access token |
| GET | `/api/v1/docs` | Swagger UI (development only) |

### Database Schema (Prisma)

The schema lives at `portfolio-api/prisma/schema.prisma`. Key models:

- **Project** — title, description, technologies, github/live URLs, featured flag, order
- **Contact** — name, email, message, status, timestamps
- **User** — email, hashedPassword, roles (for admin access)
- **RefreshToken** — token hash, userId, expiry (for JWT refresh rotation)

### Caching

Redis caches the projects list with a 5-minute TTL to reduce database load. BullMQ handles background jobs (email notifications for contact form submissions).

---

## Environment Variables

### Frontend (`portfolio-ui/.env`)

| Variable | Description | Default |
|----------|-------------|---------|
| `VITE_API_URL` | Backend API base URL | `http://localhost:3000` |
| `VITE_WS_URL` | WebSocket URL | `ws://localhost:3000` |
| `VITE_USE_API` | Enable live API calls (`true`/`false`) | `false` |

### Backend (`portfolio-api/.env`)

| Variable | Description | Example |
|----------|-------------|---------|
| `DATABASE_URL` | PostgreSQL connection string | `postgresql://portfolio:pass@localhost:5432/portfolio_db?schema=public` |
| `REDIS_URL` | Redis connection string | `redis://localhost:6379` |
| `JWT_SECRET` | Secret for signing JWT tokens | `openssl rand -hex 32` |
| `JWT_REFRESH_SECRET` | Secret for signing refresh tokens | `openssl rand -hex 32` |
| `PORT` | Backend server port | `3000` |
| `NODE_ENV` | `development` or `production` | `development` |
| `CORS_ORIGIN` | Allowed origin for CORS | `http://localhost:8080` |

> **Security note:** Never commit `.env` files. Generate secrets with `openssl rand -hex 32` (hex only — base64 produces `+/=` characters that break Prisma connection strings).

---

## Available Scripts

### Frontend (`portfolio-ui/`)

| Command | Description |
|---------|-------------|
| `npm run dev` | Start Vite dev server at `http://localhost:8080` |
| `npm run build` | Production build (outputs to `dist/`) |
| `npm run build:dev` | Development-mode build |
| `npm run preview` | Preview production build locally |
| `npm run lint` | Run ESLint |
| `npm run test` | Run all Vitest unit tests |
| `npm run test:watch` | Run Vitest in watch mode |
| `npm run test:coverage` | Run tests with coverage report |
| `npm run test:e2e` | Run Playwright E2E tests (headless) |
| `npm run test:e2e:ui` | Run Playwright E2E tests with UI explorer |

### Backend (`portfolio-api/`)

| Command | Description |
|---------|-------------|
| `npm run dev` | Start Fastify with hot-reload |
| `npm run build` | Compile TypeScript to `dist/` |
| `npm start` | Run compiled production build |
| `npx prisma migrate dev` | Apply migrations in development |
| `npx prisma migrate deploy` | Apply migrations in production |
| `npx prisma studio` | Open Prisma Studio (visual DB browser) |
| `npx prisma db seed` | Seed the database |

---

## Testing

### Unit Tests (Vitest + React Testing Library)

49 unit tests across components and data validation:

```bash
cd portfolio-ui

# Run all unit tests
npm run test

# Watch mode during development
npm run test:watch

# Coverage report (outputs to coverage/)
npm run test:coverage
```

**Test files:**

| File | What it covers |
|------|----------------|
| `src/components/__tests__/HeroSection.test.tsx` | Name, title, tagline, social links, aurora fallback, reduced-motion |
| `src/components/__tests__/Navbar.test.tsx` | Nav links, glass on scroll, theme toggle, mobile menu |
| `src/components/__tests__/AuroraBackground.test.tsx` | Mounts without error, reduced-motion fallback, unmount cleanup |
| `src/components/__tests__/SkillsSection.test.tsx` | Category toggle, skill bars, radar chart |
| `src/components/__tests__/ProjectsSection.test.tsx` | Static projects, loading skeleton, tech filter, error state |
| `src/components/__tests__/ContactSection.test.tsx` | Form fields, validation errors, success state |
| `src/components/__tests__/Footer.test.tsx` | Copyright year, social links with `https://`, nav links |
| `src/data/__tests__/personal.test.ts` | Tagline < 200 chars, LinkedIn starts with `https://`, email valid |

**Three.js mock strategy:** `@react-three/fiber` Canvas is mocked as a `<div>` in the Vitest setup file, avoiding WebGL in the jsdom environment.

### E2E Tests (Playwright)

50 E2E tests across desktop Chromium and mobile iPhone 13:

```bash
cd portfolio-ui

# Run all E2E tests (headless)
npm run test:e2e

# Interactive UI explorer (great for debugging)
npm run test:e2e:ui

# Install browsers if needed
npx playwright install chromium
```

> The Playwright web server config automatically starts `npm run dev` before running tests. If the dev server is already running, it reuses it.

**E2E test files:**

| File | What it covers |
|------|----------------|
| `e2e/navigation.spec.ts` | Page load, nav link scroll, mobile hamburger menu |
| `e2e/theme.spec.ts` | Dark/light toggle, persistence across page reload |
| `e2e/hero.spec.ts` | Hero content, CTA buttons, metrics, social links, WebGL/fallback |
| `e2e/projects.spec.ts` | Section heading, project cards or empty state |
| `e2e/contact.spec.ts` | Form renders, validation errors on empty submit |
| `e2e/accessibility.spec.ts` | Skip-to-content, image alt text, `aria-labelledby`, focus, social labels |

### Backend + Frontend End-to-End (Full Stack)

```bash
# Start full stack
docker compose -f docker-compose.dev.yml up -d

# Verify backend health
curl http://localhost:3000/api/v1/health/live
# → {"success":true,"data":{"alive":true}}

curl http://localhost:3000/api/v1/health/ready
# → {"success":true,"data":{"status":"ok"}}

# Verify projects endpoint
curl "http://localhost:3000/api/v1/projects?featured=true"

# Test contact form
curl -X POST http://localhost:3000/api/v1/contact \
  -H "Content-Type: application/json" \
  -d '{"name":"Test","email":"test@example.com","message":"Hello from the README"}'
# → 201 Created

# Run E2E tests against Docker stack (use port 3000 as base URL)
cd portfolio-ui && npm run test:e2e
```

---

## Deployment

### Homelab (MicroK8s + ArgoCD)

The homelab runs MicroK8s with a local Docker registry at `localhost:32000`. Kustomize overlays at `portfolio-api/k8s/overlays/homelab/` configure namespace, secrets, and storageClass. ArgoCD watches the `main` branch and auto-syncs on push.

#### DNS (add to `/etc/hosts` on Tailscale machines)

```
100.114.75.127  portfolio.homelab api.portfolio.homelab
```

#### Manual Deploy (if CI is unavailable)

```bash
ssh homelab-tailscale
cd ~/repos/Portofolio_Website && git pull

# Rebuild and push backend (monorepo root context required)
docker build -t localhost:32000/portfolio-backend:latest -f portfolio-api/Dockerfile .
docker push localhost:32000/portfolio-backend:latest

# Rebuild and push frontend
docker build -t localhost:32000/portfolio-frontend:latest portfolio-ui/
docker push localhost:32000/portfolio-frontend:latest

# Restart pods
microk8s kubectl rollout restart deployment/prod-backend-api -n prod
microk8s kubectl rollout restart deployment/prod-frontend -n prod
microk8s kubectl wait --for=condition=ready pod -l app.kubernetes.io/name=backend-api -n prod --timeout=120s
microk8s kubectl get pods -n prod
```

#### Verify Homelab Deployment

```bash
curl http://api.portfolio.homelab/api/v1/health/live
# → {"success":true,"data":{"alive":true}}
```

#### Homelab URLs

| Service | URL |
|---------|-----|
| Frontend | http://portfolio.homelab |
| Backend API | http://api.portfolio.homelab/api/v1 |
| Health check | http://api.portfolio.homelab/api/v1/health/live |

---

## Known Homelab Configuration

The following are applied directly on the cluster (not yet committed to manifests):

| Item | Applied Fix | Manifest Fix Needed |
|------|------------|-------------------|
| Ingress class | Patched to `ingressClassName: public` (MicroK8s uses `--ingress-class=public`) | Update overlays/homelab ingress patches |
| NetworkPolicies | Deleted both (wrong namespace label `name: ingress-nginx` vs actual `kubernetes.io/metadata.name=ingress`) | Fix namespace selector in base NetworkPolicy manifests |
| Redis protected-mode | Patched ConfigMap to `protected-mode no` | Update `k8s/base/redis/configmap.yaml` |
| Postgres password | Regenerated with `openssl rand -hex 32` (base64 generates URL-unsafe chars) | Document in runbook |

---

## Secrets Setup

### First-Time Homelab Setup

```bash
# Generate URL-safe passwords (hex only — base64 produces +/= which break Prisma)
DB_PASS=$(openssl rand -hex 32)
JWT_SECRET=$(openssl rand -hex 32)
JWT_REFRESH=$(openssl rand -hex 32)

microk8s kubectl create secret generic postgres-secrets -n prod \
  --from-literal=POSTGRES_PASSWORD=$DB_PASS \
  --from-literal=POSTGRES_USER=portfolio \
  --from-literal=POSTGRES_DB=portfolio_db

microk8s kubectl create secret generic prod-backend-secrets -n prod \
  --from-literal=DATABASE_URL="postgresql://portfolio:${DB_PASS}@postgres:5432/portfolio_db?schema=public" \
  --from-literal=JWT_SECRET=$JWT_SECRET \
  --from-literal=JWT_REFRESH_SECRET=$JWT_REFRESH \
  --from-literal=REDIS_URL=redis://redis:6379
```

---

## CI/CD

GitHub Actions workflows live in `.github/workflows/`. Pushes to `main` trigger:

1. Build & push Docker images to `localhost:32000` via self-hosted runner on homelab
2. ArgoCD auto-syncs Kustomize manifests to the `prod` namespace

The self-hosted runner runs as a non-root user with least-privilege sudo rules (not as root).

---

## Troubleshooting

### WebGL / Aurora Not Rendering

- Check browser console for WebGL errors
- Safari on iOS may require enabling WebGL in Settings → Safari → Advanced → Experimental Features
- The CSS gradient fallback activates automatically; no user action needed

### Three.js Bundle Too Large

The Vite config splits Three.js into a separate `three-vendor` chunk. If bundle size regresses, verify `vite.config.ts` still has:

```ts
build: {
  rollupOptions: {
    output: {
      manualChunks: {
        'three-vendor': ['three', '@react-three/fiber', '@react-three/drei'],
      },
    },
  },
},
```

### Projects Section Shows Empty State

The projects section makes an API call even in static mode due to React Query initialization. If the backend is unavailable, the static fallback renders after the query times out (~10s). To use static data only, set `VITE_USE_API=false` in `.env`.

### Docker Build Fails (shared/ package not found)

The backend Dockerfile must be built from the **monorepo root**, not from `portfolio-api/`:

```bash
# Correct ✓
docker build -t portfolio-backend -f portfolio-api/Dockerfile .

# Wrong ✗
cd portfolio-api && docker build -t portfolio-backend .
```

### Prisma Migration Errors

Prisma requires OpenSSL in both the builder and production Docker stages. The Alpine target engine is `linux-musl-openssl-3.0.x`. If you see `PrismaClientInitializationError`, verify the Dockerfile includes:

```dockerfile
RUN apk add --no-cache openssl
```

### E2E Tests Failing on Projects Section

React Query fires an API request even when `VITE_USE_API=false`. Without a backend, the request errors and the static fallback renders with a delay. If tests are timing out, increase the `waitForSelector` timeout in `e2e/projects.spec.ts` or ensure the full stack is running via Docker Compose.

### Database Connection Issues

Verify the connection string format. Base64-encoded passwords can contain `+`, `/`, and `=` characters that break Prisma's URL parser. Always generate passwords with:

```bash
openssl rand -hex 32
```

---

## Development Notes

- **TypeScript build:** Uses `tsc || true` to emit despite type errors — type errors exist in several service files and should be addressed
- **shared/ package:** Local file dependency (`file:../shared`) — must be built before the API; Docker Compose handles this automatically
- **Prisma OpenSSL:** Required in **both** builder and production Docker stages (Alpine: `linux-musl-openssl-3.0.x`)
- **ESM vs CJS:** `module: "NodeNext"` outputs CJS — do not use `import.meta.url` or `fileURLToPath` in backend source files
- **R3F version pinning:** React Three Fiber is pinned to `^8.17.0` (not v9) because R3F v9 requires React >=19; this project uses React 18.3.x
- **Profile photo:** Must be placed at `portfolio-ui/public/images/profile.jpg` — the directory exists but the file is not committed
