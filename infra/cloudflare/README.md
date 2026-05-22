# Cloudflare infrastructure as code

Terraform modules that codify edge configuration for `thulanimaseko.com`.
Apply manually when bot-policy.md changes or when standing up a new
environment.

| File | Purpose |
|---|---|
| `waf.tf` | 5 custom WAF rules from `docs/seo/bot-policy.md` (datacenter ASN block, UA matches, rate limits, empty-UA block) |
| `variables.tf` | Inputs (zone name, account ID, API token) |
| `outputs.tf` | Rule IDs for downstream debugging |

## Apply — fast path

Once the zone is **Active** in Cloudflare (domain registered + DNS
delegated), one command:

```bash
cd infra/cloudflare && ./apply.sh
```

The wrapper:

1. Verifies the zone is actually registered (Verisign WHOIS check) —
   aborts loudly if not, so terraform doesn't fail mid-plan with a
   misleading error.
2. Resolves the Cloudflare API token from, in order:
   `$TF_VAR_cf_api_token` → `$CLOUDFLARE_API_TOKEN` → 1Password
   (`op read 'op://Personal/Cloudflare API Token/credential'`) →
   macOS Keychain (`cloudflare-api-token`) → interactive prompt.
3. Runs `init → validate → plan → apply`.

`./apply.sh --auto-approve` for non-interactive (CI) runs.

## Apply — manual path

```bash
export TF_VAR_cf_api_token=...
terraform init
terraform plan -var-file=terraform.tfvars
terraform apply -var-file=terraform.tfvars
```

## API token scopes

Create at <https://dash.cloudflare.com/profile/api-tokens>. Needs:

- **Zone → Zone WAF → Edit**
- **Zone → Zone → Read**

Scope to **Specific zone → thulanimaseko.com** (not "All zones") to keep
the blast radius small.

## State

Local-only — `terraform.tfstate` is in `.gitignore`. For team use,
migrate to an S3/R2 backend before that becomes a problem.

## Files

| File | Purpose |
|---|---|
| `main.tf` | Provider + zone data source |
| `variables.tf` | Input vars |
| `waf.tf` | 5 WAF rules from `docs/seo/bot-policy.md` |
| `outputs.tf` | Rule IDs |
| `terraform.tfvars` | Account ID + zone name (gitignored; token NOT here) |
| `example.tfvars` | Same as above, committed for reference |
| `apply.sh` | Token-resolving wrapper (recommended entry point) |
