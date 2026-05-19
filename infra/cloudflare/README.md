# Cloudflare infrastructure as code

Terraform modules that codify edge configuration for `thulanimaseko.com`.
Apply manually when bot-policy.md changes or when standing up a new
environment.

| File | Purpose |
|---|---|
| `waf.tf` | 5 custom WAF rules from `docs/seo/bot-policy.md` (datacenter ASN block, UA matches, rate limits, empty-UA block) |
| `variables.tf` | Inputs (zone name, account ID, API token) |
| `outputs.tf` | Rule IDs for downstream debugging |

## Apply

```bash
cd infra/cloudflare
terraform init
terraform plan \
  -var "cf_api_token=$(op read 'op://Personal/Cloudflare API Token/credential')" \
  -var "cf_account_id=1ddc6b389e8661e7a6948805382d1ec4" \
  -var "cf_zone_name=thulanimaseko.com"
terraform apply
```

API token needs **Zone:Zone WAF:Edit** and **Zone:Zone:Read** scoped to
the `thulanimaseko.com` zone.

State is local-only (`terraform.tfstate` in `.gitignore`). For team use,
migrate to an S3/R2 backend before that becomes a problem.
