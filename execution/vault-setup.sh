#!/usr/bin/env bash
# ==============================================
# Portfolio Website — Vault Secret Setup
# Seeds secrets into Vault, creates policy, and
# configures K8s auth role for ESO integration.
#
# Prerequisites:
#   - Vault deployed and unsealed in 'vault' namespace
#   - External Secrets Operator deployed
#   - kubectl/microk8s kubectl access
#
# Usage:
#   ssh homelab-tailscale
#   cd ~/repos/Portofolio_Website
#   bash execution/vault-setup.sh
#
# This script is idempotent — safe to re-run.
# ==============================================

set -euo pipefail

VAULT_NAMESPACE="vault"
VAULT_POD="vault-0"
VAULT_ADDR="https://127.0.0.1:8200"
APP_NAMESPACE="prod"
VAULT_SECRET_PATH="portfolio/live"
POLICY_NAME="portfolio-readonly"
K8S_AUTH_ROLE="portfolio-live"
SERVICE_ACCOUNT="portfolio-external-secrets"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# ── Color Output ─────────────────────────────────────────
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
BOLD='\033[1m'
NC='\033[0m'

log()         { echo -e "${CYAN}[$(date +'%H:%M:%S')]${NC} $*"; }
log_success() { echo -e "${GREEN}[$(date +'%H:%M:%S')] $*${NC}"; }
log_error()   { echo -e "${RED}[$(date +'%H:%M:%S')] $*${NC}" >&2; }
log_warning() { echo -e "${YELLOW}[$(date +'%H:%M:%S')] $*${NC}"; }

# ── Helper: execute vault command inside pod ─────────────
vault_exec() {
    microk8s kubectl exec -n "$VAULT_NAMESPACE" "$VAULT_POD" -c vault -- \
        sh -c "VAULT_ADDR=$VAULT_ADDR VAULT_SKIP_VERIFY=1 vault $*"
}

echo ""
echo -e "${BOLD}================================================${NC}"
echo -e "${BOLD}Portfolio Website — Vault Secret Setup${NC}"
echo -e "${BOLD}================================================${NC}"
echo ""

# ── Pre-flight checks ────────────────────────────────────
log "Running pre-flight checks..."

if ! microk8s kubectl get pod "$VAULT_POD" -n "$VAULT_NAMESPACE" &>/dev/null; then
    log_error "Vault pod '$VAULT_POD' not found in namespace '$VAULT_NAMESPACE'"
    exit 1
fi
log_success "Vault pod found"

# Check Vault is unsealed
SEALED=$(vault_exec "status -format=json" 2>/dev/null | grep -o '"sealed":[a-z]*' | cut -d: -f2 || echo "true")
if [ "$SEALED" = "true" ]; then
    log_error "Vault is sealed. Unseal it first: bash infra/hashicorp-vault/scripts/init-vault.sh --unseal-only"
    exit 1
fi
log_success "Vault is unsealed"

# ── Step 1: Prompt for Vault token ───────────────────────
echo ""
log "Enter a Vault token with admin/write access:"
read -r -s -p "  Token: " VAULT_TOKEN
echo ""

# Login
vault_exec "login $VAULT_TOKEN" > /dev/null 2>&1
log_success "Authenticated to Vault"

# ── Step 2: Generate and seed secrets ────────────────────
echo ""
log "Checking if secrets already exist at 'secret/${VAULT_SECRET_PATH}'..."

EXISTING=$(vault_exec "kv get -format=json secret/${VAULT_SECRET_PATH}" 2>/dev/null || echo "")

SEED_SECRETS=false
if [ -n "$EXISTING" ] && echo "$EXISTING" | grep -q '"data"'; then
    log_warning "Secrets already exist at secret/${VAULT_SECRET_PATH}"
    echo ""
    read -r -p "  Overwrite existing secrets? [y/N]: " OVERWRITE
    if [[ "$OVERWRITE" =~ ^[Yy]$ ]]; then
        log "Overwriting secrets..."
        SEED_SECRETS=true
    else
        log "Keeping existing secrets"
    fi
else
    SEED_SECRETS=true
fi

if [ "$SEED_SECRETS" = "true" ]; then
    PG_PASS=$(openssl rand -base64 32)
    PG_ROOT_PASS=$(openssl rand -base64 32)
    REDIS_PASS=$(openssl rand -base64 32)
    JWT_SECRET=$(openssl rand -hex 32)

    vault_exec "kv put secret/${VAULT_SECRET_PATH} \
        database-url=\"postgresql://portfolio_user:${PG_PASS}@postgres:5432/portfolio\" \
        postgres-username=\"portfolio_user\" \
        postgres-password=\"${PG_PASS}\" \
        postgres-root-password=\"${PG_ROOT_PASS}\" \
        redis-password=\"${REDIS_PASS}\" \
        redis-url=\"redis://redis:6379\" \
        jwt-secret=\"${JWT_SECRET}\" \
        jwt-access-expiry=\"15m\" \
        jwt-refresh-expiry=\"7d\""

    log_success "Secrets seeded at secret/${VAULT_SECRET_PATH}"
fi

# ── Step 3: Apply Vault policy ───────────────────────────
echo ""
log "Applying Vault policy '${POLICY_NAME}'..."

POLICY_FILE="${SCRIPT_DIR}/vault-setup/portfolio-policy.hcl"
if [ ! -f "$POLICY_FILE" ]; then
    log_error "Policy file not found: $POLICY_FILE"
    exit 1
fi

microk8s kubectl exec -n "$VAULT_NAMESPACE" "$VAULT_POD" -c vault -i -- \
    sh -c "VAULT_ADDR=$VAULT_ADDR VAULT_SKIP_VERIFY=1 vault policy write $POLICY_NAME -" < "$POLICY_FILE"

log_success "Policy '${POLICY_NAME}' applied"

# ── Step 4: Create K8s auth role ─────────────────────────
echo ""
log "Creating Kubernetes auth role '${K8S_AUTH_ROLE}'..."

vault_exec "write auth/kubernetes/role/${K8S_AUTH_ROLE} \
    bound_service_account_names=${SERVICE_ACCOUNT} \
    bound_service_account_namespaces=${APP_NAMESPACE} \
    policies=${POLICY_NAME} \
    ttl=1h \
    max_ttl=24h"

log_success "K8s auth role '${K8S_AUTH_ROLE}' created"

# ── Step 5: Verify ───────────────────────────────────────
echo ""
log "Verifying setup..."

# Verify secrets are readable
VERIFY=$(vault_exec "kv get -format=json secret/${VAULT_SECRET_PATH}" 2>/dev/null || echo "")
if [ -n "$VERIFY" ] && echo "$VERIFY" | grep -q "jwt-secret"; then
    log_success "Secrets verified at secret/${VAULT_SECRET_PATH}"
else
    log_error "Failed to verify secrets"
    exit 1
fi

# Verify policy exists
POLICY_CHECK=$(vault_exec "policy read ${POLICY_NAME}" 2>/dev/null || echo "")
if [ -n "$POLICY_CHECK" ]; then
    log_success "Policy '${POLICY_NAME}' verified"
else
    log_error "Policy '${POLICY_NAME}' not found"
    exit 1
fi

# Verify role exists
ROLE_CHECK=$(vault_exec "read auth/kubernetes/role/${K8S_AUTH_ROLE}" 2>/dev/null || echo "")
if [ -n "$ROLE_CHECK" ]; then
    log_success "K8s auth role '${K8S_AUTH_ROLE}' verified"
else
    log_error "K8s auth role '${K8S_AUTH_ROLE}' not found"
    exit 1
fi

echo ""
echo -e "${GREEN}================================================${NC}"
echo -e "${GREEN}  Vault setup complete!${NC}"
echo -e "${GREEN}================================================${NC}"
echo ""
echo "Secrets path:    secret/${VAULT_SECRET_PATH}"
echo "Policy:          ${POLICY_NAME}"
echo "K8s auth role:   ${K8S_AUTH_ROLE}"
echo "Service account: ${SERVICE_ACCOUNT} (namespace: ${APP_NAMESPACE})"
echo ""
echo "Next steps:"
echo "  1. Deploy the portfolio app: bash execution/deploy-homelab.sh"
echo "  2. Verify ExternalSecrets: microk8s kubectl get externalsecrets -n ${APP_NAMESPACE}"
echo ""
