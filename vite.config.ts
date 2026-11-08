import react from "@vitejs/plugin-react";
import { configDefaults, defineConfig } from "vitest/config";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  test: {
    // Playwright runs the `e2e` tests, so Vitest leaves them alone.
    exclude: [...configDefaults.exclude, "e2e/**"],
  },
});
