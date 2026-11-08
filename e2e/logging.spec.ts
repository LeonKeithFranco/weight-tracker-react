import { expect, test } from "@playwright/test";

test("logs a weight for today", async ({ page }) => {
  await page.goto("/");

  await page.getByLabel("Weight (lb)").fill("203.8");
  await page.getByRole("button", { name: "Save" }).click();

  await expect(page.getByRole("status")).toHaveText(
    /^Saved 203\.8 lb for \d{4}-\d{2}-\d{2}\.$/,
  );
  await expect(page.getByLabel("Weight (lb)")).toHaveValue("");
});
