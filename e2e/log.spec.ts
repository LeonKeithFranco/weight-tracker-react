import { expect, test, type Page } from "@playwright/test";

/** Opens the log through the app's own links, so the page isn't reloaded. */
async function openLog(page: Page) {
  await page
    .getByRole("navigation", { name: "Screens" })
    .getByRole("link", { name: "Settings" })
    .click();
  await page.getByRole("link", { name: "View the activity log" }).click();
}

function logItems(page: Page) {
  return page.getByRole("list", { name: "Log entries" }).getByRole("listitem");
}

test("an uncaught error in the browser shows up in the activity log", async ({
  page,
}) => {
  await page.goto("/");

  // An error thrown straight inside `evaluate` would be caught by Playwright
  // and fail the test. A timer throws it later, with nothing to catch it, the
  // way a bug in the app would.
  await page.evaluate(() => {
    setTimeout(() => {
      throw new Error("Test error from a timer");
    });
  });
  await openLog(page);

  const item = logItems(page).filter({ hasText: "Test error from a timer" });
  await expect(item).toContainText("Error");
  // The details hold the stack, which the unit tests can only fake.
  await item.getByText("Details").click();
  await expect(item.locator("pre")).toContainText('"stack":');
});

test("a promise rejected with no catch shows up in the activity log", async ({
  page,
}) => {
  await page.goto("/");

  await page.evaluate(() => {
    void Promise.reject(new Error("Test rejection"));
  });
  await openLog(page);

  const item = logItems(page).filter({
    hasText: "Unhandled promise rejection",
  });
  // Checked before the click, because a click waits far longer than `expect`
  // before it fails.
  await expect(item).toContainText("Error");
  await item.getByText("Details").click();
  await expect(item.locator("pre")).toContainText("Test rejection");
});

test("a logged weight shows in the activity log, reached from Settings", async ({
  page,
}) => {
  await page.goto("/");
  await page.getByLabel("Date").fill("2026-01-05");
  await page.getByLabel("Weight (lb)").fill("203.8");
  await page.getByRole("button", { name: "Save" }).click();
  await expect(
    page.getByRole("form", { name: "Log your weight" }).getByRole("status"),
  ).toContainText("Saved");

  await openLog(page);

  await expect(page).toHaveURL(/\/settings\/log$/);
  await expect(logItems(page)).toHaveText([/Added an entry for 2026-01-05/]);
  const nav = page.getByRole("navigation", { name: "Screens" });
  // The log is part of Settings, so its tab stays marked as the current one.
  await expect(nav.getByRole("link", { name: "Settings" })).toHaveAttribute(
    "aria-current",
    "page",
  );

  await page.getByRole("link", { name: "Back to Settings" }).click();
  await expect(
    page.getByRole("heading", { level: 1, name: "Settings" }),
  ).toBeVisible();
});
