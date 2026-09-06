import { test, expect } from "@playwright/test";
import { personalData } from "../src/data/personal";

test.describe("Hero", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
  });

  test("displays the two-tone headline", async ({ page }) => {
    const h1 = page.locator("#hero-heading");
    await expect(h1).toBeVisible();
    await expect(h1).toContainText("Kubernetes platforms");
    await expect(h1).toContainText("for South African");
    await expect(h1).toContainText("banking.");
  });

  test("states the sourced tagline", async ({ page }) => {
    await expect(page.locator("#hero .lede")).toHaveText(personalData.tagline);
  });

  // The full availability line is quoted verbatim by src/chat.ts, which refuses
  // to state availability beyond it. The hero only paraphrases it; #contact is
  // where it has to appear in full, or the site and the bot disagree about the
  // highest-intent question a recruiter asks.
  test("states the full availability line on the closing slab", async ({ page }) => {
    const slab = page.locator("#contact");
    await slab.scrollIntoViewIfNeeded();
    await expect(slab.getByText(personalData.availability)).toBeVisible();
  });

  // The role title moved out of the hero with the redesign. src/chat.ts reads
  // the same field, so it still has to be stated somewhere on the page.
  test("states the role title in the footer", async ({ page }) => {
    await expect(page.locator("footer").getByText(personalData.title)).toBeVisible();
  });

  test("CTAs point at real sections", async ({ page }) => {
    await expect(page.getByRole("link", { name: "View the work" })).toHaveAttribute(
      "href",
      "#work",
    );
    await expect(
      page.locator("#hero").getByRole("link", { name: /Get in touch/i }),
    ).toHaveAttribute("href", "#contact");
  });

  test("metric cards display values and labels", async ({ page }) => {
    // Mirrors personalData.metrics. The third slot used to be `clients: "10+"`
    // and is now `certifications: "3"` — see the rationale in
    // src/data/personal.ts; assert the labels so a value edit fails loudly here.
    const metrics = page.locator(".metrics");
    await expect(metrics.getByText("20+", { exact: true })).toBeVisible();
    await expect(metrics.getByText("Projects", { exact: true })).toBeVisible();
    await expect(metrics.getByText("8+ Years", { exact: true })).toBeVisible();
    await expect(metrics.getByText("3", { exact: true })).toBeVisible();
    await expect(metrics.getByText("Certifications", { exact: true })).toBeVisible();
  });

  test("social links are reachable from the page", async ({ page }) => {
    const github = page.getByLabel("GitHub").first();
    await expect(github).toHaveAttribute("href", /github\.com/);
    const linkedin = page.getByLabel("LinkedIn").first();
    await expect(linkedin).toHaveAttribute("href", /linkedin\.com/);
  });

  // The background is an enhancement, never a requirement: the gradient
  // fallback is what the page is designed around, and the WebGL scene layers
  // over it. Both layers must exist on every load.
  test("the ambient field renders its host and its fallback", async ({ page }) => {
    await expect(page.locator("#aura-bg #us-host")).toHaveCount(1);
    await expect(page.locator("#field-fallback")).toHaveCount(1);
  });
});
