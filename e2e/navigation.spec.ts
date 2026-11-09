import { expect, test, type Page } from "@playwright/test";

const screens = [
  { name: "Charts", path: "/charts" },
  { name: "Data", path: "/data" },
  { name: "Settings", path: "/settings" },
  { name: "Home", path: "/" },
];

function screenNav(page: Page) {
  return page.getByRole("navigation", { name: "Screens" });
}

test("each tab opens its screen and is marked as current", async ({ page }) => {
  await page.goto("/");

  for (const screen of screens) {
    const tab = screenNav(page).getByRole("link", { name: screen.name });
    await tab.click();

    await expect(page).toHaveURL(screen.path);
    await expect(
      page.getByRole("heading", { level: 1, name: screen.name }),
    ).toBeVisible();
    await expect(tab).toHaveAttribute("aria-current", "page");
  }
});

test("opens a screen directly from its URL", async ({ page }) => {
  await page.goto("/data");

  await expect(
    page.getByRole("heading", { level: 1, name: "Data" }),
  ).toBeVisible();
});

test("sends an unknown URL to Home", async ({ page }) => {
  await page.goto("/no-such-screen");

  await expect(page).toHaveURL("/");
  await expect(
    page.getByRole("heading", { level: 1, name: "Home" }),
  ).toBeVisible();
});

test("puts the tabs at the bottom of the screen on phones", async ({
  page,
  isMobile,
}) => {
  test.skip(!isMobile, "Only phones have a bottom tab bar");
  await page.goto("/");

  const nav = (await screenNav(page).boundingBox())!;
  const viewport = page.viewportSize()!;

  expect(nav.y + nav.height).toBeCloseTo(viewport.height, 0);
});

test("puts the tabs in the header on desktop", async ({ page, isMobile }) => {
  test.skip(isMobile, "Phones have a bottom tab bar instead");
  await page.goto("/");

  const nav = (await screenNav(page).boundingBox())!;
  const header = (await page.getByRole("banner").boundingBox())!;

  expect(nav.y + nav.height).toBeLessThanOrEqual(header.y + header.height);
});

test("centres the content on a wide screen, lined up with the header", async ({
  page,
  isMobile,
}) => {
  test.skip(isMobile, "A phone is narrower than the content's maximum width");
  await page.setViewportSize({ width: 1600, height: 900 });
  await page.goto("/");

  const main = (await page.getByRole("main").boundingBox())!;
  const leftGap = main.x;
  const rightGap = 1600 - (main.x + main.width);
  expect(leftGap).toBeGreaterThan(0);
  expect(leftGap).toBeCloseTo(rightGap, 0);

  // The app name starts where the screen's heading does.
  const appName = (await page.getByText("Weight Tracker").boundingBox())!;
  const heading = (await page
    .getByRole("heading", { level: 1, name: "Home" })
    .boundingBox())!;
  expect(appName.x).toBeCloseTo(heading.x, 0);
});
