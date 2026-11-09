import { defineConfig, devices } from "@playwright/test";

const isCi = !!process.env.CI;

// The production build's address. Its own port, so it never clashes with a
// dev server or a `vite preview` you're running yourself.
const productionUrl = "http://localhost:4175";

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
      url: productionUrl,
      // Never reused, because a server left running could be serving an
      // older build.
      reuseExistingServer: false,
    },
  ],
});
