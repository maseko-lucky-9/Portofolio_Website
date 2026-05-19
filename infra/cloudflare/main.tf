terraform {
  required_version = ">= 1.6.0"

  required_providers {
    cloudflare = {
      source  = "cloudflare/cloudflare"
      version = "~> 4.40"
    }
  }
}

provider "cloudflare" {
  api_token = var.cf_api_token
}

data "cloudflare_zone" "this" {
  account_id = var.cf_account_id
  name       = var.cf_zone_name
}
