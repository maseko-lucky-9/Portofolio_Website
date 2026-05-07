import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

/**
 * axe-core a11y scan — primary visual gate after the palette swap.
 *
 * Replaces snapshot regeneration (which is circular when palette changes
 * deliberately) with a content-based contrast + ARIA audit.
 *
 * Scope: hero, navbar, primary CTAs (the surfaces touched by the refresh).
 * Both light and dark themes are exercised.
 */

const wcagTags = ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"];

test.describe("axe-core a11y scan", () => {
  test("hero + navbar + CTAs — light theme — no WCAG AA violations", async ({
    page,
  }) => {
    await page.emulateMedia({ colorScheme: "light" });
    await page.goto("/");
    // Wait for hero text to settle so contrast calc reads final colours.
    await expect(page.locator("#hero-heading")).toBeVisible();

    const results = await new AxeBuilder({ page })
      .include("header")
      .include("#about")
      .withTags(wcagTags)
      .analyze();

    expect(
      results.violations,
      `axe violations (light): ${JSON.stringify(results.violations, null, 2)}`
    ).toEqual([]);
  });

  test("hero + navbar + CTAs — dark theme — no WCAG AA violations", async ({
    page,
  }) => {
    await page.emulateMedia({ colorScheme: "dark" });
    await page.goto("/");
    await expect(page.locator("#hero-heading")).toBeVisible();

    const results = await new AxeBuilder({ page })
      .include("header")
      .include("#about")
      .withTags(wcagTags)
      .analyze();

    expect(
      results.violations,
      `axe violations (dark): ${JSON.stringify(results.violations, null, 2)}`
    ).toEqual([]);
  });
});
