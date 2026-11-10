import { expect, test, type Page } from "@playwright/test";

// These tests run against a production build, because the dev server has no
// service worker. See the `production` project in `playwright.config.ts`.
//
// The build is served from a subfolder, so URLs here are relative, such as
// `./charts`. A URL starting with `/` would skip the subfolder and go to the
// server's root.

/**
 * Checks whether the service worker controls the page.
 *
 * @remarks
 * Written as a string that runs in the browser, because this file is
 * type-checked as Node code, whose `navigator` has no `serviceWorker`.
 *
 * @param page - The page showing the app.
 * @returns Whether a service worker controls the page.
 */
function isControlled(page: Page) {
  return page.evaluate("navigator.serviceWorker?.controller != null");
}

test.describe("Offline use of the production build", () => {
  test("opens every screen and saves a weight with the network off", async ({
    page,
    context,
  }) => {
    await page.goto("./");
    await page.getByLabel("Weight (lb)").fill("203.8");
    await page.getByRole("button", { name: "Save" }).click();
    await expect(
      page.getByRole("form", { name: "Log your weight" }).getByRole("status"),
    ).toHaveText(/^Saved/);

    // The first visit loads from the network while the service worker
    // installs, so it only controls the page after a reload.
    await expect
      .poll(async () => {
        await page.reload();
        return isControlled(page);
      })
      .toBe(true);

    await context.setOffline(true);

    // A screen's own URL, which the service worker answers with the cached
    // `index.html` for the router to handle.
    await page.goto("./charts");
    // A chart's heading, not just the screen's, because the charts load from
    // a file of their own.
    await expect(
      page.getByRole("heading", { name: "Weight trends" }),
    ).toBeVisible();

    await page
      .getByRole("navigation", { name: "Screens" })
      .getByRole("link", { name: "Home" })
      .click();
    await page.getByLabel("Date").fill("2026-01-05");
    await page.getByLabel("Weight (lb)").fill("204.6");
    await page.getByRole("button", { name: "Save" }).click();
    await expect(
      page.getByRole("form", { name: "Log your weight" }).getByRole("status"),
    ).toHaveText(/^Saved 204\.6 lb/);
  });
});
