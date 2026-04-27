import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./e2e",
  // 2 local workers (one per project) keeps the preview server from being hit by
  // more concurrent page.goto() calls than it can serve without timeout. CI uses
  // 1 worker sequentially.
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 1,
  workers: process.env.CI ? 1 : 2,
  reporter: "html",
  // 60s per-test timeout covers lazy-loaded Suspense sections + scroll + assertions.
  timeout: 60000,
  use: {
    baseURL: "http://localhost:8080",
    trace: "on-first-retry",
    navigationTimeout: 45000,
    actionTimeout: 15000,
    // reducedMotion:"reduce" serves double duty in headless Chromium:
    //  1. AuroraBackground's useReducedMotion() returns true → CSS gradient path
    //     (no Canvas rendered) → no WebGL context creation error → React tree
    //     stays mounted → Navbar button is stable.
    //  2. Navbar uses initial={prefersReducedMotion ? false : {y:-80,opacity:0}}
    //     → initial={false} → header renders at final position immediately,
    //     no 500ms entrance animation window for the button to be unstable.
    reducedMotion: "reduce",
    // Prevent headless Chromium from throttling rAF for background pages.
    launchOptions: {
      args: [
        "--disable-backgrounding-occluded-windows",
        "--disable-renderer-backgrounding",
        "--disable-background-timer-throttling",
        "--force-device-scale-factor=1",
      ],
    },
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
    {
      name: "mobile",
      use: { ...devices["iPhone 13"] },
    },
  ],
  webServer: {
    // VITE_USE_API=false  → static data, no API calls, no isLoading→isError re-renders
    // VITE_DISABLE_WEBGL=true → AuroraBackground skips Three.js Canvas entirely,
    //   which would otherwise crash headless Chromium (no GPU → WebGL context fails →
    //   r3f throws → React unmounts the entire tree including the Navbar).
    // Also avoids HMR (dev server) which triggers full page reloads in headless mode.
    command: "VITE_USE_API=false VITE_DISABLE_WEBGL=true npm run build && npm run preview",
    url: "http://localhost:8080",
    reuseExistingServer: !process.env.CI,
    timeout: 120000,
  },
});
