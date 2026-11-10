import { readFile } from "node:fs/promises";
import { expect, test } from "@playwright/test";

test.describe("CSV export and import in Settings", () => {
  test("exports logged weights as a CSV file in kg", async ({ page }) => {
    await page.goto("/");
    await page.getByLabel("Date").fill("2026-01-05");
    await page.getByLabel("Weight (lb)").fill("203.8");
    await page.getByRole("button", { name: "Save" }).click();
    await expect(
      page.getByRole("form", { name: "Log your weight" }).getByRole("status"),
    ).toContainText("Saved");

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

    // The exported file imports back in, with its date counted as an
    // overwrite.
    await page.getByLabel("CSV file").setInputFiles(await download.path());
    const preview = page.getByRole("region", { name: /^Preview of/ });
    // The text of each count's label and number join with no space between.
    await expect(preview).toContainText("Overwrite existing1");
  });

  test("imports a spreadsheet file after previewing it", async ({ page }) => {
    await page.goto("/settings");

    // Builds the file in memory, so no test file has to exist on disk.
    await page.getByLabel("CSV file").setInputFiles({
      name: "Weight Tracker.csv",
      mimeType: "text/csv",
      buffer: Buffer.from(
        "Date,Weight (lbs)\n2026-01-04,204.2\n2026-01-05,203.8\n2026-01-06,\n2026-01-07,abc\n",
      ),
    });

    const preview = page.getByRole("region", {
      name: "Preview of Weight Tracker.csv",
    });
    await expect(preview).toContainText("New entries2");
    await expect(
      preview.getByRole("table", { name: "Rows that will be skipped" }),
    ).toContainText("Not a number above 0");

    await preview.getByRole("button", { name: "Import" }).click();
    // Export has a status line too, so look inside the Import section.
    await expect(
      page.getByRole("region", { name: "Import" }).getByRole("status"),
    ).toHaveText("Imported 2 entries.");

    // The imported weights are saved, so they're on Home after a reload.
    await page.reload();
    await page
      .getByRole("navigation", { name: "Screens" })
      .getByRole("link", { name: "Home" })
      .click();
    await expect(
      page.getByRole("region", { name: "Latest figures" }),
    ).toContainText("203.8 lb");
  });
});
