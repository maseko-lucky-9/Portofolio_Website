# Portfolio Website

A full-stack developer portfolio with a React/Vite frontend, Fastify/Node.js backend API, PostgreSQL database, and Redis cache — deployed on a self-hosted MicroK8s homelab via GitOps (ArgoCD).

---

## Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18, TypeScript, Vite, shadcn-ui, Tailwind CSS |
| Backend | Fastify 5, Node.js 20, TypeScript, Prisma ORM |
| Database | PostgreSQL 16 |
| Cache / Queue | Redis 7, BullMQ |
| Orchestration | MicroK8s (self-hosted homelab) |
| CI/CD | GitHub Actions + ArgoCD (GitOps) |
| Container Registry | MicroK8s local registry (`localhost:32000`) |
| Auth | JWT (access + refresh tokens), bcrypt |
| API Docs | Fastify Swagger UI (`/api/v1/docs`) |

---

## Monorepo Structure

```
portfolio-website/
├── portfolio-api/          # Fastify backend API
│   ├── src/
│   ├── prisma/             # Schema & migrations
│   ├── k8s/                # Kubernetes manifests (base + overlays)
│   └── Dockerfile          # Multi-stage — requires monorepo root context
├── portfolio-ui/           # React frontend SPA
│   ├── src/
│   ├── nginx.conf          # Nginx SPA config
│   └── Dockerfile          # Multi-stage — self-contained context
├── shared/                 # Shared TypeScript types & utilities
├── docker-compose.dev.yml  # Full-stack local testing (Docker)
└── .github/workflows/      # CI/CD pipelines
```

---

## Local Development (Docker Compose)

Run the full stack locally — postgres, redis, backend API, and frontend:

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

> **Important:** The backend Dockerfile requires the **monorepo root** as build context (`context: .`) so `COPY shared/` resolves correctly.

### Local URLs

| Service | URL |
|---------|-----|
| Frontend | http://localhost:8080 |
| Backend API | http://localhost:3000/api/v1 |
| Health check | http://localhost:3000/api/v1/health/live |
| Swagger UI | http://localhost:3000/api/v1/docs |

---

## Homelab Deployment

The homelab runs MicroK8s with a local Docker registry at `localhost:32000`. Kustomize overlays at `portfolio-api/k8s/overlays/homelab/` configure namespace, secrets, and storageClass.

### DNS (add to `/etc/hosts` on Tailscale machines)

```
100.114.75.127  portfolio.homelab api.portfolio.homelab
```

### Deploy

```bash
ssh homelab-tailscale
cd ~/repos/Portofolio_Website && git pull

# Rebuild and push backend (monorepo root context required)
docker build -t localhost:32000/portfolio-backend:latest -f portfolio-api/Dockerfile .
docker push localhost:32000/portfolio-backend:latest

# Restart backend pods
microk8s kubectl rollout restart deployment/prod-backend-api -n prod
microk8s kubectl wait --for=condition=ready pod -l app.kubernetes.io/name=backend-api -n prod --timeout=120s
microk8s kubectl get pods -n prod
```

### Verify

```bash
curl http://api.portfolio.homelab/api/v1/health/live
# → {"success":true,"data":{"alive":true}}
```

### Homelab URLs

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

## Secrets Setup (First-Time Homelab)

```bash
# Generate URL-safe passwords (hex only — base64 produces +/= which break Prisma)
DB_PASS=$(openssl rand -hex 32)

microk8s kubectl create secret generic postgres-secrets -n prod \
  --from-literal=POSTGRES_PASSWORD=$DB_PASS \
  --from-literal=POSTGRES_USER=portfolio \
  --from-literal=POSTGRES_DB=portfolio_db

microk8s kubectl create secret generic prod-backend-secrets -n prod \
  --from-literal=DATABASE_URL="postgresql://portfolio:${DB_PASS}@postgres:5432/portfolio_db?schema=public" \
  --from-literal=JWT_SECRET=$(openssl rand -hex 32) \
  --from-literal=REDIS_URL=redis://redis:6379
```

---

## CI/CD

GitHub Actions workflows live in `.github/workflows/`. Pushes to `main` trigger:
1. Build & push Docker images to `localhost:32000` via self-hosted runner on homelab
2. ArgoCD auto-syncs Kustomize manifests to the `prod` namespace

---

## Development Notes

- TypeScript build uses `tsc || true` to emit despite type errors — type errors exist in several service files and should be fixed
- `shared/` package is a local file dependency (`file:../shared`) — must be built before the API
- Prisma requires OpenSSL installed in **both** the builder and production Docker stages (Alpine target: `linux-musl-openssl-3.0.x`)
- Node.js `module: "NodeNext"` outputs CJS — do not use `import.meta.url` or `fileURLToPath` in source files
