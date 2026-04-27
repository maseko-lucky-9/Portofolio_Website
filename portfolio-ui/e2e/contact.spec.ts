import { test, expect } from "@playwright/test";

test.describe("Contact Section", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    // ContactSection is lazy-loaded (React.lazy + Suspense). Wait for it to
    // attach to the DOM before scrolling — otherwise scrollIntoViewIfNeeded()
    // throws "element is not attached to the DOM".
    await page.locator("#contact").waitFor({ state: "attached", timeout: 15000 });
    await page.locator("#contact").scrollIntoViewIfNeeded();
    await page.waitForTimeout(500);
  });

  test("displays section heading", async ({ page }) => {
    await expect(page.getByText("Get in Touch")).toBeVisible();
  });

  test("contact form renders all fields", async ({ page }) => {
    await expect(page.getByLabel("Name")).toBeVisible();
    await expect(page.getByLabel("Email")).toBeVisible();
    await expect(page.getByLabel("Subject")).toBeVisible();
    await expect(page.getByLabel("Message")).toBeVisible();
  });

  test("send button is present", async ({ page }) => {
    await expect(page.getByRole("button", { name: /Send Message/i })).toBeVisible();
  });

  test("shows validation errors on empty submit", async ({ page }) => {
    // Click send without filling form
    await page.getByRole("button", { name: /Send Message/i }).click();

    // Should show validation errors
    await expect(page.getByText(/Name must be at least/i)).toBeVisible();
    await expect(page.getByText(/Please enter a valid email/i)).toBeVisible();
  });

  test("contact info is displayed", async ({ page }) => {
    await expect(page.getByText("ltmaseko7@gmail.com")).toBeVisible();
    await expect(page.getByText(/Gauteng.*South Africa/)).toBeVisible();
  });
});
