import { expect, test } from "@playwright/test";

test("changing the unit applies to logging and survives a reload", async ({
  page,
}) => {
  await page.goto("/settings");

  await page.getByLabel("Kilograms (kg)").check();
  await page
    .getByRole("navigation", { name: "Screens" })
    .getByRole("link", { name: "Home" })
    .click();

  await expect(page.getByLabel("Weight (kg)")).toBeVisible();

  await page.reload();

  await expect(page.getByLabel("Weight (kg)")).toBeVisible();
});
