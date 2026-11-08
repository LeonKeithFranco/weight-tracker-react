import { expect, test, type Page } from "@playwright/test";

async function openHome(page: Page) {
  await page
    .getByRole("navigation", { name: "Screens" })
    .getByRole("link", { name: "Home" })
    .click();
  // Settings has fields with similar labels, so wait until Home has replaced it.
  await expect(
    page.getByRole("heading", { level: 1, name: "Home" }),
  ).toBeVisible();
}

/**
 * The log form's weight field. `exact` matters, because by default Playwright
 * also matches labels that only contain the text, such as "Target weight (lb)".
 */
function weightField(page: Page, unit: "kg" | "lb") {
  return page.getByLabel(`Weight (${unit})`, { exact: true });
}

test("changing the unit applies to logging and survives a reload", async ({
  page,
}) => {
  await page.goto("/settings");

  await page.getByLabel("Kilograms (kg)").check();
  await openHome(page);

  await expect(weightField(page, "kg")).toBeVisible();

  await page.reload();

  await expect(weightField(page, "kg")).toBeVisible();
});

test("the date format applies to logging and survives a reload", async ({
  page,
}) => {
  await page.goto("/settings");

  await page.getByLabel("Date format").fill("D MMM YYYY");
  await page
    .getByRole("form", { name: "Dates" })
    .getByRole("button", { name: "Save" })
    .click();
  await expect(page.getByText("Date format saved.")).toBeVisible();

  await page.reload();
  await expect(page.getByLabel("Date format")).toHaveValue("D MMM YYYY");

  await openHome(page);
  await weightField(page, "lb").fill("203.8");
  await page.getByRole("button", { name: "Save" }).click();

  await expect(page.getByRole("status")).toHaveText(
    /^Saved 203\.8 lb for \d{1,2} [A-Z][a-z]{2} \d{4}\.$/,
  );
});
