import { render, screen, within } from "@testing-library/react";
import { beforeEach, describe, expect, it } from "vitest";
import { DataProvider } from "../data/DataProvider";
import type { Settings } from "../lib/types";
import { AppStorage, DEFAULT_SETTINGS } from "../storage/appStorage";
import { InMemoryBackend } from "../storage/inMemoryBackend";
import { DataScreen } from "./DataScreen";

describe("DataScreen", () => {
  let storage: AppStorage;

  beforeEach(() => {
    storage = new AppStorage(new InMemoryBackend());
  });

  async function renderData(settings: Partial<Settings> = {}) {
    await storage.saveSettings({
      ...DEFAULT_SETTINGS,
      displayUnit: "kg",
      ...settings,
    });
    render(
      <DataProvider storage={storage}>
        <DataScreen />
      </DataProvider>,
    );
    await screen.findByRole("heading", { name: "Data" });
  }

  /** Every body row's cell text, top to bottom. */
  function bodyRows() {
    const table = screen.getByRole("table", { name: /Daily figures/ });
    // The first row holds the headings.
    const [, ...rows] = within(table).getAllByRole("row");
    // `cells` holds a row's `th` and `td` elements, in order.
    return rows.map((row) =>
      Array.from(
        (row as HTMLTableRowElement).cells,
        (cell) => cell.textContent,
      ),
    );
  }

  it("says there's nothing to show before anything is logged", async () => {
    await renderData();

    expect(screen.getByText(/No entries yet/)).toBeInTheDocument();
    expect(screen.queryByRole("table")).not.toBeInTheDocument();
  });

  it("lists every day newest first, marking estimated days", async () => {
    await storage.saveEntry({ date: "2026-11-01", weightKg: 90 });
    await storage.saveEntry({ date: "2026-11-03", weightKg: 89 });
    await renderData();

    expect(bodyRows().map((cells) => cells.slice(0, 2))).toEqual([
      ["2026-11-03", "89.0"],
      ["2026-11-02Estimated", "89.5"],
      ["2026-11-01", "90.0"],
    ]);
  });

  it("shows every figure, with the unit in the headings", async () => {
    await storage.saveEntry({ date: "2026-11-01", weightKg: 90 });
    await renderData({ displayUnit: "lb", targetWeightKg: 80 });

    const headings = screen
      .getAllByRole("columnheader")
      .map((heading) => heading.textContent);

    expect(headings).toEqual([
      "Date",
      "Weight (lb)",
      "Lowest weight (lb)",
      "7-day average (lb)",
      "Lowest 7-day average (lb)",
      "7-day change",
      "28-day average (lb)",
      "Lowest 28-day average (lb)",
      "To lose (lb)",
      "Lost since start (lb)",
      "Loss per week (lb)",
    ]);
    expect(bodyRows()[0][1]).toBe("198.4");
  });

  it("leaves out the weight to lose when no target is set", async () => {
    await storage.saveEntry({ date: "2026-11-01", weightKg: 90 });
    await renderData({ targetWeightKg: null });

    expect(
      screen.queryByRole("columnheader", { name: /To lose/ }),
    ).not.toBeInTheDocument();
  });

  it("shows dates in the date format setting", async () => {
    await storage.saveEntry({ date: "2026-11-01", weightKg: 90 });
    await renderData({ dateFormat: "DD/MM/YYYY" });

    expect(
      screen.getByRole("rowheader", { name: "01/11/2026" }),
    ).toBeInTheDocument();
  });
});
