import { expect, test, type Page } from "@playwright/test";

/** Logs each weight on Home, then opens the Data screen. */
async function logAndOpenData(page: Page, entries: [string, string][]) {
  await page.goto("/");
  for (const [date, weight] of entries) {
    await page.getByLabel("Date").fill(date);
    await page.getByLabel("Weight (lb)").fill(weight);
    await page.getByRole("button", { name: "Save" }).click();
    await expect(page.getByRole("status")).toHaveText(/^Saved/);
  }
  await page
    .getByRole("navigation", { name: "Screens" })
    .getByRole("link", { name: "Data" })
    .click();
  await expect(
    page.getByRole("heading", { level: 1, name: "Data" }),
  ).toBeVisible();
}

/** Two days apart, so 2026-11-02 is estimated. */
const WITH_GAP: [string, string][] = [
  ["2026-11-01", "201.4"],
  ["2026-11-03", "200.2"],
];

/**
 * The part of the page holding one day's figures and buttons: its table row on
 * desktop, or its list item on a phone, opened first.
 */
async function dayOnScreen(page: Page, isMobile: boolean, date: string) {
  if (!isMobile) {
    return page
      .getByRole("row")
      .filter({ has: page.getByRole("rowheader", { name: date }) });
  }

  const item = page.getByRole("listitem").filter({ hasText: date });
  const toggle = item.getByRole("button").first();
  if ((await toggle.getAttribute("aria-expanded")) === "false") {
    await toggle.click();
  }
  return item;
}

test("shows the table on desktop and compact rows on a phone", async ({
  page,
  isMobile,
}) => {
  await logAndOpenData(page, WITH_GAP);

  const table = page.getByRole("table", { name: /Daily figures/ });
  const list = page.getByRole("list", { name: /Daily figures/ });
  // Hidden with `display: none`, which jsdom can't check.
  await expect(isMobile ? list : table).toBeVisible();
  await expect(isMobile ? table : list).toBeHidden();
});

test("marks estimated days and offers no buttons for them", async ({
  page,
  isMobile,
}) => {
  await logAndOpenData(page, WITH_GAP);

  const estimated = await dayOnScreen(page, isMobile, "2026-11-02");

  await expect(estimated).toContainText("Estimated");
  await expect(estimated).toContainText("200.8");
  await expect(
    estimated.getByRole("button", { name: /^(Edit|Delete)/ }),
  ).toHaveCount(0);
});

test("a phone row opens to show every figure", async ({ page, isMobile }) => {
  test.skip(!isMobile, "Desktop shows every figure in the table");
  await logAndOpenData(page, WITH_GAP);

  const day = await dayOnScreen(page, isMobile, "2026-11-03");

  await expect(day.getByRole("button").first()).toHaveAttribute(
    "aria-expanded",
    "true",
  );
  await expect(day.getByRole("term")).toHaveCount(9);
  await expect(day).toContainText("Lowest 28-day average (lb)");
});

test("edits a weight, and the change survives a reload", async ({
  page,
  isMobile,
}) => {
  await logAndOpenData(page, WITH_GAP);

  const day = await dayOnScreen(page, isMobile, "2026-11-03");
  await day.getByRole("button", { name: "Edit 2026-11-03" }).click();
  const dialog = page.getByRole("dialog", { name: "Edit 2026-11-03" });
  await expect(dialog.getByLabel("Weight (lb)")).toHaveValue("200.2");
  await dialog.getByLabel("Weight (lb)").fill("199.6");
  await dialog.getByRole("button", { name: "Save" }).click();

  await expect(dialog).toBeHidden();
  await expect(await dayOnScreen(page, isMobile, "2026-11-03")).toContainText(
    "199.6",
  );

  await page.reload();

  await expect(await dayOnScreen(page, isMobile, "2026-11-03")).toContainText(
    "199.6",
  );
});

test("Escape and Cancel close a dialog and return focus to its button", async ({
  page,
  isMobile,
}) => {
  await logAndOpenData(page, WITH_GAP);
  const day = await dayOnScreen(page, isMobile, "2026-11-03");
  const edit = day.getByRole("button", { name: "Edit 2026-11-03" });
  const dialog = page.getByRole("dialog");

  await edit.click();
  // `showModal()` moves focus into the dialog, to its first field.
  await expect(dialog.getByLabel("Weight (lb)")).toBeFocused();
  // The browser closes the dialog itself on Escape.
  await page.keyboard.press("Escape");

  await expect(dialog).toBeHidden();
  await expect(edit).toBeFocused();

  await edit.click();
  // The app's own code closes it here, through `close()`.
  await dialog.getByRole("button", { name: "Cancel" }).click();

  await expect(dialog).toBeHidden();
  await expect(edit).toBeFocused();
});

test("deletes an entry once confirmed, leaving the day estimated", async ({
  page,
  isMobile,
}) => {
  await logAndOpenData(page, [...WITH_GAP, ["2026-11-04", "199.8"]]);

  const day = await dayOnScreen(page, isMobile, "2026-11-03");
  await day.getByRole("button", { name: "Delete 2026-11-03" }).click();
  const dialog = page.getByRole("dialog", { name: "Delete 2026-11-03?" });
  // Cancel has focus, so pressing Enter straight away deletes nothing.
  await expect(dialog.getByRole("button", { name: "Cancel" })).toBeFocused();
  await dialog.getByRole("button", { name: "Delete" }).click();

  await expect(dialog).toBeHidden();
  // Now between two saved days, so it's estimated from them.
  await expect(await dayOnScreen(page, isMobile, "2026-11-03")).toContainText(
    "Estimated",
  );
});
