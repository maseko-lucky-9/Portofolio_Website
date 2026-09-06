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

    // Should land on the main landmark, which now wraps every section.
    await expect(page.locator("#main")).toBeInViewport();
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
    const sections = ["skills", "work", "contact"];

    for (const id of sections) {
      const section = page.locator(`#${id} section`).first();
      await expect(section, `Section #${id} did not mount`).toBeAttached();
      const labelledBy = await section.getAttribute("aria-labelledby");
      expect(labelledBy, `Section #${id} missing aria-labelledby`).toBeTruthy();
      // The label target must actually exist, or the association is dead.
      await expect(page.locator(`#${labelledBy}`)).toBeAttached();
    }
  });

  test("no element id appears twice", async ({ page }) => {
    // Every lazy section used to carry its id twice — once on Index.tsx's
    // anchor wrapper, once on the <section> — which made `#id` resolve to the
    // wrapper and hid the landmark's aria-labelledby. Strict-mode violations
    // in unrelated specs were the only signal, and a past contributor silenced
    // one with `.first()` rather than removing the duplicate, so the bug
    // survived. This names the invariant instead of relying on that side effect.
    // Wait for every lazy section to actually mount — each is its own chunk,
    // and an unmounted section is one that cannot contribute a duplicate id,
    // which would make this pass vacuously. The heading ids only exist once
    // the real component has rendered.
    for (const heading of [
      "hero-heading",
      "operator-heading",
      "skills-heading",
      "experience-heading",
      "work-heading",
      "services-heading",
      "how-heading",
      "contact-heading",
    ]) {
      await page.locator(`#${heading}`).waitFor({ state: "attached", timeout: 20000 });
    }

    const duplicates = await page.evaluate(() => {
      const seen = new Set<string>();
      const dupes = new Set<string>();
      for (const el of document.querySelectorAll("[id]")) {
        if (seen.has(el.id)) dupes.add(el.id);
        seen.add(el.id);
      }
      return [...dupes];
    });

    expect(duplicates, `duplicate ids: ${duplicates.join(", ")}`).toEqual([]);
  });

  test("interactive elements are focusable", async ({ page }) => {
    // Desktop nav buttons are hidden (display:none) on mobile — programmatic
    // focus on hidden elements is undefined behaviour. Vacuous pass on mobile.
    const vp = page.viewportSize();
    if (!vp || vp.width < 768) return;

    // The theme toggle is gone with light mode; the header CTA is the control
    // that has to stay reachable, because it is the page's primary action.
    const cta = page.locator("header .btn-light");
    await cta.focus();
    await expect(cta).toBeFocused();

    // Nav links should be focusable
    const firstNavLink = page.locator("header nav button").first();
    await firstNavLink.focus();
    await expect(firstNavLink).toBeFocused();

    // The visible focus RING is asserted in design.spec.ts, with real Tab
    // presses: the ring is :focus-visible, and a programmatic .focus() call
    // deliberately does not match it. Asserting an outline here would test the
    // browser's heuristic rather than our styles.
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
