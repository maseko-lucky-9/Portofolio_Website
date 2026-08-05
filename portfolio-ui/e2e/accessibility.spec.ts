import { test, expect } from "@playwright/test";

test.describe("Accessibility", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
  });

  test("skip-to-content link exists and works", async ({ page }) => {
    // Keyboard focus navigation behaviour is desktop-only; mobile viewports don't
    // expose Tab-focus sequences the same way. Return early (vacuous pass) on mobile.
    const vp = page.viewportSize();
    if (!vp || vp.width < 768) return;

    // Tab to activate skip link
    await page.keyboard.press("Tab");

    const skipLink = page.getByText("Skip to main content");
    await expect(skipLink).toBeFocused();

    // Press Enter to activate
    await page.keyboard.press("Enter");
    await page.waitForTimeout(500);

    // Should scroll to about section
    const aboutSection = page.locator("#about");
    await expect(aboutSection).toBeInViewport();
  });

  test("all images have alt text", async ({ page }) => {
    // Check all images have non-empty alt attributes
    const images = page.locator("img");
    const count = await images.count();

    for (let i = 0; i < count; i++) {
      const alt = await images.nth(i).getAttribute("alt");
      expect(alt, `Image ${i} missing alt text`).toBeTruthy();
    }
  });

  test("sections have aria-labelledby attributes", async ({ page }) => {
    // #contact is inside a React.lazy + Suspense boundary — wait for it.
    await page.locator("#contact").waitFor({ state: "attached", timeout: 15000 });

    // The anchor id lives on Index.tsx's LazySection wrapper (it must exist
    // before the section mounts); the labelled landmark is the <section>
    // inside it. Asserting on the wrapper would only ever read null.
    const sections = ["skills", "projects", "contact"];

    for (const id of sections) {
      const section = page.locator(`#${id} section`).first();
      await expect(section, `Section #${id} did not mount`).toBeAttached();
      const labelledBy = await section.getAttribute("aria-labelledby");
      expect(labelledBy, `Section #${id} missing aria-labelledby`).toBeTruthy();
      // The label target must actually exist, or the association is dead.
      await expect(page.locator(`#${labelledBy}`)).toBeAttached();
    }
  });

  test("interactive elements are focusable", async ({ page }) => {
    // Desktop nav buttons are hidden (display:none) on mobile — programmatic
    // focus on hidden elements is undefined behaviour. Vacuous pass on mobile.
    const vp = page.viewportSize();
    if (!vp || vp.width < 768) return;

    // Theme toggle should be focusable
    const themeButton = page.getByRole("button", { name: "Toggle theme" });
    await themeButton.focus();
    await expect(themeButton).toBeFocused();

    // Nav links should be focusable
    const firstNavLink = page.locator("header nav button").first();
    await firstNavLink.focus();
    await expect(firstNavLink).toBeFocused();
  });

  test("social links have aria-labels", async ({ page }) => {
    // github + linkedin are the required pair; twitter is optional and
    // currently empty (personalData.social.twitter === ""), so the component
    // renders no link for it — asserting on it here only tested the fixture.
    const socialLabels = ["GitHub", "LinkedIn"];

    for (const label of socialLabels) {
      const links = page.getByLabel(label);
      const count = await links.count();
      expect(count, `No link with aria-label "${label}"`).toBeGreaterThan(0);
    }
  });
});
