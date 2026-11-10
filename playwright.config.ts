import { defineConfig, devices } from "@playwright/test";

/** Whether the tests run in CI, which GitHub Actions marks with `CI`. */
const isCi = !!process.env.CI;

/**
 * The production build is served from a subfolder, as on GitHub Pages, so the
 * tests catch a link that ignores the base path. The dev server covers `/`.
 */
const productionBasePath = "/weight-tracker-react/";

/**
 * The production build's address. Its own port, so it never clashes with a
 * dev server or a `vite preview` you're running yourself.
 */
const productionUrl = `http://localhost:4175${productionBasePath}`;

/**
 * How Playwright runs the end-to-end tests: the dev server's tests at desktop
 * and phone sizes, and the offline tests against a production build. See
 * {@link https://playwright.dev/docs/test-configuration | Playwright's config
 * guide}.
 */
export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  // Fails the CI run if a `test.only` was left in by mistake.
  forbidOnly: isCi,
  retries: isCi ? 2 : 0,
  reporter: isCi ? [["github"], ["html", { open: "never" }]] : "list",
  use: {
    baseURL: "http://localhost:5173",
    // Keeps a trace only for tests that fail, so passing runs stay small.
    trace: "retain-on-failure",
  },
  projects: [
    // Against the dev server, which has no service worker.
    {
      name: "desktop",
      testIgnore: "production/**",
      use: { ...devices["Desktop Chrome"] },
    },
    {
      name: "phone",
      testIgnore: "production/**",
      use: { ...devices["Pixel 7"] },
    },
    // Against a production build, for what only it has, such as working
    // offline.
    {
      name: "production",
      testMatch: "production/**",
      use: { ...devices["Desktop Chrome"], baseURL: productionUrl },
    },
  ],
  webServer: [
    {
      command: "npm run dev",
      url: "http://localhost:5173",
      // Locally, reuses a dev server that's already running.
      reuseExistingServer: !isCi,
    },
    {
      // Builds first, so the tests never run against an old `dist`. Type
      // checking is left to its own step.
      command: "npx vite build && npx vite preview --port 4175 --strictPort",
      // Both the build and the preview server read the base path.
      env: { BASE_PATH: productionBasePath },
      url: productionUrl,
      // Never reused, because a server left running could be serving an
      // older build.
      reuseExistingServer: false,
    },
  ],
});
