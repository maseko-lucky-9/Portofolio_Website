import { defineConfig, devices } from "@playwright/test";

// Set E2E_BASE_URL to point the suite at an already-running host instead of a
// locally-built preview — e.g. verifying a custom domain after a DNS cutover:
//   E2E_BASE_URL=https://thulanimaseko.co.za npx playwright test e2e/live-domain.spec.ts
// When it is set the webServer block is dropped, so nothing is built or served
// locally and the tests hit the real deployment.
const liveBaseUrl = process.env.E2E_BASE_URL;

// E2E_FULL_SUITE=1 lifts the live-domain-only restriction below. It exists for
// exactly one case: the Docker trial run, where E2E_BASE_URL points at a
// throwaway container on localhost and the whole suite is precisely what we
// want to fire at it.
//
// Deliberately NOT a second base-URL variable. Two env vars a character apart,
// with opposite testMatch semantics, is the same footgun the comment below was
// written to prevent — a typo or a stale export silently picks the wrong one.
// One URL variable plus a loud, separate opt-in means a leftover E2E_BASE_URL
// can never aim the full suite at production.
const fullSuite = process.env.E2E_FULL_SUITE === "1";

export default defineConfig({
  testDir: "./e2e",
  // When targeting a live deployment, restrict to the spec built for that —
  // e2e/live-domain.spec.ts is read-only by design, but nothing stops the
  // other 8 specs from also matching if someone runs the bare `test:e2e`
  // script (or a future spec) with E2E_BASE_URL still exported in their
  // shell. Scoping here means production can only ever receive the traffic
  // this file's specs were reviewed for producing.
  testMatch: liveBaseUrl && !fullSuite ? "live-domain.spec.ts" : undefined,
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
    baseURL: liveBaseUrl ?? "http://localhost:5173",
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
  },
  projects: [
    {
      name: "chromium",
      use: {
        ...devices["Desktop Chrome"],
        // Prevent headless Chromium from throttling rAF for background pages.
        //
        // These live on the chromium project, NOT in the shared `use` block.
        // They are Chromium command-line flags, and the "mobile" project below
        // is WebKit (devices["iPhone 13"] carries defaultBrowserType:"webkit").
        // Linux WebKit parses its argv strictly and dies on the first unknown
        // option — "Cannot parse arguments: Unknown option
        // --disable-backgrounding-occluded-windows" — so every [mobile] test
        // failed at browserType.launch on CI while passing on macOS, whose
        // WebKit build ignores the same flags. Shared-block launch args are a
        // silent cross-platform trap; keep browser-specific flags on the
        // browser-specific project.
        launchOptions: {
          args: [
            "--disable-backgrounding-occluded-windows",
            "--disable-renderer-backgrounding",
            "--disable-background-timer-throttling",
            "--force-device-scale-factor=1",
          ],
        },
      },
    },
    {
      name: "mobile",
      use: { ...devices["iPhone 13"] },
    },
  ],
  // Skipped entirely when E2E_BASE_URL targets a live deployment — there is
  // nothing to build or serve in that case.
  webServer: liveBaseUrl
    ? undefined
    : {
        // VITE_USE_API=false  → static data, no API calls, no isLoading→isError re-renders
        //
        // VITE_DISABLE_WEBGL is gone: nothing has read it since the three.js
        // teardown, and FieldBackground feature-detects WebGL2 itself and falls
        // back to the CSS gradient — so headless Chromium needs no flag.
        //
        // Also avoids HMR (dev server) which triggers full page reloads in headless mode.
        command: "VITE_USE_API=false npm run build && npm run preview",
        url: "http://localhost:5173",
        reuseExistingServer: !process.env.CI,
        timeout: 120000,
      },
});
