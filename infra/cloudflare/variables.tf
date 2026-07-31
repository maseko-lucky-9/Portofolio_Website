variable "cf_api_token" {
  description = "Cloudflare API token with Zone:WAF:Edit + Zone:Read on the target zone."
  type        = string
  sensitive   = true
}

variable "cf_account_id" {
  description = "Cloudflare account ID. Found via `wrangler whoami` or dashboard URL."
  type        = string
}

variable "cf_zone_name" {
  description = "Apex domain of the target Cloudflare zone."
  type        = string
  default     = "thulanimaseko.co.za"
}
