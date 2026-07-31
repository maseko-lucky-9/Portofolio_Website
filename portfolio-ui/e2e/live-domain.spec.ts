import { test, expect } from "@playwright/test";

/**
 * Proves a live custom domain is actually serving THIS codebase — not a parked
 * page, not a stale cache, not the registrar's site builder.
 *
 * Only runs when E2E_BASE_URL is set, because every assertion here is about a
 * real deployment:
 *
 *   E2E_BASE_URL=https://thulanimaseko.co.za \
 *     npx playwright test e2e/live-domain.spec.ts --project=chromium
 *
 * Asserts CONTENT, not status codes. `scripts/seo/routes.mjs` owns the
 * SITE_ORIGIN that generates sitemap.xml and rss.xml and has no unit-test
 * coverage at all, so a 200-only check would let a half-finished domain rename
 * ship green while crawlers get URLs on the wrong host.
 */

const baseUrl = process.env.E2E_BASE_URL;

// The domain this deployment is supposed to be serving, derived from the target
// so the spec stays correct if the site is ever moved again.
const expectedHost = baseUrl ? new URL(baseUrl).host : "";
const expectedOrigin = baseUrl ? new URL(baseUrl).origin : "";

test.skip(!baseUrl, "live-domain checks require E2E_BASE_URL");

test.describe("live domain", () => {
  test("serves the portfolio app, not a registrar placeholder", async ({
    page,
  }) => {
    await page.goto("/");

    await expect(page.locator("#root")).toBeAttached();
    await expect(page.locator("#about")).toBeVisible();

    // GoDaddy Website Builder's stock tagline. Its presence means DNS is still
    // pointed at the old parked site.
    await expect(page.locator("body")).not.toContainText(
      "Elevate Your Business Today",
    );

    await page.screenshot({
      path: `test-results/live-domain-${expectedHost}.png`,
      fullPage: false,
    });
  });

  test("canonical and JSON-LD identity use the live host", async ({ page }) => {
    await page.goto("/");

    const canonical = await page
      .locator('link[rel="canonical"]')
      .getAttribute("href");
    expect(canonical).toBe(`${expectedOrigin}/`);

    const ogUrl = await page
      .locator('meta[property="og:url"]')
      .getAttribute("content");
    expect(ogUrl).toBe(`${expectedOrigin}/`);

    // The Person @id is the anchor every generated page's JSON-LD references.
    // If index.html and the build scripts disagree, entity disambiguation
    // breaks silently — no error, just a broken graph for crawlers.
    const ld = await page
      .locator('script[type="application/ld+json"]')
      .first()
      .textContent();
    expect(ld).toContain(`"@id": "${expectedOrigin}/#thulani"`);
  });

  test.describe("SEO surfaces carry the right domain", () => {
    for (const path of ["/sitemap.xml", "/rss.xml", "/robots.txt"]) {
      test(`${path} references the live host and no stale domain`, async ({
        request,
      }) => {
        const res = await request.get(path);
        expect(res.status()).toBe(200);

        const body = await res.text();
        expect(body).toContain(expectedHost);
        // Catches a partial rename: the generator still emitting the old origin.
        expect(body).not.toContain("thulanimaseko.com");
      });
    }
  });

  test("OG image resolves (domain is baked into the watermark)", async ({
    request,
  }) => {
    const res = await request.get("/og/home.png");
    expect(res.status()).toBe(200);
    expect(res.headers()["content-type"]).toContain("image/png");
  });

  test("IndexNow key file is served", async ({ request }) => {
    const res = await request.get("/00b81fad70da4ae7acdbfd756d25c510.txt");
    expect(res.status()).toBe(200);
    expect((await res.text()).trim()).toBe(
      "00b81fad70da4ae7acdbfd756d25c510",
    );
  });

  test("plain HTTP redirects to HTTPS", async ({ request }) => {
    // The Worker itself serves 200 over cleartext; this proves Cloudflare's
    // "Always Use HTTPS" is on. Without it the cutover is a security regression
    // — /api/chat would accept POSTs in the clear.
    const res = await request.get(`http://${expectedHost}/`, {
      maxRedirects: 0,
    });
    expect(res.status()).toBeGreaterThanOrEqual(301);
    expect(res.status()).toBeLessThan(400);
    expect(res.headers()["location"]).toContain(`https://${expectedHost}`);
  });

  test("HSTS is present but not preloaded during onboarding", async ({
    request,
  }) => {
    const res = await request.get("/");
    const hsts = res.headers()["strict-transport-security"];

    expect(hsts).toBeTruthy();
    // `preload` is a consent signal any third party can act on, and it is
    // effectively irreversible. It must not ship while the domain is new.
    expect(hsts).not.toContain("preload");
    expect(hsts).not.toContain("includeSubDomains");
  });

  test("security headers survive the custom domain", async ({ request }) => {
    const res = await request.get("/");
    const headers = res.headers();

    expect(headers["content-security-policy"]).toBeTruthy();
    expect(headers["x-content-type-options"]).toBe("nosniff");
    expect(headers["x-frame-options"]).toBe("DENY");
  });
});
