/**
 * Guards the wheel containment on the chat log (ChatWidget.tsx) — the
 * `data-lenis-prevent` opt-out plus `overscroll-contain`.
 *
 * Both are silently deletable: remove either and everything still renders, every
 * other test stays green, and the panel quietly starts scrolling the page behind
 * it instead. These are the only checks that fail when that happens.
 */
import { test, expect, type Page } from "@playwright/test";

/** Streams one long answer so the log reliably overflows its 560px panel. */
async function stubChat(page: Page) {
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
}

/** Opens the panel and returns the log, already overflowing and settled. */
async function openOverflowingChat(page: Page) {
  await page.getByRole("button", { name: /Ask about Thulani's experience/i }).click();
  const panel = page.locator("#chat-panel");
  await expect(panel).toBeVisible();

  const log = panel.getByRole("log");
  await panel.getByPlaceholder("Ask a question…").fill("tell me everything");
  await page.keyboard.press("Enter");

  // Wait for the LAST token, not for "Thinking…" to clear — ChatWidget renders that
  // as {busy && !live}, so it disappears on the first token, not at stream end. This
  // matters because ChatWidget re-pins the log to the bottom on every token, which
  // would undo the scrollTop each test sets. Today route.fulfill happens to deliver
  // the whole SSE body atomically so the race can't fire; asserting on the final
  // token keeps that true if the stub is ever made genuinely chunked.
  await expect(log).toContainText("token219");
  await expect
    .poll(() => log.evaluate((el) => el.scrollHeight - el.clientHeight), { timeout: 20000 })
    .toBeGreaterThan(50);

  return { panel, log };
}

test.describe("chat log wheel containment", () => {
  // The shared config sets reducedMotion:"reduce", which gates Lenis off entirely
  // — the bug is invisible under it, so force motion on here.
  test.use({ reducedMotion: "no-preference" });

  // useShouldRenderSmoothScroll (src/lib/motion.ts) gates Lenis off for coarse
  // pointers, so Lenis never mounts on the `mobile` project and there is nothing
  // to guard. Without this the lenis-class poll below can never resolve.
  test.skip(({ isMobile }) => !!isMobile, "Lenis is disabled on coarse pointers");

  test.beforeEach(async ({ page }) => {
    await stubChat(page);
    await page.goto("/");
    // Prove Lenis is actually running — otherwise these tests pass vacuously.
    await expect
      .poll(() => page.evaluate(() => document.documentElement.classList.contains("lenis")), {
        timeout: 10000,
      })
      .toBe(true);
  });

  test("mid-scroll: wheel moves the log, not the page", async ({ page }) => {
    const { log } = await openOverflowingChat(page);

    await log.evaluate((el) => (el.scrollTop = 0));
    const pageBefore = await page.evaluate(() => window.scrollY);

    const box = (await log.boundingBox())!;
    await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
    await page.mouse.wheel(0, 300);

    // Behaviour first: these are what actually catch the regression. The
    // attribute assertion below is a tautology by comparison and must not
    // short-circuit them.
    await expect
      .poll(() => log.evaluate((el) => el.scrollTop), { timeout: 5000 })
      .toBeGreaterThan(50);
    expect(await page.evaluate(() => window.scrollY), "page must not scroll").toBe(pageBefore);

    // JSX renders the bare attribute as ="true"; Lenis only calls hasAttribute().
    expect(await log.evaluate((el) => el.hasAttribute("data-lenis-prevent"))).toBe(true);
  });

  test("at the scroll boundary: wheel does not chain to the page", async ({ page }) => {
    const { log } = await openOverflowingChat(page);

    // Pin the log to its BOTTOM, where data-lenis-prevent alone is not enough —
    // Lenis stands down and the wheel chains natively to the document unless
    // overscroll-contain stops it.
    await log.evaluate((el) => (el.scrollTop = el.scrollHeight));
    const pageBefore = await page.evaluate(() => window.scrollY);

    const box = (await log.boundingBox())!;
    await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
    for (let i = 0; i < 4; i++) {
      await page.mouse.wheel(0, 300);
      await page.waitForTimeout(150);
    }

    expect(
      await page.evaluate(() => window.scrollY),
      "page must not scroll once the log bottoms out",
    ).toBe(pageBefore);
    expect(await log.evaluate((el) => getComputedStyle(el).overscrollBehaviorY)).not.toBe("auto");
  });

  test("containment does not leak — wheel outside the open panel still scrolls the page", async ({
    page,
  }) => {
    // Deliberately with the panel OPEN: a containment fix that swallowed wheel
    // events page-wide would still pass if we only tested with it closed.
    await openOverflowingChat(page);

    const before = await page.evaluate(() => window.scrollY);
    await page.mouse.move(200, 300); // far left, clear of the bottom-right panel
    await page.mouse.wheel(0, 600);

    await expect
      .poll(() => page.evaluate(() => window.scrollY), { timeout: 5000 })
      .toBeGreaterThan(before + 100);
  });
});
