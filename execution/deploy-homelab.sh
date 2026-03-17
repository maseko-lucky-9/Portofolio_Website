#!/usr/bin/env bash
# ==============================================
# Portfolio Website — Homelab Deployment Script
# Builds images locally, pushes to MicroK8s registry,
# and deploys the full stack via kustomize.
#
# Prerequisites:
#   - MicroK8s with addons: dns, storage, ingress, registry
#   - Docker installed (for building images)
#   - This repo cloned on the homelab server
#
# Usage:
#   cd ~/repos/Portofolio_Website
#   bash execution/deploy-homelab.sh
# ==============================================

set -euo pipefail

REGISTRY="localhost:32000"
NAMESPACE="prod"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "${SCRIPT_DIR}/.." && pwd)"

echo "================================================"
echo "Portfolio Website — Homelab Deployment"
echo "Registry: ${REGISTRY}"
echo "Namespace: ${NAMESPACE}"
echo "Repo root: ${REPO_ROOT}"
echo "================================================"

# -----------------------------------------------
# Step 1: Enable MicroK8s registry if not already
# -----------------------------------------------
echo ""
echo "[1/7] Checking MicroK8s registry addon..."
if microk8s status --addon registry 2>/dev/null | grep -q "enabled"; then
  echo "  ✓ Registry addon already enabled"
else
  echo "  → Enabling MicroK8s registry addon..."
  microk8s enable registry
  echo "  ✓ Registry enabled at ${REGISTRY}"
fi

# -----------------------------------------------
# Step 2: Create namespace if it doesn't exist
# -----------------------------------------------
echo ""
echo "[2/7] Ensuring namespace '${NAMESPACE}' exists..."
microk8s kubectl create namespace "${NAMESPACE}" --dry-run=client -o yaml | microk8s kubectl apply -f -
echo "  ✓ Namespace ready"

# -----------------------------------------------
# Step 3: Build backend Docker image
# -----------------------------------------------
echo ""
echo "[3/7] Building backend image..."
# Build context is monorepo root (backend needs access to shared/ package)
docker build \
  -t "${REGISTRY}/portfolio-backend:latest" \
  -f "${REPO_ROOT}/portfolio-api/Dockerfile" \
  "${REPO_ROOT}"
echo "  ✓ Backend image built"

echo "  → Pushing to local registry..."
docker push "${REGISTRY}/portfolio-backend:latest"
echo "  ✓ Backend image pushed"

# -----------------------------------------------
# Step 4: Build frontend Docker image
# -----------------------------------------------
echo ""
echo "[4/7] Building frontend image..."
docker build \
  -t "${REGISTRY}/portfolio-frontend:latest" \
  --build-arg VITE_API_URL=http://api.portfolio.homelab \
  --build-arg VITE_API_VERSION=v1 \
  --build-arg VITE_USE_API=true \
  --build-arg VITE_ENABLE_MSW=false \
  -f "${REPO_ROOT}/portfolio-ui/Dockerfile" \
  "${REPO_ROOT}/portfolio-ui"
echo "  ✓ Frontend image built"

echo "  → Pushing to local registry..."
docker push "${REGISTRY}/portfolio-frontend:latest"
echo "  ✓ Frontend image pushed"

# -----------------------------------------------
# Step 5: Create secrets (idempotent)
# -----------------------------------------------
echo ""
echo "[5/7] Creating secrets (if not already present)..."

# PostgreSQL secrets
if ! microk8s kubectl get secret postgres-secrets -n "${NAMESPACE}" &>/dev/null; then
  PG_PASS=$(openssl rand -base64 32)
  microk8s kubectl create secret generic postgres-secrets \
    --from-literal=username=portfolio_user \
    --from-literal=password="${PG_PASS}" \
    --from-literal=postgres-password="${PG_PASS}" \
    --namespace="${NAMESPACE}"
  echo "  ✓ PostgreSQL secrets created"

  # Store PG_PASS for backend-secrets construction
  export PG_PASS
else
  echo "  ✓ PostgreSQL secrets already exist"
  PG_PASS=$(microk8s kubectl get secret postgres-secrets -n "${NAMESPACE}" -o jsonpath='{.data.password}' | base64 -d)
fi

# Redis secrets
if ! microk8s kubectl get secret redis-secrets -n "${NAMESPACE}" &>/dev/null; then
  REDIS_PASS=$(openssl rand -base64 32)
  microk8s kubectl create secret generic redis-secrets \
    --from-literal=password="${REDIS_PASS}" \
    --namespace="${NAMESPACE}"
  echo "  ✓ Redis secrets created"
else
  echo "  ✓ Redis secrets already exist"
fi

# Backend API secrets
if ! microk8s kubectl get secret backend-secrets -n "${NAMESPACE}" &>/dev/null; then
  JWT_SECRET=$(openssl rand -hex 32)
  microk8s kubectl create secret generic backend-secrets \
    --from-literal=database-url="postgresql://portfolio_user:${PG_PASS}@prod-postgres:5432/portfolio" \
    --from-literal=redis-url="redis://prod-redis:6379" \
    --from-literal=jwt-secret="${JWT_SECRET}" \
    --from-literal=jwt-access-expiry="15m" \
    --from-literal=jwt-refresh-expiry="7d" \
    --namespace="${NAMESPACE}"
  echo "  ✓ Backend secrets created"
else
  echo "  ✓ Backend secrets already exist"
fi

# -----------------------------------------------
# Step 6: Deploy via kustomize
# -----------------------------------------------
echo ""
echo "[6/7] Deploying via kustomize..."

# Database first
echo "  → Deploying PostgreSQL..."
microk8s kubectl apply -k "${REPO_ROOT}/portfolio-api/k8s/base/database/" 2>&1 | sed 's/^/    /'

echo "  → Deploying Redis..."
microk8s kubectl apply -k "${REPO_ROOT}/portfolio-api/k8s/base/redis/" 2>&1 | sed 's/^/    /'

echo "  → Waiting for database to be ready (up to 120s)..."
microk8s kubectl wait --for=condition=ready pod -l app=postgres -n "${NAMESPACE}" --timeout=120s 2>&1 | sed 's/^/    /' || echo "    ⚠ Postgres not ready yet — continuing anyway"

echo "  → Waiting for Redis to be ready (up to 60s)..."
microk8s kubectl wait --for=condition=ready pod -l app=redis -n "${NAMESPACE}" --timeout=60s 2>&1 | sed 's/^/    /' || echo "    ⚠ Redis not ready yet — continuing anyway"

# Backend API
echo "  → Deploying Backend API..."
microk8s kubectl apply -k "${REPO_ROOT}/portfolio-api/k8s/overlays/prod/" 2>&1 | sed 's/^/    /'

# Frontend
echo "  → Deploying Frontend..."
microk8s kubectl apply -k "${REPO_ROOT}/portfolio-ui/k8s/overlays/prod/" 2>&1 | sed 's/^/    /'

echo "  ✓ All manifests applied"

# -----------------------------------------------
# Step 7: Verify deployment
# -----------------------------------------------
echo ""
echo "[7/7] Verifying deployment..."
echo ""
echo "  Pods:"
microk8s kubectl get pods -n "${NAMESPACE}" -o wide 2>&1 | sed 's/^/    /'
echo ""
echo "  Services:"
microk8s kubectl get svc -n "${NAMESPACE}" 2>&1 | sed 's/^/    /'
echo ""
echo "  Ingress:"
microk8s kubectl get ingress -n "${NAMESPACE}" 2>&1 | sed 's/^/    /'

echo ""
echo "================================================"
echo "Deployment complete!"
echo ""
echo "Add to /etc/hosts on your Tailscale machines:"
echo "  100.114.75.127  portfolio.homelab api.portfolio.homelab"
echo ""
echo "Then visit:"
echo "  Frontend: http://portfolio.homelab"
echo "  API:      http://api.portfolio.homelab/api/v1/health/live"
echo "================================================"
