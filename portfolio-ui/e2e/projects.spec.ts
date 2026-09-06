import { test, expect } from "@playwright/test";
import { projects } from "../src/data/projects";

test.describe("Selected work", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    await page.locator("#work").scrollIntoViewIfNeeded();
  });

  test("renders the section heading", async ({ page }) => {
    await expect(page.locator("#work-heading")).toContainText("Four repositories");
  });

  test("renders one showcase panel per project", async ({ page }) => {
    await expect(page.locator("#work .show-split")).toHaveCount(projects.length);
  });

  // src/data/projects.ts exists because entries once shipped with githubUrl
  // values that 404'd and impact metrics that had never been measured. Both
  // rules are asserted here, against the data rather than against literals.
  test("every project links to its real repository", async ({ page }) => {
    for (const p of projects) {
      const card = page.locator("#work article").filter({ hasText: p.title });
      await expect(card.locator('a[href^="https://github.com/"]')).toHaveAttribute(
        "href",
        p.githubUrl!,
      );
    }
  });

  test("every project states its impact", async ({ page }) => {
    for (const p of projects) {
      const card = page.locator("#work article").filter({ hasText: p.title });
      await expect(card).toContainText(p.impact);
    }
  });

  test("has no empty state and no technology filter", async ({ page }) => {
    await expect(page.getByText("No projects")).toHaveCount(0);
    await expect(page.locator("#work .tech-badge")).toHaveCount(0);
  });
});
