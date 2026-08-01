import { test, expect } from "@playwright/test";
import { personalData } from "../src/data/personal";

test.describe("Hero Section", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
  });

  test("displays hero content", async ({ page }) => {
    // Name should be visible (split across elements in hero)
    await expect(page.locator("#about").getByText("Thulani")).toBeVisible();

    // Title and availability are asserted against personalData rather than literals:
    // both are load-bearing strings the chatbot reads (availability is quoted verbatim
    // under chat.ts rule 3), so they change together with the data and a hardcoded
    // copy here would just go stale silently — as it did.
    await expect(page.locator("#about").getByText(personalData.title)).toBeVisible();
    await expect(page.getByText(personalData.availability)).toBeVisible();
  });

  test("CTA buttons are present", async ({ page }) => {
    await expect(page.getByRole("button", { name: /View My Work/i })).toBeVisible();
    await expect(page.getByRole("button", { name: /Contact Me/i })).toBeVisible();
  });

  test("metric cards display values", async ({ page }) => {
    await expect(page.getByText("20+")).toBeVisible();
    await expect(page.getByText("8+ Years", { exact: true })).toBeVisible();
    await expect(page.getByText("10+")).toBeVisible();
  });

  test("social links are present", async ({ page }) => {
    const githubLink = page.getByLabel("GitHub").first();
    await expect(githubLink).toBeVisible();
    await expect(githubLink).toHaveAttribute("href", /github\.com/);

    const linkedinLink = page.getByLabel("LinkedIn").first();
    await expect(linkedinLink).toBeVisible();
    await expect(linkedinLink).toHaveAttribute("href", /linkedin\.com/);
  });

  test("WebGL canvas or fallback renders", async ({ page }) => {
    // Either a canvas element (WebGL) or gradient fallback divs should be present
    const canvas = page.locator("#about canvas");
    const gradientFallback = page.locator("#about .blur-3xl");

    const hasCanvas = await canvas.count();
    const hasFallback = await gradientFallback.count();

    expect(hasCanvas + hasFallback).toBeGreaterThan(0);
  });
});
