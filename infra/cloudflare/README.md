# Cloudflare infrastructure as code

Terraform modules that codify edge configuration for `thulanimaseko.co.za`.
Apply manually when bot-policy.md changes or when standing up a new
environment.

| File | Purpose |
|---|---|
| `waf.tf` | 5 custom WAF rules from `docs/seo/bot-policy.md` (datacenter ASN block, UA matches, rate limits, empty-UA block) |
| `variables.tf` | Inputs (zone name, account ID, API token) |
| `outputs.tf` | Rule IDs for downstream debugging |

## Apply

Pass the token via `TF_VAR_cf_api_token`, never `-var "cf_api_token=…"`. A `-var`
argument puts the resolved secret in `argv`, where any local process can read it
with `ps aux` for the life of the run — and in the non-`op` variants it also lands
verbatim in `~/.zsh_history`. Account ID and zone name are non-secrets and live in
`terraform.tfvars`.

```bash
cd infra/cloudflare
terraform init
export TF_VAR_cf_api_token="$(op read 'op://Personal/Cloudflare API Token/credential')"
terraform plan  -var-file=terraform.tfvars
terraform apply -var-file=terraform.tfvars
```

API token needs **Zone:Zone WAF:Edit** and **Zone:Zone:Read** scoped to
the `thulanimaseko.co.za` zone.

State is local-only (`terraform.tfstate` in `.gitignore`). For team use,
migrate to an S3/R2 backend before that becomes a problem.
