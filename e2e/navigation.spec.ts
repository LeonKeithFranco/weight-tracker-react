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
