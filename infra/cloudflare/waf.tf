###############################################################################
# WAF custom rules for thulanimaseko.com
#
# Encodes the 5-rule policy from docs/seo/bot-policy.md. Rules are
# evaluated top-down inside the single Cloudflare-managed `http_request_firewall_custom`
# ruleset per zone; order matters (Block > Challenge > Skip).
#
# Verified-bot allowlist (cf.client.bot true) overrides every Block rule
# below — Googlebot/Bingbot/etc. are NOT affected.
###############################################################################

resource "cloudflare_ruleset" "waf_custom" {
  zone_id     = data.cloudflare_zone.this.id
  name        = "Portfolio WAF — bot policy"
  description = "Implements docs/seo/bot-policy.md. Edit there, then mirror here."
  kind        = "zone"
  phase       = "http_request_firewall_custom"

  # ─ Rule 1: Block empty / missing User-Agent on HTML routes ───────────
  rules {
    description = "Block empty UA on HTML"
    expression  = <<-EOT
      (http.request.uri.path matches "^/$|\\.html$") and
      (len(http.user_agent) eq 0) and
      (not cf.client.bot)
    EOT
    action      = "block"
    enabled     = true
  }

  # ─ Rule 2: Managed Challenge on known scripted UAs (except /api/health) ─
  rules {
    description = "Challenge scripted UAs"
    expression  = <<-EOT
      (
        http.user_agent contains "scrapy" or
        http.user_agent contains "python-requests" or
        http.user_agent contains "Go-http-client" or
        http.user_agent contains "node-fetch" or
        http.user_agent contains "Java/" or
        http.user_agent contains "okhttp/" or
        http.user_agent contains "Apache-HttpClient/" or
        http.user_agent contains "libwww-perl" or
        http.user_agent contains "aiohttp" or
        http.user_agent contains "Postman"
      ) and
      (not http.request.uri.path eq "/api/health") and
      (not cf.client.bot)
    EOT
    action      = "managed_challenge"
    enabled     = true
  }

  # ─ Rule 3: Block datacenter-ASN traffic on HTML (AWS/GCP/Azure/etc.) ─
  rules {
    description = "Datacenter ASN block on HTML"
    expression  = <<-EOT
      (http.request.uri.path matches "^/$|\\.html$") and
      (ip.geoip.asnum in {14618 16509 15169 8075 14061 16276 24940 19527 16265 13335}) and
      (not cf.client.bot)
    EOT
    action      = "block"
    enabled     = true
  }
}

###############################################################################
# Rate limiting — two zone-level rules (HTML 60/min, API 30/min).
# Uses the rate-limiting phase (separate from http_request_firewall_custom).
###############################################################################

resource "cloudflare_ruleset" "rate_limit_html" {
  zone_id     = data.cloudflare_zone.this.id
  name        = "Rate limit — HTML 60/min"
  description = "Per-IP rate limit on HTML routes."
  kind        = "zone"
  phase       = "http_ratelimit"

  rules {
    description = "60 req/min/IP on HTML"
    expression  = <<-EOT
      (http.request.uri.path matches "^/$|\\.html$") and (not cf.client.bot)
    EOT
    action      = "block"
    enabled     = true

    ratelimit {
      characteristics     = ["cf.colo.id", "ip.src"]
      period              = 60
      requests_per_period = 60
      mitigation_timeout  = 600
    }
  }
}

resource "cloudflare_ruleset" "rate_limit_api" {
  zone_id     = data.cloudflare_zone.this.id
  name        = "Rate limit — API 30/min"
  description = "Per-IP rate limit on JSON API endpoints."
  kind        = "zone"
  phase       = "http_ratelimit"

  rules {
    description = "30 req/min/IP on /api/*"
    expression  = "starts_with(http.request.uri.path, \"/api/\") and (not cf.client.bot)"
    action      = "block"
    enabled     = true

    ratelimit {
      characteristics     = ["cf.colo.id", "ip.src"]
      period              = 60
      requests_per_period = 30
      mitigation_timeout  = 300
    }
  }
}

###############################################################################
# Bot Fight Mode (zone-level setting, not a rule). Free tier.
###############################################################################

resource "cloudflare_zone_settings_override" "bot_fight_mode" {
  zone_id = data.cloudflare_zone.this.id

  settings {
    # Enables free-tier Bot Fight Mode. Upgrades to Super Bot Fight Mode
    # require a Pro+ plan and a different setting (configure manually).
    # Setting key is `security_level` adjacent — leave commented unless
    # the provider exposes a direct toggle in your provider version.
    # bot_fight_mode = "on"
    security_level = "medium"
    challenge_ttl  = 1800
  }
}
