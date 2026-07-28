/**
 * Guards the `data-lenis-prevent` opt-out on the chat log (ChatWidget.tsx).
 *
 * Lenis preventDefaults every wheel event and virtual-scrolls the document, so
 * removing that one attribute silently reverts the log to unscrollable while
 * everything still renders and every other test stays green. This is the only
 * check that fails when it goes missing.
 */
import { test, expect } from "@playwright/test";

test.describe("chat log scrolling", () => {
  // The shared config sets reducedMotion:"reduce", which gates Lenis off
  // entirely — the bug is invisible under it, so force motion on here.
  test.use({ reducedMotion: "no-preference" });

  test("wheel over the log scrolls the log, not the page behind it", async ({ page }) => {
    // Long single answer so the log reliably overflows its 560px panel.
    await page.route("**/api/chat", async (route) => {
      const body =
        Array.from(
          { length: 220 },
          (_, i) => `data: ${JSON.stringify({ response: `token${i} ` })}\n`,
        ).join("") + "data: [DONE]\n";
      await route.fulfill({
        status: 200,
        headers: { "content-type": "text/event-stream" },
        body,
      });
    });

    await page.goto("/");

    // Prove Lenis is actually running — otherwise this test passes trivially.
    await expect
      .poll(() => page.evaluate(() => document.documentElement.classList.contains("lenis")), {
        timeout: 10000,
      })
      .toBe(true);

    await page.getByRole("button", { name: /Ask about Thulani's experience/i }).click();
    const panel = page.locator("#chat-panel");
    await expect(panel).toBeVisible();

    const log = panel.getByRole("log");
    // JSX renders the bare attribute as ="true"; Lenis only calls hasAttribute().
    expect(await log.evaluate((el) => el.hasAttribute("data-lenis-prevent"))).toBe(true);

    await panel.getByPlaceholder("Ask a question…").fill("tell me everything");
    await page.keyboard.press("Enter");

    await expect
      .poll(() => log.evaluate((el) => el.scrollHeight - el.clientHeight), { timeout: 20000 })
      .toBeGreaterThan(50);

    await log.evaluate((el) => (el.scrollTop = 0));
    const pageBefore = await page.evaluate(() => window.scrollY);

    const box = (await log.boundingBox())!;
    await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
    await page.mouse.wheel(0, 300);
    await page.waitForTimeout(1200);

    expect(await log.evaluate((el) => el.scrollTop), "log should have scrolled").toBeGreaterThan(
      50,
    );
    expect(await page.evaluate(() => window.scrollY), "page must not scroll behind the panel").toBe(
      pageBefore,
    );
  });

  test("the opt-out does not leak — page still smooth-scrolls outside the panel", async ({
    page,
  }) => {
    await page.goto("/");
    await expect
      .poll(() => page.evaluate(() => document.documentElement.classList.contains("lenis")), {
        timeout: 10000,
      })
      .toBe(true);

    const before = await page.evaluate(() => window.scrollY);
    await page.mouse.move(640, 400);
    await page.mouse.wheel(0, 600);
    await page.waitForTimeout(1500);
    expect(await page.evaluate(() => window.scrollY)).toBeGreaterThan(before + 100);
  });
});
