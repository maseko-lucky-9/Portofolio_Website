import { test, expect } from "@playwright/test";

test.describe("Navigation", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
  });

  test("page loads with hero section visible", async ({ page }) => {
    await expect(page.locator("#about")).toBeVisible();
    await expect(page.locator("#about").getByText("Thulani")).toBeVisible();
  });

  test("navbar links scroll to correct sections", async ({ page }) => {
    // Click Skills link
    await page.getByRole("button", { name: "Skills" }).first().click();
    await expect(page.locator("#skills")).toBeInViewport();

    // Click Projects link
    await page.getByRole("button", { name: "Projects" }).first().click();
    await expect(page.locator("#projects")).toBeInViewport();

    // Click Contact link
    await page.getByRole("button", { name: "Contact" }).first().click();
    await expect(page.locator("#contact")).toBeInViewport();
  });

  test("brand logo scrolls to top", async ({ page }) => {
    // Scroll down first
    await page.evaluate(() => window.scrollTo(0, 2000));
    await page.waitForTimeout(500);

    // Click brand logo
    await page.locator("header a").first().click();
    await page.waitForTimeout(800);

    const scrollY = await page.evaluate(() => window.scrollY);
    expect(scrollY).toBeLessThan(100);
  });
});

test.describe("Navigation - Mobile", () => {
  test.use({ viewport: { width: 375, height: 812 } });

  test("mobile menu opens and shows links", async ({ page }) => {
    await page.goto("/");

    // Mobile hamburger menu should be visible
    const menuButton = page.locator("header button").last();
    await menuButton.click();

    // Nav links should be visible in mobile menu
    await expect(page.locator("nav").last().getByText("Skills")).toBeVisible();
    await expect(page.locator("nav").last().getByText("Projects")).toBeVisible();
    await expect(page.locator("nav").last().getByText("Contact")).toBeVisible();
  });
});
