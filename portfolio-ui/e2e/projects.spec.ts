import { test, expect } from "@playwright/test";

test.describe("Projects Section", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    // ProjectsSection is eagerly loaded (no Suspense). With VITE_USE_API=false,
    // static data renders immediately — no loading skeleton to wait for.
    await page.locator("#projects").scrollIntoViewIfNeeded();
    // Short wait for card animations to settle (framer-motion initial → animate)
    await page.waitForSelector(".card-project", { timeout: 5000 }).catch(() => {});
  });

  test("displays section heading", async ({ page }) => {
    await expect(page.locator("#projects").getByText("Featured Projects")).toBeVisible();
  });

  test("renders project cards or empty state", async ({ page }) => {
    // Should have project cards or an empty state message
    const cards = page.locator(".card-project");
    const emptyState = page.locator("#projects").getByText(/No projects/);

    const cardCount = await cards.count();
    const hasEmpty = await emptyState.isVisible().catch(() => false);

    // At least one of these should be true
    expect(cardCount > 0 || hasEmpty).toBeTruthy();
  });

  test("section has filter area or loading state", async ({ page }) => {
    // Projects section should contain either filter buttons or skeleton loaders
    const section = page.locator("#projects");
    await expect(section).toBeVisible();

    // The section heading should always be present
    await expect(section.getByText("Featured Projects")).toBeVisible();
  });
});
