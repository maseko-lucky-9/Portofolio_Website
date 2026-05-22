# Template for terraform.tfvars. apply.sh auto-copies this on first run.
# Account ID + zone name are non-secrets. The API token is intentionally
# NOT in this file - apply.sh resolves it from env / 1Password / Keychain.

cf_account_id = "1ddc6b389e8661e7a6948805382d1ec4"
cf_zone_name  = "thulanimaseko.com"
