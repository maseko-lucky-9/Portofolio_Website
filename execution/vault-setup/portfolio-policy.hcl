# ─────────────────────────────────────────────────────────
# Portfolio Application Policy — Least-Privilege Read-Only
# Bound to Kubernetes auth role: portfolio-live
# ─────────────────────────────────────────────────────────

# Read portfolio live secrets
path "kv/data/portfolio/live" {
  capabilities = ["read"]
}

# List secret metadata (for ESO discovery and debugging)
path "kv/metadata/portfolio/*" {
  capabilities = ["read", "list"]
}

# Token self-introspection (required for health checks)
path "auth/token/lookup-self" {
  capabilities = ["read"]
}

# Token self-renewal (for long-running ESO syncs)
path "auth/token/renew-self" {
  capabilities = ["update"]
}
