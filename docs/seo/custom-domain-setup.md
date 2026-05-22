# Custom domain wiring — thulanimaseko.com → Worker

The site's canonical references (`index.html`, JSON-LD, Plausible) all
point at `https://thulanimaseko.com/`, but the Worker currently only
serves from `thulani-portfolio.masekotlg.workers.dev`. Two steps to
close the gap.

## Step 1 — Add the zone to Cloudflare (if not already there)

1. Cloudflare dashboard → **Add a Site** → enter `thulanimaseko.com`.
2. Pick the Free plan.
3. Cloudflare reads existing DNS; review and keep what's needed.
4. Update nameservers at the registrar to the two NS records Cloudflare
   gives you. Propagation can take up to 24h but usually settles in <1h.
5. Zone goes Active in the dashboard. Note the **Zone ID** (sidebar).

## Step 2 — Bind the Worker to the custom hostname

Once the zone is Active, append to `portfolio-ui/wrangler.toml`:

```toml
[[routes]]
pattern = "thulanimaseko.com/*"
zone_name = "thulanimaseko.com"
custom_domain = true

[[routes]]
pattern = "www.thulanimaseko.com/*"
zone_name = "thulanimaseko.com"
custom_domain = true
```

Then redeploy:

```bash
cd portfolio-ui && npx wrangler deploy
```

`custom_domain = true` makes Cloudflare auto-create the DNS records
(`A`/`AAAA` to the Workers proxy) and provision the TLS cert.

## Step 3 — Update Plausible

The Plausible script tag (in `index.html`) already declares
`data-domain="thulanimaseko.com"`. After cutover, register that exact
domain at <https://plausible.io/sites/new> to start receiving events.

## Step 4 — Apply WAF rules

After the zone is Active, run:

```bash
cd infra/cloudflare
terraform init
terraform apply -var-file=example.tfvars -var "cf_api_token=$YOUR_TOKEN"
```

See `infra/cloudflare/README.md` for token scoping.

## Verification

```bash
# DNS resolves to Cloudflare:
dig +short thulanimaseko.com
# (Should return 104.x.x.x or 172.x.x.x — Cloudflare ranges)

# TLS works + headers carry through:
curl -sI https://thulanimaseko.com/ | grep -iE "strict-transport|x-robots|content-security"

# Worker is serving (not a redirect / placeholder):
curl -s https://thulanimaseko.com/ | grep -c '<div id="root">'   # → 1
curl -s https://thulanimaseko.com/sitemap.xml | grep -c '<loc>'  # → 1+
```

## Rollback

Delete the `[[routes]]` blocks from `wrangler.toml` and redeploy. DNS
records made by `custom_domain = true` get cleaned up by Cloudflare
automatically.
