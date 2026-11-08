import { expect, test } from "@playwright/test";

test("a logged weight shows in the activity log, reached from Settings", async ({
  page,
}) => {
  await page.goto("/");
  await page.getByLabel("Date").fill("2026-01-05");
  await page.getByLabel("Weight (lb)").fill("203.8");
  await page.getByRole("button", { name: "Save" }).click();
  await expect(page.getByRole("status")).toContainText("Saved");

  const nav = page.getByRole("navigation", { name: "Screens" });
  await nav.getByRole("link", { name: "Settings" }).click();
  await page.getByRole("link", { name: "View the activity log" }).click();

  await expect(page).toHaveURL(/\/settings\/log$/);
  await expect(
    page.getByRole("list", { name: "Log entries" }).getByRole("listitem"),
  ).toHaveText([/Added an entry for 2026-01-05/]);
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
