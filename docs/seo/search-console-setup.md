# Search Console + Bing Webmaster Setup

One-time configuration. Re-run only if the canonical domain changes.

## Google Search Console

1. Open <https://search.google.com/search-console/welcome>.
2. Add property → **URL prefix** → `https://thulanimaseko.com/`.
3. Verification method: **HTML tag**. Copy the `content` value.
4. Store the token as `VITE_GSC_VERIFICATION` in `.env` and as a Cloudflare Workers secret:
   ```
   echo "<token>" | npx wrangler secret put VITE_GSC_VERIFICATION
   ```
5. The `usePageSeo` hook (added in Phase 1 of the SEO plan) injects `<meta name="google-site-verification" content="<token>" />` on `/`. Redeploy.
6. Back in GSC, click **Verify**.
7. Submit sitemap: **Sitemaps** → add `https://thulanimaseko.com/sitemap.xml`.
8. Enable email notifications: **Settings → User & permissions → Notifications → All**.

## Bing Webmaster Tools

Fast path: **Import from Google Search Console** once both are verified.

1. Open <https://www.bing.com/webmasters>.
2. Sign in with the same Google account used for GSC.
3. **Import sites from Google Search Console** → select `thulanimaseko.com`.
4. (Optional) Add `VITE_BING_VERIFICATION` token to `.env` + Workers secret if importing fails and manual verification is needed.
5. Submit sitemap: **Sitemaps** → `https://thulanimaseko.com/sitemap.xml`.
6. Enable **IndexNow**: paste the IndexNow key (currently `00b81fad70da4ae7acdbfd756d25c510`, served at `/00b81fad70da4ae7acdbfd756d25c510.txt`).

## Verification checklist

After 48 hours, both consoles should show:

- [ ] Property verified.
- [ ] Sitemap discovered (at least 1 URL listed).
- [ ] No critical coverage errors.
- [ ] At least one URL indexed (`site:thulanimaseko.com` query returns ≥ 1 result on both google.com and bing.com).

If indexation hasn't started after 14 days, recheck robots.txt, canonical tags, and Cloudflare WAF logs for blocked Googlebot/Bingbot requests.
