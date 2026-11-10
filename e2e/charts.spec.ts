// The browser's types, for the code that runs in the page with `evaluate`.
/// <reference lib="dom" />
import { expect, test, type Page } from "@playwright/test";

/** Every chart card's name, in the order the screen shows them. */
const CHART_NAMES = [
  "Weight trends (lb)",
  "Progress (lb)",
  "Loss rate (lb per week)",
  "Weekly change (%)",
  "Projection (lb)",
];

/**
 * Imports one weight a day, ending on 2026-10-20, as a spreadsheet CSV built
 * in memory. Faster than logging each day on Home.
 *
 * @param page - The page showing the app.
 * @param days - How many days of weights to import.
 */
async function importDays(page: Page, days: number) {
  const end = Date.UTC(2026, 9, 20);
  const rows = Array.from({ length: days }, (_, index) => {
    const date = new Date(end - (days - 1 - index) * 86_400_000)
      .toISOString()
      .slice(0, 10);
    // A slow loss with a small zigzag, so every chart has something to draw.
    const pounds = 210 - index * 0.2 + (index % 2) * 0.6;
    return `${date},${pounds.toFixed(1)}`;
  });

  await page.goto("/settings");
  await page.getByLabel("CSV file").setInputFiles({
    name: "weights.csv",
    mimeType: "text/csv",
    buffer: Buffer.from(["Date,Weight (lbs)", ...rows].join("\n")),
  });
  await page.getByRole("button", { name: "Import" }).click();
  await expect(
    page.getByRole("region", { name: "Import" }).getByRole("status"),
  ).toHaveText(`Imported ${days} entries.`);
}

/**
 * Opens Charts through the navigation, so the page isn't reloaded, and waits
 * until it shows.
 *
 * @param page - The page showing the app.
 */
async function openCharts(page: Page) {
  await page
    .getByRole("navigation", { name: "Screens" })
    .getByRole("link", { name: "Charts" })
    .click();
  await expect(
    page.getByRole("heading", { level: 1, name: "Charts" }),
  ).toBeVisible();
}

/**
 * Counts the chart wipes running now, from the browser's own list of
 * animations.
 *
 * @param page - The page showing Charts.
 * @returns How many series are wiping in.
 */
function runningWipes(page: Page): Promise<number> {
  return page.evaluate(
    () =>
      document.getAnimations().filter(
        (animation) =>
          animation instanceof CSSAnimation &&
          // CSS modules add a hash, and a leading `_` in development.
          animation.animationName.includes("wipe-in"),
      ).length,
  );
}

/**
 * Chooses a range preset the way a user does, by its label, and waits until
 * it's checked.
 *
 * @remarks
 * The radio inside is visually hidden, so Playwright won't click it directly.
 * It would wait for the radio to become visible until the test timed out.
 *
 * @param page - The page showing Charts.
 * @param name - The preset's label, such as "1M".
 */
async function choosePreset(page: Page, name: string) {
  await page
    .getByRole("group", { name: "Chart range" })
    .getByText(name, { exact: true })
    .click();
  await expect(page.getByRole("radio", { name })).toBeChecked();
}

test.describe("The Charts screen", () => {
  test("shows every chart, with the projection once there are 14 days", async ({
    page,
  }) => {
    await importDays(page, 50);
    await openCharts(page);

    for (const name of [
      "Weight trends (lb)",
      "Progress (lb)",
      "Loss rate (lb per week)",
      "Weekly change (%)",
      "Projection (lb)",
    ]) {
      await expect(page.getByRole("region", { name })).toBeVisible();
    }
    await expect(
      page.getByRole("region", { name: "Projection (lb)" }),
    ).not.toContainText("Not enough data");
  });

  test("shows each card before the charts' code arrives, then fills it without moving", async ({
    page,
  }) => {
    await importDays(page, 50);
    // Holds back the plots' code, which only loads when Charts opens. In
    // development it's the `chartPlots.ts` module, and in a build its own
    // file.
    let release!: () => void;
    const held = new Promise<void>((resolve) => (release = resolve));
    await page.route(/chartPlots[.-]/, async (route) => {
      await held;
      await route.continue();
    });

    await openCharts(page);

    const plots = page.locator(".recharts-surface");
    const sizes = [];
    for (const name of CHART_NAMES) {
      const card = page.getByRole("region", { name });
      await expect(card).toBeVisible();
      sizes.push((await card.boundingBox())!.height);
    }
    const trends = page.getByRole("region", { name: "Weight trends (lb)" });
    await expect(
      trends.getByRole("button", { name: "Weight", exact: true }),
    ).toBeVisible();
    await expect(trends).toContainText(
      "Faded parts of the weight line are estimated days.",
    );
    await expect(
      page
        .getByRole("region", { name: "Weekly change (%)" })
        .getByRole("listitem"),
    ).toHaveText(["Loss", "Gain"]);
    await expect(plots).toHaveCount(0);

    release();

    await expect(plots).toHaveCount(CHART_NAMES.length);
    for (const [index, name] of CHART_NAMES.entries()) {
      const box = await page.getByRole("region", { name }).boundingBox();
      expect(box!.height).toBe(sizes[index]);
    }
  });

  test("wipes the charts in when they show, the range changes or a line comes back", async ({
    page,
  }) => {
    await importDays(page, 50);
    await openCharts(page);
    await expect.poll(() => runningWipes(page)).toBeGreaterThan(0);
    await expect.poll(() => runningWipes(page)).toBe(0);

    await choosePreset(page, "1M");
    await expect.poll(() => runningWipes(page)).toBeGreaterThan(0);
    await expect.poll(() => runningWipes(page)).toBe(0);

    const lowest = page
      .getByRole("region", { name: "Weight trends (lb)" })
      .getByRole("button", { name: "Lowest weight" });
    await lowest.click();
    await expect(lowest).toHaveAttribute("aria-pressed", "false");
    expect(await runningWipes(page)).toBe(0);
    await lowest.click();
    // Only the line that came back wipes in.
    await expect.poll(() => runningWipes(page)).toBe(1);
  });

  test("shows the charts at once when the device asks for reduced motion", async ({
    page,
  }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await importDays(page, 50);
    await openCharts(page);

    await expect(page.locator(".recharts-surface")).toHaveCount(
      CHART_NAMES.length,
    );
    expect(await runningWipes(page)).toBe(0);
    await choosePreset(page, "1M");
    expect(await runningWipes(page)).toBe(0);
  });

  test("explains that the projection needs 14 days", async ({ page }) => {
    await importDays(page, 5);
    await openCharts(page);

    await expect(
      page.getByRole("region", { name: "Projection (lb)" }),
    ).toContainText("Not enough data");
  });

  test("a range preset narrows the days the charts show", async ({ page }) => {
    await importDays(page, 50);
    await openCharts(page);
    // One bar per day, and nothing a user sees counts them, so this uses
    // Recharts' own class name.
    const bars = page
      .getByRole("region", { name: "Weekly change (%)" })
      .locator(".recharts-bar-rectangle");

    await choosePreset(page, "All");
    await expect(bars).not.toHaveCount(0);
    const allDays = await bars.count();

    // 1M counts back a month from the latest day, 2026-10-20.
    await choosePreset(page, "1M");
    await expect.poll(() => bars.count()).toBeLessThan(allDays);
    await expect.poll(() => bars.count()).toBeLessThanOrEqual(31);
  });

  test("the legend hides a line and shows it again", async ({ page }) => {
    await importDays(page, 50);
    await openCharts(page);
    const chart = page.getByRole("region", { name: "Weight trends (lb)" });
    const lines = chart.locator(".recharts-line-curve");
    const lowest = chart.getByRole("button", { name: "Lowest weight" });
    await expect(lines).not.toHaveCount(0);
    const allLines = await lines.count();

    await lowest.click();

    await expect(lowest).toHaveAttribute("aria-pressed", "false");
    await expect(lines).toHaveCount(allLines - 1);

    await lowest.click();

    await expect(lowest).toHaveAttribute("aria-pressed", "true");
    await expect(lines).toHaveCount(allLines);
  });

  test("hovering or tapping a chart shows the day's values", async ({
    page,
    isMobile,
  }) => {
    await importDays(page, 50);
    await openCharts(page);
    const chart = page.getByRole("region", { name: "Weight trends (lb)" });
    const plot = chart.locator(".recharts-surface");
    const box = await plot.boundingBox();
    const middle = { x: box!.width / 2, y: box!.height / 2 };

    // A phone has no hover, so it taps instead.
    if (isMobile) {
      await plot.tap({ position: middle });
    } else {
      await plot.hover({ position: middle });
    }

    // The tooltip lists its values as terms, which the legend's buttons
    // aren't.
    const weight = chart.getByRole("term").filter({ hasText: /^Weight$/ });
    await expect(weight).toBeVisible();
    // Dates use the default format, so the tooltip shows one from the data.
    await expect(chart.getByText(/^2026-(09|10)-\d{2}/)).toBeVisible();
  });
});
