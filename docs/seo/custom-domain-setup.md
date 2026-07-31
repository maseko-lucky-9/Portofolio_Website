# Custom domain wiring — thulanimaseko.co.za → Worker

The site's canonical references (`index.html`, JSON-LD, Plausible) all
point at `https://thulanimaseko.co.za/`, but the Worker currently only
serves from `thulani-portfolio.masekotlg.workers.dev`.

**Registrar:** GoDaddy, permanently. Cloudflare Registrar does not support
`.co.za`, so the domain cannot be transferred — Cloudflare handles DNS only,
via a nameserver delegation.

## Step 1 — Add the zone to Cloudflare

1. Cloudflare dashboard → **Add a Site** → `thulanimaseko.co.za` → **Free** plan.
2. Cloudflare scans the existing GoDaddy zone and imports what it finds.
3. Note the **Zone ID** (sidebar) and the two assigned `*.ns.cloudflare.com`
   nameservers.

## Step 2 — Delete every imported GoDaddy record

This is not optional housekeeping. `custom_domain = true` **hard-fails** with
`code: 100117` ("Hostname already has externally managed DNS records") if any
record exists on the apex or `www`, and there is **no wrangler override** for
it — `override_existing_dns_record` is not a valid configuration key.

| Record | Action |
|---|---|
| `A @ → 76.223.105.230`, `13.248.243.5` | Delete — GoDaddy Website Builder |
| `CNAME www → @` | Delete — the Worker custom domain replaces it |
| `CNAME _domainconnect → …gd.domaincontrol.com` | Delete — GoDaddy-DNS-only feature |
| `TXT _dmarc` (`p=quarantine`) | Replace — see Step 3 |
| Anything else imported (`AAAA`, `A www`, `ALIAS`) | Delete |

## Step 3 — Mail records (the domain sends no mail)

The contact form opens a `mailto:` to a Gmail address; nothing sends from this
domain. Lock it against spoofing:

| Type | Name | Value |
|---|---|---|
| TXT | `@` | `v=spf1 -all` |
| TXT | `_dmarc` | `v=DMARC1; p=reject;` |
| MX | `@` | `.` priority `0` (null MX, RFC 7505) |

`sp=` is unnecessary — RFC 9989 §4.7 makes subdomains inherit `p=reject`. If the
dashboard rejects `.` as an MX target, skip the null MX; SPF `-all` plus DMARC
`p=reject` already close the spoofing vector.

**Leave CAA unset.** Cloudflare Universal SSL rotates between Let's Encrypt and
Google Trust Services; a hand-written CAA naming one CA breaks renewal silently.

## Step 4 — Always Use HTTPS

SSL/TLS → Edge Certificates → **Always Use HTTPS: On**.

The Worker itself serves plaintext HTTP 200 — it has no HTTP→HTTPS redirect.
GoDaddy currently supplies that redirect, and moving nameservers removes it. Without
this toggle the cutover is a security regression: `/api/chat` would accept POSTs in
the clear, and visitors volunteer names and phone numbers there.

## Step 5 — Repoint nameservers at GoDaddy

Domain Portfolio → `thulanimaseko.co.za` → **DNS** → **Nameservers** → *Change* →
**"I'll use my own nameservers"** → replace both `domaincontrol.com` entries with
the Cloudflare pair.

GoDaddy relays the change to ZACR over EPP. Usually under an hour; allow up to 48h.

## Step 6 — Bind the Worker

Only once the zone reads **Active** and both hostnames have **zero** DNS records.
Uncomment in `portfolio-ui/wrangler.toml`:

```toml
[[routes]]
pattern = "thulanimaseko.co.za/*"
zone_name = "thulanimaseko.co.za"
custom_domain = true

[[routes]]
pattern = "www.thulanimaseko.co.za/*"
zone_name = "thulanimaseko.co.za"
custom_domain = true
```

```bash
cd portfolio-ui && npx wrangler deploy
```

`custom_domain = true` auto-creates the DNS records and provisions the TLS cert.

**Token scope.** The deploy token needs more than `Workers Scripts:Edit` for this
step — a 403 here means scope, not config. Mint a *replacement* token with
`Workers Scripts:Edit` (account) + `Zone:Read` + `Workers Routes:Edit`, with Zone
Resources limited to this one zone, then revoke the old one. Do **not** reach for
Cloudflare's "Edit Cloudflare Workers" template: it bundles account-wide
`Workers KV:Edit`, granting write access to the `KB` namespace that holds the CV
and screening brief.

## Step 7 — Plausible

The script tag in `index.html` declares `data-domain="thulanimaseko.co.za"`.
Analytics record **nothing** until that exact domain is registered at
<https://plausible.io/sites/new>. Do this at cutover, not later.

## Step 8 — WAF rules (last)

Apply these **after** verifying, not before. `waf.tf` blocks datacenter ASNs (AWS,
GCP, Azure, Hetzner, OVH) and enables Bot Fight Mode — both will 403 an automated
verification run that originates anywhere but a residential connection.

```bash
cd infra/cloudflare
terraform init
TF_VAR_cf_api_token="$(op read 'op://Personal/Cloudflare API Token/credential')" \
  terraform apply -var-file=terraform.tfvars
```

Pass the token via `TF_VAR_cf_api_token`, never `-var "cf_api_token=…"` — a `-var`
argument is visible to any local process through `ps aux` and lands verbatim in
shell history. See `infra/cloudflare/README.md` for token scoping.

## Verification

```bash
# Delegation, cross-checked at two independent resolvers:
dig @1.1.1.1 +short thulanimaseko.co.za NS
dig @8.8.8.8 +short thulanimaseko.co.za NS

# HTTP redirects to HTTPS (Step 4):
curl -sI -o /dev/null -w "%{http_code}\n" http://thulanimaseko.co.za   # → 301

# TLS + headers:
curl -sI https://thulanimaseko.co.za/ | grep -iE "strict-transport|content-security"

# Worker is serving — not a placeholder, not the old GoDaddy page:
curl -s https://thulanimaseko.co.za/ | grep -c '<div id="root">'      # → 1
curl -s https://thulanimaseko.co.za/ | grep -c 'Elevate Your Business' # → 0

# SEO surfaces carry the right domain (not just HTTP 200):
curl -s https://thulanimaseko.co.za/sitemap.xml | grep -c 'thulanimaseko.co.za'
curl -s https://thulanimaseko.co.za/robots.txt  | grep -c 'thulanimaseko.co.za'

# Mail records:
dig +short thulanimaseko.co.za TXT
dig +short _dmarc.thulanimaseko.co.za TXT
```

End-to-end, against the live domain:

```bash
cd portfolio-ui && E2E_BASE_URL=https://thulanimaseko.co.za \
  npx playwright test e2e/live-domain.spec.ts --project=chromium
```

## Rollback

> Removing the `[[routes]]` blocks from `wrangler.toml` does **not** detach an
> already-attached custom domain, and does **not** delete its DNS records. Earlier
> revisions of this document claimed otherwise; that was wrong.

| Failure | Recovery |
|---|---|
| Anything at all | `workers_dev = true` stays set, so `thulani-portfolio.masekotlg.workers.dev` keeps serving throughout. This is the real safety net. |
| Bad bundle shipped | `wrangler rollback`. Custom domains bind at script level, not version level, so the domain stays attached. |
| Need to detach the domain | Dashboard → Workers & Pages → `thulani-portfolio` → **Custom domains** → Remove. The TLS certificate is **not** removed with it — delete it separately under SSL/TLS → Edge Certificates. API equivalent: `DELETE /accounts/{account_id}/workers/domains/{domain_id}`. |
| Routes failed but bundle shipped | Expected shape of a failure here: `wrangler deploy` promotes the script *before* applying triggers. Fix the cause and re-run; the deploy is idempotent. |
| Nameservers | **Not a rollback lever.** Registry NS TTL is ~24h, and reverting restores records pointing at a Website Builder site that no longer exists. Once nameservers move, `workers.dev` is the only fallback. |
