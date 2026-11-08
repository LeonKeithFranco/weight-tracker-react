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

test("shows the form's own messages for invalid input, and saves nothing", async ({
  page,
}) => {
  await page.goto("/");

  await page.getByLabel("Date").fill("2099-01-01");
  await page.getByRole("button", { name: "Save" }).click();

  // Without `noValidate`, Chromium would block the submit with its own pop-up
  // for the future date, and these messages wouldn't appear.
  await expect(
    page.getByText("The date can't be in the future."),
  ).toBeVisible();
  await expect(page.getByText("Enter your weight.")).toBeVisible();
  await expect(page.getByRole("status")).toBeEmpty();
});
