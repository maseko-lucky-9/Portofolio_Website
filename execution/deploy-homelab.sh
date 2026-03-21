#!/usr/bin/env bash
# ==============================================
# Portfolio Website — Homelab Deployment Script
# Builds images locally, pushes to MicroK8s registry,
# and deploys the full stack via kustomize.
#
# Secrets are managed by Vault via External Secrets
# Operator. Run vault-setup.sh first if not done.
#
# Prerequisites:
#   - MicroK8s with addons: dns, storage, ingress, registry
#   - Docker installed (for building images)
#   - Vault setup complete (bash execution/vault-setup.sh)
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
echo "[1/8] Checking MicroK8s registry addon..."
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
echo "[2/8] Ensuring namespace '${NAMESPACE}' exists..."
microk8s kubectl create namespace "${NAMESPACE}" --dry-run=client -o yaml | microk8s kubectl apply -f -
echo "  ✓ Namespace ready"

# -----------------------------------------------
# Step 3: Build backend Docker image
# -----------------------------------------------
echo ""
echo "[3/8] Building backend image..."
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
echo "[4/8] Building frontend image..."
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
# Step 5: Deploy Vault ESO resources
# -----------------------------------------------
echo ""
echo "[5/8] Deploying Vault SecretStore + ServiceAccount..."
microk8s kubectl apply -k "${REPO_ROOT}/portfolio-api/k8s/base/vault/" -n "${NAMESPACE}" 2>&1 | sed 's/^/    /'
echo "  ✓ Vault ESO resources deployed"

# -----------------------------------------------
# Step 6: Deploy infrastructure (database + redis)
# -----------------------------------------------
echo ""
echo "[6/8] Deploying infrastructure..."

echo "  → Deploying PostgreSQL..."
microk8s kubectl apply -k "${REPO_ROOT}/portfolio-api/k8s/base/database/" -n "${NAMESPACE}" 2>&1 | sed 's/^/    /'

echo "  → Deploying Redis..."
microk8s kubectl apply -k "${REPO_ROOT}/portfolio-api/k8s/base/redis/" -n "${NAMESPACE}" 2>&1 | sed 's/^/    /'

echo "  → Waiting for ExternalSecrets to sync..."
microk8s kubectl wait --for=condition=SecretSynced externalsecret/postgres-secrets -n "${NAMESPACE}" --timeout=120s 2>&1 | sed 's/^/    /' || echo "    ⚠ Postgres ExternalSecret not synced yet"
microk8s kubectl wait --for=condition=SecretSynced externalsecret/redis-secrets -n "${NAMESPACE}" --timeout=120s 2>&1 | sed 's/^/    /' || echo "    ⚠ Redis ExternalSecret not synced yet"

echo "  → Waiting for database to be ready (up to 120s)..."
microk8s kubectl wait --for=condition=ready pod -l app.kubernetes.io/name=postgres -n "${NAMESPACE}" --timeout=120s 2>&1 | sed 's/^/    /' || echo "    ⚠ Postgres not ready yet — continuing anyway"

echo "  → Waiting for Redis to be ready (up to 60s)..."
microk8s kubectl wait --for=condition=ready pod -l app.kubernetes.io/name=redis -n "${NAMESPACE}" --timeout=60s 2>&1 | sed 's/^/    /' || echo "    ⚠ Redis not ready yet — continuing anyway"

echo "  ✓ Infrastructure deployed"

# -----------------------------------------------
# Step 7: Deploy application (backend + frontend)
# -----------------------------------------------
echo ""
echo "[7/8] Deploying application..."

echo "  → Deploying Backend API..."
microk8s kubectl apply -k "${REPO_ROOT}/portfolio-api/k8s/overlays/prod/" 2>&1 | sed 's/^/    /'

echo "  → Deploying Frontend..."
microk8s kubectl apply -k "${REPO_ROOT}/portfolio-ui/k8s/overlays/prod/" 2>&1 | sed 's/^/    /'

echo "  → Waiting for backend ExternalSecret to sync..."
microk8s kubectl wait --for=condition=SecretSynced externalsecret/prod-backend-secrets -n "${NAMESPACE}" --timeout=120s 2>&1 | sed 's/^/    /' || echo "    ⚠ Backend ExternalSecret not synced yet"

echo "  ✓ Application deployed"

# -----------------------------------------------
# Step 8: Verify deployment
# -----------------------------------------------
echo ""
echo "[8/8] Verifying deployment..."
echo ""
echo "  ExternalSecrets:"
microk8s kubectl get externalsecrets -n "${NAMESPACE}" 2>&1 | sed 's/^/    /'
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
