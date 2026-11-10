import { expect, test } from "@playwright/test";

test.describe("Loading saved data", () => {
  test("explains when saved data can't be loaded", async ({ page }) => {
    // Runs in the browser before the app's own code, and removes IndexedDB the
    // way some browsers' private modes or strict privacy settings do. In a
    // browser, `globalThis` is `window`. This file is type-checked as Node
    // code, which has no `window`.
    await page.addInitScript(() => {
      Object.defineProperty(globalThis, "indexedDB", { value: undefined });
    });

    await page.goto("/");

    await expect(page.getByRole("alert")).toHaveText(
      "Couldn't load your saved data. Try reloading the page.",
    );
  });
});
