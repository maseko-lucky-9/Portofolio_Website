#!/bin/bash
# ==============================================
# MicroK8s Setup Script
# Installs and configures MicroK8s cluster
# ==============================================

set -euo pipefail

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

log_info() { echo -e "${GREEN}[SETUP]${NC} $1"; }
log_warn() { echo -e "${YELLOW}[WARN]${NC} $1"; }
log_error() { echo -e "${RED}[ERROR]${NC} $1"; }

# Check if running on Linux
check_os() {
  if [[ "$(uname -s)" != "Linux" ]]; then
    log_error "This script only supports Linux. For other OS, use Docker Desktop with Kubernetes."
    exit 1
  fi
}

# Install MicroK8s
install_microk8s() {
  log_info "Installing MicroK8s..."
  
  if command -v microk8s &> /dev/null; then
    log_info "MicroK8s already installed"
    return 0
  fi
  
  sudo snap install microk8s --classic --channel=1.28/stable
  
  # Add user to microk8s group
  sudo usermod -a -G microk8s "$USER"
  sudo chown -f -R "$USER" ~/.kube
  
  log_warn "You may need to log out and back in for group changes to take effect"
  log_info "Run: newgrp microk8s"
}

# Wait for MicroK8s to be ready
wait_for_ready() {
  log_info "Waiting for MicroK8s to be ready..."
  microk8s status --wait-ready
  log_info "MicroK8s is ready"
}

# Enable required addons
enable_addons() {
  log_info "Enabling MicroK8s addons..."
  
  microk8s enable dns
  microk8s enable storage
  microk8s enable ingress
  microk8s enable metallb:10.64.140.43-10.64.140.49
  
  log_info "Waiting for addons to be ready..."
  sleep 10
}

# Install cert-manager
install_cert_manager() {
  log_info "Installing cert-manager..."
  
  microk8s kubectl apply -f https://github.com/cert-manager/cert-manager/releases/download/v1.13.0/cert-manager.yaml
  
  log_info "Waiting for cert-manager to be ready..."
  microk8s kubectl wait --for=condition=available --timeout=300s deployment/cert-manager -n cert-manager
  microk8s kubectl wait --for=condition=available --timeout=300s deployment/cert-manager-webhook -n cert-manager
  microk8s kubectl wait --for=condition=available --timeout=300s deployment/cert-manager-cainjector -n cert-manager
}

# Install ArgoCD
install_argocd() {
  log_info "Installing ArgoCD..."
  
  microk8s kubectl create namespace argocd --dry-run=client -o yaml | microk8s kubectl apply -f -
  microk8s kubectl apply -n argocd -f https://raw.githubusercontent.com/argoproj/argo-cd/stable/manifests/install.yaml
  
  log_info "Waiting for ArgoCD to be ready..."
  microk8s kubectl wait --for=condition=available --timeout=300s deployment/argocd-server -n argocd
  
  # Get initial admin password
  local password
  password=$(microk8s kubectl -n argocd get secret argocd-initial-admin-secret -o jsonpath="{.data.password}" | base64 -d)
  
  log_info "ArgoCD installed successfully"
  log_info "Access ArgoCD UI:"
  log_info "  kubectl port-forward svc/argocd-server -n argocd 8080:443"
  log_info "  URL: https://localhost:8080"
  log_info "  Username: admin"
  log_info "  Password: $password"
}

# Create namespaces
create_namespaces() {
  log_info "Creating application namespaces..."
  
  for ns in dev staging prod; do
    microk8s kubectl create namespace "$ns" --dry-run=client -o yaml | microk8s kubectl apply -f -
    log_info "Created namespace: $ns"
  done
}

# Configure kubectl
configure_kubectl() {
  log_info "Configuring kubectl..."
  
  if ! command -v kubectl &> /dev/null; then
    sudo snap install kubectl --classic
  fi
  
  microk8s config > ~/.kube/config
  log_info "kubectl configured to use MicroK8s"
}

# Install ArgoCD CLI
install_argocd_cli() {
  log_info "Installing ArgoCD CLI..."
  
  if command -v argocd &> /dev/null; then
    log_info "ArgoCD CLI already installed"
    return 0
  fi
  
  local version="v2.9.3"
  curl -sSL -o /tmp/argocd-linux-amd64 "https://github.com/argoproj/argo-cd/releases/download/${version}/argocd-linux-amd64"
  sudo install -m 555 /tmp/argocd-linux-amd64 /usr/local/bin/argocd
  rm /tmp/argocd-linux-amd64
  
  log_info "ArgoCD CLI installed"
}

# Main execution
main() {
  log_info "Starting MicroK8s setup..."
  
  check_os
  install_microk8s
  wait_for_ready
  enable_addons
  install_cert_manager
  install_argocd
  create_namespaces
  configure_kubectl
  install_argocd_cli
  
  log_info "=========================================="
  log_info "MicroK8s setup completed successfully!"
  log_info "=========================================="
  log_info ""
  log_info "Next steps:"
  log_info "1. Run: newgrp microk8s (if needed)"
  log_info "2. Verify: kubectl get nodes"
  log_info "3. Deploy: cd portfolio-ui && ./scripts/deploy.sh -e dev"
  log_info ""
  log_info "Access ArgoCD:"
  log_info "  kubectl port-forward svc/argocd-server -n argocd 8080:443"
  log_info "  https://localhost:8080"
}

main
