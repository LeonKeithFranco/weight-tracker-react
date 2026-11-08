import { readFile } from "node:fs/promises";
import { expect, test } from "@playwright/test";

test("exports logged weights as a CSV file in kg", async ({ page }) => {
  await page.goto("/");
  await page.getByLabel("Date").fill("2026-01-05");
  await page.getByLabel("Weight (lb)").fill("203.8");
  await page.getByRole("button", { name: "Save" }).click();
  await expect(page.getByRole("status")).toContainText("Saved");

  await page.goto("/settings");
  // Starts waiting before the click, so a download that starts at once
  // isn't missed.
  const downloadPromise = page.waitForEvent("download");
  await page.getByRole("button", { name: "Export CSV" }).click();
  const download = await downloadPromise;

  expect(download.suggestedFilename()).toMatch(
    /^weight-tracker-\d{4}-\d{2}-\d{2}\.csv$/,
  );
  // Playwright saves the file to a temporary folder, and `path` waits until
  // it's finished.
  const csv = await readFile(await download.path(), "utf8");
  // The weight is converted to kg and kept at full precision.
  expect(csv).toBe(`date,weight_kg\n2026-01-05,${203.8 * 0.45359237}`);
  await expect(page.getByText("Exported 1 entry.")).toBeVisible();
});
