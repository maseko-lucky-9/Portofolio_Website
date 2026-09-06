import { test, expect } from "@playwright/test";

test.describe("Navigation", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
  });

  test("page loads with the hero visible", async ({ page }) => {
    await expect(page.locator("#hero")).toBeVisible();
    await expect(page.locator("#hero-heading")).toBeVisible();
  });

  test("nav links scroll to their sections", async ({ page }) => {
    // The section links are hidden below 768px by design — the pill collapses
    // to brand + CTA rather than opening a drawer. Vacuous on mobile.
    const vp = page.viewportSize();
    if (!vp || vp.width < 768) return;

    for (const [label, id] of [
      ["Skills", "#skills"],
      ["Work", "#work"],
      ["Experience", "#experience"],
    ] as const) {
      await page.getByRole("button", { name: label, exact: true }).click();
      await expect(page.locator(id)).toBeInViewport();
    }
  });

  test("brand returns to the top", async ({ page }) => {
    await page.evaluate(() => window.scrollTo(0, 2000));
    await page.waitForTimeout(500);
    await page.locator("header a").first().click();
    await page.waitForTimeout(800);
    expect(await page.evaluate(() => window.scrollY)).toBeLessThan(100);
  });
});

test.describe("Navigation — mobile", () => {
  test.use({ viewport: { width: 375, height: 812 } });

  // The drawer is gone. With seven scroll-anchors on one page it duplicated the
  // scroll rather than adding a way to get anywhere; the CTA is the action a
  // recruiter on a phone actually needs, and it stays visible.
  test("collapses to brand and CTA, with no drawer", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator("header .brand")).toBeVisible();
    await expect(page.locator("header .btn-light")).toBeVisible();
    await expect(page.getByRole("button", { name: "Open menu" })).toHaveCount(0);
    await expect(page.getByTestId("mobile-drawer")).toHaveCount(0);
    for (const label of ["Skills", "Work", "Experience"]) {
      await expect(page.getByRole("button", { name: label, exact: true })).toBeHidden();
    }
  });

  test("the header pill stays inside the viewport", async ({ page }) => {
    await page.goto("/");
    const box = await page.locator("header").boundingBox();
    const width = page.viewportSize()!.width;
    expect(box!.x).toBeGreaterThanOrEqual(0);
    expect(box!.x + box!.width).toBeLessThanOrEqual(width);
  });
});
