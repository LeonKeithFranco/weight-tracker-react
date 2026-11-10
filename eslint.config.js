import js from "@eslint/js";
import globals from "globals";
import reactHooks from "eslint-plugin-react-hooks";
import reactRefresh from "eslint-plugin-react-refresh";
import tsdoc from "eslint-plugin-tsdoc";
import prettier from "eslint-config-prettier/flat";
import tseslint from "typescript-eslint";
import { defineConfig, globalIgnores } from "eslint/config";

/**
 * The rules `npm run lint` checks, which CI runs on every pull request. Each
 * object applies to the files its `files` pattern matches. See
 * {@link https://eslint.org/docs/latest/use/configure/ | ESLint's guide}.
 */
export default defineConfig([
  // Folders the build and Playwright write, which hold no code to check.
  globalIgnores(["dist", "test-results", "playwright-report"]),
  {
    files: ["**/*.{ts,tsx}"],
    // Rule sets, applied in order, so a later one can turn off an earlier
    // one's rules.
    extends: [
      // JavaScript's and TypeScript's recommended rules.
      js.configs.recommended,
      tseslint.configs.recommended,
      // React's rules for hooks and components: hooks are called the same
      // way every render, effects list what they depend on, and components
      // stay pure, with no state set while rendering.
      reactHooks.configs.flat.recommended,
      // Keeps each component file to components, so Vite can update it in
      // place while the dev server runs.
      reactRefresh.configs.vite,
      // Last, to turn off every rule about layout, which Prettier decides.
      prettier,
    ],
    languageOptions: {
      // Most of the code runs in a browser, so globals such as `window` are
      // known.
      globals: globals.browser,
    },
    plugins: { tsdoc },
    rules: {
      // Checks doc comments are valid TSDoc, such as a hyphen after a
      // `@param` name. It doesn't check that anything has one.
      "tsdoc/syntax": "error",
    },
  },
]);
