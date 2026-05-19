output "zone_id" {
  description = "Cloudflare zone ID (for cross-referencing in dashboard URLs)."
  value       = data.cloudflare_zone.this.id
}

output "waf_ruleset_id" {
  description = "ID of the custom WAF ruleset for this zone."
  value       = cloudflare_ruleset.waf_custom.id
}

output "rate_limit_html_id" {
  value = cloudflare_ruleset.rate_limit_html.id
}

output "rate_limit_api_id" {
  value = cloudflare_ruleset.rate_limit_api.id
}
