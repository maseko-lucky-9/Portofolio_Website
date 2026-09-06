import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

/**
 * axe-core scan — the primary automated gate on the palette.
 *
 * Content-based contrast + ARIA audit rather than snapshot regeneration, which
 * is circular when the palette changes deliberately.
 *
 * One theme, because the design is dark-only. The previous light-theme run was
 * already vacuous: the theme resolved to dark regardless of colorScheme
 * emulation, so both tests were scanning the same rendering.
 *
 * Each region is scanned with that region IN VIEW, one run per region, rather
 * than scrolling to the bottom and scanning everything at once. axe determines
 * an element's effective background by hit-testing, and for a node parked
 * thousands of pixels outside the viewport that resolves to nonsense — the same
 * white-on-dark label was reported at 1.26:1 and then 2.31:1 across two runs of
 * an identical page. In view, its real ratio is stable.
 */
const wcagTags = ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"];

const REGIONS: Array<{ name: string; selector: string; settled: string }> = [
  { name: "nav + hero", selector: "#hero", settled: "#hero-heading" },
  { name: "operator", selector: "#operator", settled: "#operator .portrait" },
  // The accent slab is the one surface where ink inverts to near-black (white
  // on that fill measures 2.14:1), so it is the likeliest place for a contrast
  // regression to land.
  { name: "contact slab", selector: "#contact", settled: "#contact .slab" },
];

for (const region of REGIONS) {
  test(`no WCAG AA violations — ${region.name}`, async ({ page }) => {
    await page.goto("/");
    await page.locator("#hero-heading").waitFor();
    await page.locator(region.selector).scrollIntoViewIfNeeded();
    await page.locator(region.settled).waitFor();

    const builder = new AxeBuilder({ page }).include(region.selector);
    // The nav pill is fixed, so it is on screen for the hero pass and belongs
    // to it; including it in every pass would just triple-report the same nodes.
    if (region.name === "nav + hero") builder.include("header");

    const results = await builder.withTags(wcagTags).analyze();

    expect(
      results.violations,
      `axe violations in ${region.name}: ${JSON.stringify(results.violations, null, 2)}`,
    ).toEqual([]);
  });
}
