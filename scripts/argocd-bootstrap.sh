#!/bin/bash
# ==============================================
# ArgoCD Bootstrap Script — Homelab MicroK8s
# Run once to install ArgoCD and seed app-of-apps
# ==============================================
# Usage:
#   ./scripts/argocd-bootstrap.sh
#
# Prerequisites:
#   - kubectl context must be set to the MicroK8s homelab cluster
#   - Tailscale must be connected if accessing over VPN
# ==============================================

set -euo pipefail

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

log()  { echo -e "${GREEN}[INFO]${NC}  $*"; }
warn() { echo -e "${YELLOW}[WARN]${NC}  $*"; }
err()  { echo -e "${RED}[ERROR]${NC} $*" >&2; }

ARGOCD_VERSION="${ARGOCD_VERSION:-stable}"
ARGOCD_NAMESPACE="argocd"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(dirname "$SCRIPT_DIR")"

# ── Preflight ──────────────────────────────────────────────────────────────
log "Checking kubectl connectivity..."
if ! kubectl cluster-info &>/dev/null; then
  err "Cannot reach cluster. Is kubectl context set to the homelab? (current: $(kubectl config current-context 2>/dev/null || echo 'none'))"
  exit 1
fi

CONTEXT=$(kubectl config current-context)
log "Using context: ${CONTEXT}"
if [[ "$CONTEXT" == "docker-desktop" ]]; then
  warn "Context is docker-desktop — this will deploy to your local Docker Desktop cluster, NOT the homelab."
  read -rp "Continue anyway? [y/N] " confirm
  [[ "$confirm" =~ ^[Yy]$ ]] || { log "Aborted."; exit 0; }
fi

# ── Install ArgoCD ─────────────────────────────────────────────────────────
log "Creating namespace ${ARGOCD_NAMESPACE}..."
kubectl create namespace "$ARGOCD_NAMESPACE" --dry-run=client -o yaml | kubectl apply -f -

log "Installing ArgoCD (${ARGOCD_VERSION})..."
kubectl apply -n "$ARGOCD_NAMESPACE" \
  -f "https://raw.githubusercontent.com/argoproj/argo-cd/${ARGOCD_VERSION}/manifests/install.yaml"

log "Waiting for ArgoCD server to be ready..."
kubectl rollout status deployment/argocd-server -n "$ARGOCD_NAMESPACE" --timeout=300s

# ── Patch service to NodePort for homelab access ───────────────────────────
log "Exposing ArgoCD via NodePort..."
kubectl patch svc argocd-server -n "$ARGOCD_NAMESPACE" \
  -p '{"spec":{"type":"NodePort"}}'

# ── Apply App-of-Apps ──────────────────────────────────────────────────────
log "Applying backend app-of-apps..."
kubectl apply -f "${REPO_ROOT}/portfolio-api/k8s/argocd/backend-app-of-apps.yaml"

log "Applying frontend app-of-apps..."
kubectl apply -f "${REPO_ROOT}/portfolio-ui/k8s/argocd/app-of-apps.yaml"

# ── Print initial admin password ───────────────────────────────────────────
log "Retrieving initial admin password..."
INITIAL_PASSWORD=$(kubectl get secret argocd-initial-admin-secret \
  -n "$ARGOCD_NAMESPACE" \
  -o jsonpath="{.data.password}" | base64 -d 2>/dev/null || echo "")

if [[ -n "$INITIAL_PASSWORD" ]]; then
  log "ArgoCD initial admin password: ${INITIAL_PASSWORD}"
  warn "Change this password immediately after first login."
else
  warn "Could not retrieve initial password. Run:"
  echo "  kubectl get secret argocd-initial-admin-secret -n argocd -o jsonpath='{.data.password}' | base64 -d"
fi

log "ArgoCD NodePort:"
kubectl get svc argocd-server -n "$ARGOCD_NAMESPACE" | grep -E "NAME|argocd"

log "Bootstrap complete. ArgoCD will sync apps from GitHub automatically."
log "Track sync status with: kubectl get apps -n argocd"
