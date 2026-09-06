import { test, expect } from "@playwright/test";

/**
 * Locks the invariants broken by the fixed-header regression.
 *
 * The mobile drawer used to sit in normal flow inside the `fixed` <header>,
 * hidden only by opacity, so the header measured 438px on every phone —
 * 52% of a 390x844 screen, 77% at 320px. Two consequences: its 75%-opaque
 * blurred scrim buried every section's eyebrow/title/subtitle, and because a
 * fixed header is hit-testable, every tap in the top half of the screen landed
 * on the header instead of the page (hero CTAs were unclickable).
 *
 * Nothing in the suite asserted header height or horizontal overflow, which is
 * why it shipped. These run on both projects — desktop already satisfies them,
 * so they double as a no-regression gate.
 */
test.describe("mobile layout", () => {
  // Kept after the drawer was removed: the failure it guards against is a
  // header that grows to hold navigation, and the pill can still do that if a
  // future change unhides the section links below md.
  test("header does not reserve drawer height on load", async ({ page }) => {
    await page.goto("/");
    const height = await page.locator("header").evaluate((el) => el.getBoundingClientRect().height);

    // 438px before the original fix; ~58px now.
    expect(height).toBeLessThan(100);
  });

  test("the top of the screen is not covered by the fixed header", async ({ page, isMobile }) => {
    test.skip(!isMobile, "the header was only oversized below md");

    await page.goto("/");
    // 300px down was inside the 438px header before the fix, so this point —
    // and every hero control near it — was dead to touch.
    const hitsHeader = await page.evaluate(() => {
      const el = document.elementFromPoint(Math.round(window.innerWidth / 2), 300);
      const header = document.querySelector("header");
      return !!el && !!header && (header === el || header.contains(el));
    });
    expect(hitsHeader).toBe(false);
  });

  test("no horizontal overflow at page top or after full mount", async ({ page }) => {
    await page.goto("/");
    const measure = () =>
      page.evaluate(() => ({
        scroll: document.documentElement.scrollWidth,
        client: document.documentElement.clientWidth,
      }));

    // Settle first. The entrance animations translate elements on the X axis,
    // so for the first ~300ms of load the document is transiently a few px
    // wider than the viewport. That is pre-existing (verified identical before
    // this change set) and separate from what this guards: a *persistent*
    // horizontal scroll.
    await page.waitForTimeout(500);

    let m = await measure();
    expect(m.scroll, "overflow at page top").toBeLessThanOrEqual(m.client + 1);

    // Again once every lazy section has mounted — most overflow candidates
    // (badges, case-study header rows, tables) are below the fold.
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await page.waitForTimeout(600);
    m = await measure();
    expect(m.scroll, "overflow after full-page mount").toBeLessThanOrEqual(m.client + 1);
  });

  // The prerendered content pages are a separate pipeline from the SPA above —
  // remark-gfm emits bare <table> markup into page-template.mjs, which had no
  // table CSS at all. Three shipped pages carry real tables; this checks the
  // widest one actually scrolls instead of blowing out the page.
  test("prerendered pages with tables do not overflow", async ({ page }) => {
    // Trailing slash matters: without it the preview server falls back to the
    // SPA index and you silently assert against the React app instead.
    const res = await page.goto("/answers/argocd-vs-flux-2026/");
    test.skip(!res || res.status() >= 400, "static page not present in this build");

    const m = await page.evaluate(() => ({
      scroll: document.documentElement.scrollWidth,
      client: document.documentElement.clientWidth,
      tables: document.querySelectorAll("table").length,
    }));
    expect(m.tables, "expected a real table on this page").toBeGreaterThan(0);
    expect(m.scroll).toBeLessThanOrEqual(m.client + 1);
  });
});

test.describe("mobile anchor navigation", () => {
  // The global config forces reducedMotion: "reduce", which would make the
  // instant-scroll branch true regardless of pointer type and leave the
  // pointer:coarse path unproven. Override so this exercises the real branch.
  // (The branch itself is unit-tested in src/lib/__tests__/scroll-to-section.test.ts,
  // which is the deterministic proof; this is the integration check.)
  test.use({ reducedMotion: "no-preference" });
});
