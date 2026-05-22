#!/usr/bin/env bash
# Wrapper that resolves the Cloudflare API token from the first available
# source and runs init -> validate -> plan -> apply against the zone
# defined in terraform.tfvars.
#
# Usage:
#   ./apply.sh               # interactive (prompts for confirmation before apply)
#   ./apply.sh --auto-approve  # CI / non-interactive
#
# Token resolution order:
#   1. $TF_VAR_cf_api_token (already exported)
#   2. $CLOUDFLARE_API_TOKEN  (matches the env var Cloudflare's own CLIs use)
#   3. 1Password CLI: op read 'op://Personal/Cloudflare API Token/credential'
#   4. macOS Keychain: security find-generic-password -s cloudflare-api-token -w
#   5. Interactive prompt (last resort)

set -euo pipefail
cd "$(dirname "$0")"

AUTO_APPROVE=""
if [[ "${1:-}" == "--auto-approve" ]]; then
  AUTO_APPROVE="-auto-approve"
fi

# 0. First-run setup: terraform.tfvars is gitignored (per-machine).
#    Auto-copy from the committed example so a fresh clone works.
if [[ ! -f terraform.tfvars ]]; then
  cp example.tfvars terraform.tfvars
  echo "[apply] initialised terraform.tfvars from example.tfvars"
fi

# 1. Verify the zone actually exists (apply will fail in confusing ways
#    if the domain isn't registered + on Cloudflare yet).
ZONE_NAME=$(grep -E '^cf_zone_name' terraform.tfvars | awk -F'"' '{print $2}')
if [[ -z "$ZONE_NAME" ]]; then
  echo "[apply] ERROR: cf_zone_name not found in terraform.tfvars" >&2
  exit 1
fi

WHOIS_RESULT=$(whois -h whois.verisign-grs.com "$ZONE_NAME" 2>/dev/null | head -3 | tr '[:upper:]' '[:lower:]' || true)
if echo "$WHOIS_RESULT" | grep -q "no match"; then
  echo "[apply] ABORT: $ZONE_NAME is not registered." >&2
  echo "        Register via Cloudflare Registrar first (see docs/seo/custom-domain-setup.md)." >&2
  exit 1
fi

# 2. Resolve the API token.
TOKEN=""
if [[ -n "${TF_VAR_cf_api_token:-}" ]]; then
  TOKEN="$TF_VAR_cf_api_token"
  echo "[apply] using TF_VAR_cf_api_token from env"
elif [[ -n "${CLOUDFLARE_API_TOKEN:-}" ]]; then
  TOKEN="$CLOUDFLARE_API_TOKEN"
  echo "[apply] using CLOUDFLARE_API_TOKEN from env"
elif command -v op >/dev/null 2>&1 && op account list >/dev/null 2>&1; then
  TOKEN=$(op read 'op://Personal/Cloudflare API Token/credential' 2>/dev/null || true)
  [[ -n "$TOKEN" ]] && echo "[apply] resolved token from 1Password"
elif command -v security >/dev/null 2>&1; then
  TOKEN=$(security find-generic-password -s cloudflare-api-token -w 2>/dev/null || true)
  [[ -n "$TOKEN" ]] && echo "[apply] resolved token from macOS Keychain"
fi

if [[ -z "$TOKEN" ]]; then
  echo "[apply] No token in env / 1Password / Keychain."
  echo "[apply] Token needs scopes: Zone:Zone:Read + Zone:WAF:Edit on $ZONE_NAME"
  echo "[apply] Create at: https://dash.cloudflare.com/profile/api-tokens"
  read -rsp "Paste Cloudflare API token (will not echo): " TOKEN
  echo
fi

if [[ -z "$TOKEN" ]]; then
  echo "[apply] ERROR: no token provided" >&2
  exit 1
fi

export TF_VAR_cf_api_token="$TOKEN"

# 3. Init -> validate -> plan -> apply
[[ ! -d .terraform ]] && terraform init -input=false
terraform validate
terraform plan -var-file=terraform.tfvars -out=tfplan
terraform apply $AUTO_APPROVE tfplan
rm -f tfplan
