import { test, expect, type Page } from "@playwright/test";

/**
 * The ambient background field.
 *
 * The field is an enhancement layered over a CSS gradient, and every one of its
 * bail-outs lands on that gradient — so these tests care as much about the
 * fallback being correct as about the scene running.
 *
 * Two environment facts shape the guards below:
 *   - the runtime hard-requires WebGL2, and Playwright's WebKit on Linux has
 *     none at all (the `mobile` project is WebKit under the hood), so the
 *     running case has to probe and skip rather than assume;
 *   - `use.reducedMotion: "reduce"` is global in playwright.config.ts, so the
 *     paused branch is the default and the running branch needs an override.
 */

const hasWebGL2 = (page: Page) =>
  page.evaluate(() => {
    try {
      return !!document.createElement("canvas").getContext("webgl2");
    } catch {
      return false;
    }
  });

/** True once a scene has actually been vendored into public/field. */
async function sceneIsVendored(page: Page) {
  const res = await page.request.head("/field/scene.json").catch(() => null);
  // Behind an SPA fallback a missing file answers 200 text/html, so the status
  // alone proves nothing — the content type is the real signal.
  return !!res?.ok() && !!res.headers()["content-type"]?.includes("json");
}

test("renders the fallback and the host on every load", async ({ page }) => {
  await page.goto("/");
  await expect(page.locator("#field-fallback")).toHaveCount(1);
  await expect(page.locator("#aura-bg #us-host")).toHaveCount(1);
  await expect(page.locator(".grid-bg")).toHaveCount(1);
});

test("lite mode paints the gradient and downloads no runtime", async ({ page }) => {
  await page.goto("/?lite=1");
  await page.waitForTimeout(1200);
  await expect(page.locator("#field-fallback")).toHaveCSS("opacity", "1");
  await expect(page.locator('script[src="/field/unicornStudio.umd.js"]')).toHaveCount(0);
});

test("holds a static frame under reduced motion", async ({ page }) => {
  await page.goto("/");
  test.skip(!(await hasWebGL2(page)), "no WebGL2 in this browser");
  test.skip(!(await sceneIsVendored(page)), "no scene vendored yet — see public/field/README.md");
  await expect(page.locator("#us-host canvas")).toHaveCount(1, { timeout: 20000 });
  await expect
    .poll(() => page.evaluate(() => window.UnicornStudio?.scenes?.[0]?.paused))
    .toBe(true);
});

test.describe("with motion allowed", () => {
  test.use({ reducedMotion: "no-preference" });

  test("mounts the scene and hides the fallback", async ({ page, isMobile }) => {
    test.skip(isMobile, "coarse pointer holds a static frame by design");
    await page.goto("/");
    test.skip(!(await hasWebGL2(page)), "no WebGL2 in this browser");
    test.skip(!(await sceneIsVendored(page)), "no scene vendored yet — see public/field/README.md");
    await expect(page.locator("#us-host canvas")).toHaveCount(1, { timeout: 20000 });
    await expect(page.locator("#field-fallback")).toHaveCSS("opacity", "0");
    await expect
      .poll(() => page.evaluate(() => window.UnicornStudio?.scenes?.[0]?.paused))
      .toBe(false);
  });
});

test("loads with a clean console", async ({ page }) => {
  // The page loads the self-hosted Umami tag from t.thulanimaseko.co.za. Left
  // alone, a full suite run is ~130 page loads against that real host in a few
  // seconds, and it starts answering 429 — which failed this assertion for a
  // reason that has nothing to do with the code under test. Blocking the
  // analytics origin is what lighthouserc.json already does for the same
  // reason, and it keeps the assertion strict for everything we actually ship.
  // Fulfilled, not aborted: an aborted request logs
  // "Failed to load resource: net::ERR_FAILED" with no URL in the text, so it
  // cannot be told apart from a real failure by filtering afterwards.
  await page.route("**://t.thulanimaseko.co.za/**", (route) =>
    route.fulfill({
      status: 200,
      contentType: "application/javascript",
      body: "",
    }),
  );

  const errors: string[] = [];
  page.on("console", (m) => {
    if (m.type() === "error") errors.push(m.text());
  });
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto("/");
  await page.waitForLoadState("networkidle");
  await page.waitForTimeout(2500);

  expect(errors).toEqual([]);
});
