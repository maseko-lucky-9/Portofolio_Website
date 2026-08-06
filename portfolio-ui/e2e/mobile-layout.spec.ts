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
  test("header does not reserve drawer height on load", async ({ page }) => {
    await page.goto("/");
    const height = await page.locator("header").evaluate((el) => el.getBoundingClientRect().height);

    // 438px before the fix; 72px at rest / 56px scrolled after.
    expect(height).toBeLessThan(100);
  });

  test("header stays collapsed while the drawer is open", async ({ page, isMobile }) => {
    // The hamburger is itself md:hidden, so this cannot run on the desktop
    // project — a click would fail actionability. test.skip (not a bare
    // `return`) so it reports as a visible skip rather than a silent pass.
    test.skip(!isMobile, "drawer is display:none at md and above");

    await page.goto("/");
    await page.getByRole("button", { name: /open menu/i }).click();

    const drawer = page.getByTestId("mobile-drawer");
    await expect(drawer.getByText("Services")).toBeVisible();

    // The bug's signature: header height was IDENTICAL open vs closed.
    const height = await page.locator("header").evaluate((el) => el.getBoundingClientRect().height);
    expect(height).toBeLessThan(100);

    // ...and the card floats below the bar rather than inflating it.
    const drawerTop = await drawer.evaluate((el) => el.getBoundingClientRect().top);
    expect(drawerTop).toBeGreaterThanOrEqual(height - 1);
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

  // The bridge collapses to h-8 on mobile to reclaim ~65px of dead space, which
  // put its caption straight on top of the bracket graphic (caption band y8-21
  // vs graphic ~y16 at 375px). Same shape of regression as the header bug: a
  // Tailwind class silently reintroducing a broken layout.
  test("section bridge caption never overlaps its graphic", async ({ page, isMobile }) => {
    await page.goto("/");
    const boxes = await page.evaluate(() => {
      const bridge = document.querySelector("[data-section-bridge]");
      if (!bridge) return null;
      const root = bridge.getBoundingClientRect();
      const captionEl = bridge.querySelector("[data-bridge='caption']");
      if (!captionEl || getComputedStyle(captionEl).display === "none") {
        return { captionHidden: true, overlap: false };
      }
      const cap = captionEl.getBoundingClientRect();
      const paths = [...bridge.querySelectorAll("svg path")].map((p) => p.getBoundingClientRect());
      if (!paths.length) return { captionHidden: false, overlap: false };
      const gTop = Math.min(...paths.map((r) => r.top));
      const gBottom = Math.max(...paths.map((r) => r.bottom));
      return {
        captionHidden: false,
        overlap: !(cap.bottom < gTop || cap.top > gBottom),
        containerHeight: Math.round(root.height),
      };
    });

    expect(boxes, "expected a section bridge on the page").not.toBeNull();
    expect(boxes!.overlap, "caption is drawn on top of the bracket graphic").toBe(false);
    // Below sm the container is only 32px tall — there is no room for both, so
    // the caption must be hidden rather than merely nudged.
    if (isMobile) expect(boxes!.captionHidden).toBe(true);
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

  test("drawer link lands the section below the fixed header", async ({ page, isMobile }) => {
    test.skip(!isMobile, "drawer is display:none at md and above");

    // LazySection bypasses its IntersectionObserver gate when
    // navigator.webdriver is true, rendering every section eagerly — which
    // would make the lazy-growth half of this test vacuous. Spoof it off so
    // the real deferred-mount path runs. Spec-only; no production change.
    await page.addInitScript(() =>
      Object.defineProperty(navigator, "webdriver", { get: () => false }),
    );
    await page.goto("/");

    await page.getByRole("button", { name: /open menu/i }).click();
    await page.getByTestId("mobile-drawer").getByText("Services").click();
    // Exactly one #services exists at any moment: LazySection's placeholder
    // holds the anchor id until ServicesSection mounts and takes it over.
    //
    // Expected landing is scroll-padding-top (5rem = 80px). Before the fix the
    // target drifted ~4,000px as lazy sections expanded mid-scroll.
    const landed = () =>
      page.locator("#services").evaluate((el) => {
        const top = el.getBoundingClientRect().top;
        return top > 20 && top < 140;
      });

    // Poll rather than sleep: the settle loop's own ceiling is
    // MAX_SETTLE_TRIES(20) x SETTLE_INTERVAL_MS(50) = 1000ms, so any fixed wait
    // near that races CI contention or a cold chunk cache.
    await expect.poll(landed, { timeout: 8000 }).toBe(true);

    // ...and it has to *stay* there. Converging and then drifting back out once
    // the settle loop's budget expires would be the same bug wearing a hat.
    await page.waitForTimeout(1500);
    expect(await landed(), "target drifted back out after settling").toBe(true);
  });
});
