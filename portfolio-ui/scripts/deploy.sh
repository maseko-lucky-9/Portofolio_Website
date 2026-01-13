#!/bin/bash
# ==============================================
# Frontend Deployment Script
# Supports: Kustomize, Helm, and ArgoCD
# ==============================================

set -euo pipefail

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
K8S_DIR="$PROJECT_ROOT/k8s"
HELM_DIR="$PROJECT_ROOT/helm/frontend-portfolio"

# Default values
ENVIRONMENT=""
METHOD="kustomize"
NAMESPACE=""
DRY_RUN=false
SKIP_TESTS=false

# Usage information
usage() {
  cat << EOF
Usage: $0 -e ENVIRONMENT [-m METHOD] [-n NAMESPACE] [-d] [-s]

Deploy frontend application to Kubernetes

Options:
  -e, --environment    Environment (dev, staging, prod) [REQUIRED]
  -m, --method         Deployment method (kustomize, helm, argocd) [default: kustomize]
  -n, --namespace      Override namespace [default: same as environment]
  -d, --dry-run        Perform dry run only
  -s, --skip-tests     Skip smoke tests after deployment
  -h, --help           Show this help message

Examples:
  # Deploy to dev using Kustomize
  $0 -e dev

  # Deploy to prod using Helm with custom namespace
  $0 -e prod -m helm -n production

  # Dry run deployment to staging
  $0 -e staging -d

EOF
  exit 1
}

# Logging functions
log_info() {
  echo -e "${GREEN}[INFO]${NC} $1"
}

log_warn() {
  echo -e "${YELLOW}[WARN]${NC} $1"
}

log_error() {
  echo -e "${RED}[ERROR]${NC} $1"
}

# Parse arguments
while [[ $# -gt 0 ]]; do
  case $1 in
    -e|--environment)
      ENVIRONMENT="$2"
      shift 2
      ;;
    -m|--method)
      METHOD="$2"
      shift 2
      ;;
    -n|--namespace)
      NAMESPACE="$2"
      shift 2
      ;;
    -d|--dry-run)
      DRY_RUN=true
      shift
      ;;
    -s|--skip-tests)
      SKIP_TESTS=true
      shift
      ;;
    -h|--help)
      usage
      ;;
    *)
      log_error "Unknown option: $1"
      usage
      ;;
  esac
done

# Validate required arguments
if [[ -z "$ENVIRONMENT" ]]; then
  log_error "Environment is required"
  usage
fi

# Set namespace if not provided
if [[ -z "$NAMESPACE" ]]; then
  NAMESPACE="$ENVIRONMENT"
fi

# Validate environment
if [[ ! "$ENVIRONMENT" =~ ^(dev|staging|prod)$ ]]; then
  log_error "Invalid environment: $ENVIRONMENT (must be dev, staging, or prod)"
  exit 1
fi

# Validate method
if [[ ! "$METHOD" =~ ^(kustomize|helm|argocd)$ ]]; then
  log_error "Invalid method: $METHOD (must be kustomize, helm, or argocd)"
  exit 1
fi

# Check prerequisites
check_prerequisites() {
  log_info "Checking prerequisites..."
  
  if ! command -v kubectl &> /dev/null; then
    log_error "kubectl not found. Please install kubectl."
    exit 1
  fi
  
  if [[ "$METHOD" == "kustomize" ]] && ! command -v kustomize &> /dev/null; then
    log_warn "kustomize not found. Using kubectl kustomize instead."
  fi
  
  if [[ "$METHOD" == "helm" ]] && ! command -v helm &> /dev/null; then
    log_error "helm not found. Please install Helm."
    exit 1
  fi
  
  if [[ "$METHOD" == "argocd" ]] && ! command -v argocd &> /dev/null; then
    log_error "argocd CLI not found. Please install ArgoCD CLI."
    exit 1
  fi
  
  log_info "Prerequisites check passed"
}

# Verify kubectl context
verify_context() {
  local current_context
  current_context=$(kubectl config current-context)
  
  log_warn "Current kubectl context: $current_context"
  
  if [[ "$ENVIRONMENT" == "prod" ]] && [[ "$DRY_RUN" == "false" ]]; then
    log_warn "You are about to deploy to PRODUCTION!"
    read -p "Type 'yes' to continue: " -r
    if [[ ! $REPLY =~ ^[Yy][Ee][Ss]$ ]]; then
      log_info "Deployment cancelled"
      exit 0
    fi
  fi
}

# Deploy using Kustomize
deploy_kustomize() {
  log_info "Deploying using Kustomize to $NAMESPACE..."
  
  local overlay_path="$K8S_DIR/overlays/$ENVIRONMENT"
  
  if [[ ! -d "$overlay_path" ]]; then
    log_error "Overlay not found: $overlay_path"
    exit 1
  fi
  
  if [[ "$DRY_RUN" == "true" ]]; then
    kubectl kustomize "$overlay_path"
  else
    kubectl apply -k "$overlay_path"
  fi
}

# Deploy using Helm
deploy_helm() {
  log_info "Deploying using Helm to $NAMESPACE..."
  
  local values_file="$HELM_DIR/values-${ENVIRONMENT}.yaml"
  
  if [[ ! -f "$values_file" ]]; then
    log_error "Values file not found: $values_file"
    exit 1
  fi
  
  local helm_args=(
    "frontend-$ENVIRONMENT"
    "$HELM_DIR"
    -f "$values_file"
    -n "$NAMESPACE"
    --create-namespace
  )
  
  if [[ "$DRY_RUN" == "true" ]]; then
    helm template "${helm_args[@]}"
  else
    helm upgrade --install "${helm_args[@]}" --wait --timeout 5m
  fi
}

# Deploy using ArgoCD
deploy_argocd() {
  log_info "Deploying using ArgoCD to $NAMESPACE..."
  
  local app_file="$K8S_DIR/argocd/application-${ENVIRONMENT}.yaml"
  
  if [[ ! -f "$app_file" ]]; then
    log_error "ArgoCD application file not found: $app_file"
    exit 1
  fi
  
  if [[ "$DRY_RUN" == "true" ]]; then
    cat "$app_file"
  else
    kubectl apply -f "$app_file"
    log_info "Syncing ArgoCD application..."
    argocd app sync "frontend-$ENVIRONMENT" --prune
    argocd app wait "frontend-$ENVIRONMENT" --health --timeout 300
  fi
}

# Wait for rollout
wait_for_rollout() {
  if [[ "$DRY_RUN" == "true" ]]; then
    return 0
  fi
  
  log_info "Waiting for deployment rollout..."
  
  if ! kubectl rollout status deployment/frontend-portfolio-$ENVIRONMENT -n "$NAMESPACE" --timeout=5m; then
    log_error "Deployment rollout failed"
    exit 1
  fi
  
  log_info "Deployment rollout completed successfully"
}

# Run smoke tests
run_smoke_tests() {
  if [[ "$SKIP_TESTS" == "true" ]] || [[ "$DRY_RUN" == "true" ]]; then
    log_warn "Skipping smoke tests"
    return 0
  fi
  
  log_info "Running smoke tests..."
  
  if [[ -x "$SCRIPT_DIR/smoke-test.sh" ]]; then
    "$SCRIPT_DIR/smoke-test.sh" -e "$ENVIRONMENT" -n "$NAMESPACE"
  else
    log_warn "Smoke test script not found or not executable"
  fi
}

# Main execution
main() {
  log_info "Starting deployment to $ENVIRONMENT using $METHOD"
  
  check_prerequisites
  verify_context
  
  case "$METHOD" in
    kustomize)
      deploy_kustomize
      ;;
    helm)
      deploy_helm
      ;;
    argocd)
      deploy_argocd
      ;;
  esac
  
  wait_for_rollout
  run_smoke_tests
  
  log_info "Deployment completed successfully!"
  log_info "View resources: kubectl get all -n $NAMESPACE"
  log_info "View logs: kubectl logs -f deployment/frontend-portfolio-$ENVIRONMENT -n $NAMESPACE"
}

main
