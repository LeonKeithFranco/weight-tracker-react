import js from "@eslint/js";
import globals from "globals";
import reactHooks from "eslint-plugin-react-hooks";
import reactRefresh from "eslint-plugin-react-refresh";
import tsdoc from "eslint-plugin-tsdoc";
import jsdoc from "eslint-plugin-jsdoc";
import prettier from "eslint-config-prettier/flat";
import tseslint from "typescript-eslint";
import { defineConfig, globalIgnores } from "eslint/config";

/**
 * The rules `npm run lint` checks, which CI runs on every pull request. Each
 * object applies to the files its `files` pattern matches, and one without a
 * pattern, such as the ignores, applies to every file. See
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
      jsdoc.configs["flat/recommended-tsdoc-error"],
      // Last, to turn off every rule about layout, which Prettier decides.
      prettier,
    ],
    languageOptions: {
      // Most of the code runs in a browser, so globals such as `window` are
      // known.
      globals: globals.browser,
    },
    plugins: { tsdoc },
    settings: {
      // TSDoc names a type parameter's tag `@typeParam`, where JSDoc uses
      // `@template`.
      jsdoc: { tagNamePreference: { template: "typeParam" } },
    },
    rules: {
      // Checks doc comments are valid TSDoc, such as a hyphen after a
      // `@param` name.
      "tsdoc/syntax": "error",
      // Checks each module-level declaration, type and field has a doc
      // comment. Functions inside other functions and `describe` blocks don't
      // need one, and nor do class methods, which show their interface's.
      "jsdoc/require-jsdoc": [
        "error",
        {
          require: { FunctionDeclaration: false },
          contexts: [
            "Program > FunctionDeclaration",
            "Program > VariableDeclaration",
            "Program > TSTypeAliasDeclaration",
            "Program > TSInterfaceDeclaration",
            "Program > ClassDeclaration",
            // An exported item's comment sits on the `export`. Re-exports,
            // which have no declaration, keep their source's comment.
            "ExportNamedDeclaration[declaration]",
            "ExportDefaultDeclaration",
            "TSInterfaceBody > TSPropertySignature",
            "TSInterfaceBody > TSMethodSignature",
            "TSTypeAliasDeclaration > TSTypeLiteral > TSPropertySignature",
            "TSTypeAliasDeclaration > TSTypeLiteral > TSMethodSignature",
            "TSTypeAliasDeclaration > TSIntersectionType > TSTypeLiteral > TSPropertySignature",
            "ClassBody > PropertyDefinition",
          ],
        },
      ],
      // Components, named with a capital, document their props on the props
      // type, and callback props say in a sentence what they're called with,
      // so neither needs `@param` or `@returns`. Every other function and
      // interface method documents each parameter and its result, unless it
      // returns nothing.
      "jsdoc/require-param": [
        "error",
        {
          checkDestructuredRoots: false,
          contexts: [
            "FunctionDeclaration:not([id.name=/^[A-Z]/])",
            "TSInterfaceBody > TSMethodSignature",
            "TSTypeAliasDeclaration:not([id.name=/Props$/]) > TSTypeLiteral > TSMethodSignature",
          ],
        },
      ],
      "jsdoc/require-returns": [
        "error",
        {
          contexts: [
            "FunctionDeclaration:not([id.name=/^[A-Z]/])",
            "TSMethodSignature:not(:has(TSVoidKeyword))",
          ],
        },
      ],
      // Each type parameter, as `@typeParam`, and each `throw`, as `@throws`.
      // A promise's rejections can't be found from the code, so they're
      // documented by hand.
      "jsdoc/require-template": "error",
      "jsdoc/require-throws": "error",
      // A destructured parameter is named in prose, such as `parsed`.
      "jsdoc/check-param-names": ["error", { checkDestructured: false }],
      // A blank line between the summary and the tags, as TSDoc's examples
      // have, and none needed between tags.
      "jsdoc/tag-lines": ["error", "any", { startLines: 1 }],
    },
  },
]);
