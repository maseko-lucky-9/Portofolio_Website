import { test, expect } from "@playwright/test";
import { personalData } from "../src/data/personal";

test.describe("Contact", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    await page.locator("#contact").scrollIntoViewIfNeeded();
  });

  test("renders the closing slab and its heading", async ({ page }) => {
    await expect(page.locator("#contact .slab")).toBeVisible();
    await expect(page.locator("#contact-heading")).toContainText("Need someone who has already");
  });

  test("offers three direct channels", async ({ page }) => {
    await expect(page.locator("#contact .slab-card")).toHaveCount(3);
    await expect(page.locator("#contact").getByLabel("Email")).toHaveAttribute(
      "href",
      `mailto:${personalData.email}`,
    );
    await expect(page.locator("#contact").getByLabel("LinkedIn")).toHaveAttribute(
      "href",
      personalData.social.linkedin,
    );
    await expect(page.locator("#contact").getByLabel("GitHub")).toHaveAttribute(
      "href",
      personalData.social.github,
    );
  });

  // Production builds with VITE_USE_API=false and has no backend, so a form
  // here would collect nothing. The mailto card is the channel the old form's
  // own fallback used.
  test("renders no form", async ({ page }) => {
    await expect(page.locator("#contact form")).toHaveCount(0);
    await expect(page.locator("#contact input")).toHaveCount(0);
  });

  test("states the location in the footer", async ({ page }) => {
    await expect(page.locator("footer")).toContainText(/Gauteng.*South Africa/);
  });
});
