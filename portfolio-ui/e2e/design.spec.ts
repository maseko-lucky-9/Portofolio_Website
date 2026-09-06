import { test, expect } from "@playwright/test";
import { services } from "../src/data/services";
import { faq } from "../src/data/faq";
import { experiences } from "../src/data/experience";

/**
 * The design contract: the things that would silently degrade rather than throw.
 * A font that failed to load, a section that lost its rhythm, a control with no
 * focus ring — none of these break a build, and none of the behavioural specs
 * would notice.
 */

test("all three faces actually load", async ({ page }) => {
  await page.goto("/");
  const loaded = await page.evaluate(async () => {
    await document.fonts.ready;
    return {
      display: document.fonts.check('italic 16px "Spectral"'),
      body: document.fonts.check('16px "Public Sans Variable"'),
      mono: document.fonts.check('12px "JetBrains Mono"'),
    };
  });
  // A silently-failed webfont falls back to Georgia/Arial and still "looks
  // fine" in a screenshot, which is exactly why this is asserted.
  expect(loaded).toEqual({ display: true, body: true, mono: true });
});

test("the display face is applied to the headline", async ({ page }) => {
  await page.goto("/");
  const font = await page
    .locator("#hero-heading")
    .evaluate((el) => getComputedStyle(el).fontFamily);
  expect(font).toContain("Spectral");
});

test("no horizontal overflow at any breakpoint", async ({ page }) => {
  for (const [w, h] of [
    [375, 812],
    [768, 1024],
    [1024, 768],
    [1440, 900],
  ]) {
    await page.setViewportSize({ width: w, height: h });
    await page.goto("/");
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await page.waitForTimeout(600);
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
    );
    expect(overflow, `horizontal overflow at ${w}px`).toBe(0);
  }
});

test("keyboard focus is always visible", async ({ page }) => {
  await page.goto("/");
  // The reference design ships focus:outline-none on every control and never
  // replaces it (WCAG 2.4.7). This is the rule that does not inherit that.
  for (let i = 0; i < 6; i++) {
    await page.keyboard.press("Tab");
    const ring = await page.evaluate(() => {
      const el = document.activeElement;
      if (!el || el === document.body) return null;
      const s = getComputedStyle(el);
      return { width: parseFloat(s.outlineWidth), style: s.outlineStyle };
    });
    if (!ring) continue;
    expect(ring.width).toBeGreaterThanOrEqual(2);
    expect(ring.style).not.toBe("none");
  }
});

test("the trust strip names every employer and the credential", async ({ page }) => {
  await page.goto("/");
  const strip = page.locator(".mq-set").first();
  for (const company of [...new Set(experiences.map((e) => e.company))]) {
    await expect(strip).toContainText(company);
  }
  await expect(page.locator(".mq-badge")).toContainText("8+ years in South African banking");
});

test("the capability cards carry the real service copy", async ({ page }) => {
  await page.goto("/");
  await page.locator("#services").scrollIntoViewIfNeeded();
  await expect(page.locator("#services .cap")).toHaveCount(services.length);
  for (const s of services) {
    await expect(page.locator(`#service-${s.id}-heading`)).toHaveText(s.name);
  }
});

test("the FAQ opens and closes", async ({ page }) => {
  await page.goto("/");
  await page.locator("#how").scrollIntoViewIfNeeded();
  const rows = page.locator("#how details");
  await expect(rows).toHaveCount(faq.length);
  // First ships open so the section reads as answered content.
  await expect(rows.first()).toHaveAttribute("open", "");
  const second = rows.nth(1);
  await expect(second).not.toHaveAttribute("open", "");
  await second.locator("summary").click();
  await expect(second).toHaveAttribute("open", "");
});

test("the manifest agrees with the meta theme colour", async ({ page }) => {
  await page.goto("/");
  const meta = await page.locator('meta[name="theme-color"]').getAttribute("content");
  const manifest = await (await page.request.get("/site.webmanifest")).json();
  // A cream background_color survived here from the retired light theme and
  // would have flashed on the PWA splash screen of a dark-only site.
  expect(manifest.theme_color).toBe(meta);
  expect(manifest.background_color).toBe(meta);
});
