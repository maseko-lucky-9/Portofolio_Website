/**
 * Chat avatar — attribute-based assertions only. The shared config forces
 * reducedMotion:"reduce", so every check here targets `data-avatar-state` /
 * `data-glow` state hooks, which flip regardless of animation.
 */
import { test, expect, type Page } from "@playwright/test";

const LAUNCHER = /Ask about Thulani's experience/i;

/** Delays fulfillment so the `busy` (glowing-bulb) window is observable. */
async function stubChatDelayed(page: Page, delayMs = 1200) {
  await page.route("**/api/chat", async (route) => {
    await new Promise((r) => setTimeout(r, delayMs));
    await route.fulfill({
      status: 200,
      headers: { "content-type": "text/event-stream" },
      body: 'data: {"response":"Hello from the bot."}\ndata: [DONE]\n',
    });
  });
}

test.describe("chat avatar", () => {
  test("launcher renders the robot with state hooks", async ({ page }) => {
    await page.goto("/");
    const launcher = page.getByRole("button", { name: LAUNCHER });
    await expect(launcher).toBeVisible();
    const avatar = launcher.locator("[data-avatar-state]");
    await expect(avatar).toHaveAttribute("data-avatar-state", "awake");
    await expect(avatar).toHaveAttribute("data-glow", "false");
    await expect(launcher.locator("svg")).toBeVisible();
  });

  test("avatar persists while the panel is open; badge appears; header close works", async ({
    page,
  }) => {
    await page.goto("/");
    const launcher = page.getByRole("button", { name: LAUNCHER });
    await launcher.click();
    await expect(page.locator("#chat-panel")).toBeVisible();

    await expect(launcher.locator("[data-avatar-state]")).toBeVisible();
    await expect(launcher.getByTestId("avatar-close-badge")).toBeVisible();

    // The full-bleed mobile panel overlaps the launcher, so the canonical
    // close path (both projects) is the panel header's button.
    await page
      .locator("#chat-panel")
      .getByRole("button", { name: /Close chat/i })
      .click();
    await expect(page.locator("#chat-panel")).toBeHidden();
  });

  test("bulb glows during a streaming reply, then settles back to awake", async ({ page }) => {
    await stubChatDelayed(page);
    await page.goto("/");
    const launcher = page.getByRole("button", { name: LAUNCHER });
    await launcher.click();

    await page.locator("#chat-panel").getByPlaceholder("Ask a question…").fill("hi");
    await page.keyboard.press("Enter");

    const avatar = launcher.locator("[data-avatar-state]");
    await expect(avatar).toHaveAttribute("data-glow", "true");
    await expect(avatar).toHaveAttribute("data-avatar-state", "responding");

    await expect(page.locator("#chat-panel")).toContainText("Hello from the bot.");
    await expect(avatar).toHaveAttribute("data-glow", "false");
    // celebrating (~700ms) is allowed in between; it must settle to awake.
    await expect(avatar).toHaveAttribute("data-avatar-state", "awake", { timeout: 5000 });
  });
});
