import { test, expect } from "@playwright/test";

test.describe("Theme Toggle", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
  });

  test("toggles to dark mode", async ({ page }) => {
    // Click theme toggle button
    const themeButton = page.getByRole("button", { name: "Toggle theme" });
    await themeButton.click();

    // Click "Dark" option
    await page.getByRole("menuitem", { name: "Dark" }).click();

    // Verify dark class is applied to html element
    const htmlClass = await page.locator("html").getAttribute("class");
    expect(htmlClass).toContain("dark");
  });

  test("toggles to light mode", async ({ page }) => {
    // First switch to dark
    const themeButton = page.getByRole("button", { name: "Toggle theme" });
    await themeButton.click();
    await page.getByRole("menuitem", { name: "Dark" }).click();

    // Then switch to light
    await themeButton.click();
    await page.getByRole("menuitem", { name: "Light" }).click();

    const htmlClass = await page.locator("html").getAttribute("class");
    expect(htmlClass).not.toContain("dark");
  });

  test("theme persists across page reload", async ({ page }) => {
    // Switch to dark
    const themeButton = page.getByRole("button", { name: "Toggle theme" });
    await themeButton.click();
    await page.getByRole("menuitem", { name: "Dark" }).click();

    // Reload
    await page.reload();
    await page.waitForTimeout(500);

    // Should still be dark
    const htmlClass = await page.locator("html").getAttribute("class");
    expect(htmlClass).toContain("dark");
  });
});
