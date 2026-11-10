import react from "@vitejs/plugin-react";
import { defaultClientConditions } from "vite";
import { VitePWA } from "vite-plugin-pwa";
import { configDefaults, defineConfig } from "vitest/config";
import packageJson from "./package.json" with { type: "json" };

/**
 * How Vite serves and builds the app, and how Vitest runs its tests. See
 * {@link https://vite.dev/config/ | Vite's config reference} and
 * {@link https://vitest.dev/config/ | Vitest's}.
 */
export default defineConfig({
  // Replaces each `__APP_VERSION__` in the app's code with the version from
  // `package.json`, written as a string, when the app is built or tested.
  define: {
    __APP_VERSION__: JSON.stringify(packageJson.version),
  },
  // The path the app is served from. GitHub Pages serves it from the repo's
  // name, such as `/weight-tracker-react/`, and the container from `/`. Vite
  // puts it in front of every file the build links to, and the app reads it
  // as `import.meta.env.BASE_URL`.
  base: process.env.BASE_PATH ?? "/",
  plugins: [
    react(),
    // Writes the web app manifest and a service worker into the build, which
    // make the app installable and let it open with no connection.
    VitePWA({
      // A new version waits until the user agrees to reload, rather than
      // swapping the code under an open page.
      registerType: "prompt",
      // Icons outside the manifest that the service worker should also keep.
      includeAssets: [
        "favicon.ico",
        "favicon.svg",
        "apple-touch-icon-180x180.png",
      ],
      // `start_url` and `scope` are left out, so they default to Vite's base
      // path and follow it when the app is served from a subfolder.
      manifest: {
        name: "Weight Tracker",
        short_name: "Weight",
        description: "Log your daily weight and see your trends and progress.",
        // Opens in its own window, with no address bar.
        display: "standalone",
        // The page's light background, for the title bar and splash screen.
        // `index.html` switches the title bar to dark in dark mode.
        theme_color: "#ffffff",
        background_color: "#ffffff",
        // Made by `npm run generate-icons`.
        icons: [
          { src: "pwa-64x64.png", sizes: "64x64", type: "image/png" },
          { src: "pwa-192x192.png", sizes: "192x192", type: "image/png" },
          { src: "pwa-512x512.png", sizes: "512x512", type: "image/png" },
          {
            src: "maskable-icon-512x512.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "maskable",
          },
        ],
      },
    }),
  ],
  test: {
    // Playwright runs the `e2e` tests, so Vitest leaves them alone.
    exclude: [...configDefaults.exclude, "e2e/**"],
    // Two sets of tests, run together by `npm test`, each in the environment
    // it needs.
    projects: [
      {
        // Starts from this file's settings, such as `define` and `exclude`.
        extends: true,
        test: {
          name: "unit",
          include: ["src/**/*.test.ts"],
          // Plain Node, because the logic never renders anything, and
          // starting a simulated browser for each file would slow it down.
          environment: "node",
        },
      },
      {
        extends: true,
        test: {
          name: "components",
          include: ["src/**/*.test.tsx"],
          // A simulated browser page, so components can render.
          environment: "jsdom",
          setupFiles: ["./src/test/setup.ts"],
          // NumberFlow asks `esm-env` whether it's in a browser, and Vitest
          // answers no, so it renders server markup that crashes when a value
          // changes. Running these through Vite, with a browser's conditions,
          // gives the tests the same NumberFlow code as the app.
          server: {
            deps: { inline: ["@number-flow/react", "number-flow", "esm-env"] },
          },
        },
        resolve: { conditions: [...defaultClientConditions] },
      },
    ],
  },
});
