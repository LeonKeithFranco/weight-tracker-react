import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";
import { configDefaults, defineConfig } from "vitest/config";

// https://vite.dev/config/
export default defineConfig({
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
    projects: [
      {
        extends: true,
        test: {
          name: "unit",
          include: ["src/**/*.test.ts"],
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
        },
      },
    ],
  },
});
