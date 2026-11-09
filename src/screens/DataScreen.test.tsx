import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
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
      "Left to lose (lb)",
      "Lost since start (lb)",
      "Loss per week (lb)",
      "Actions",
    ]);
    expect(bodyRows()[0][1]).toBe("198.4");
  });

  it("leaves out the weight to lose when no target is set", async () => {
    await storage.saveEntry({ date: "2026-11-01", weightKg: 90 });
    await renderData({ targetWeightKg: null });

    expect(
      screen.queryByRole("columnheader", { name: /Left to lose/ }),
    ).not.toBeInTheDocument();
  });

  describe("phone rows", () => {
    // jsdom doesn't apply the CSS, so both layouts are in the page here.
    // Playwright checks that each size shows only one.
    /** The button that opens each row, leaving out the Edit buttons inside. */
    function rowButtons() {
      const list = screen.getByRole("list", { name: /Daily figures/ });
      return within(list)
        .getAllByRole("listitem")
        .map((item) => within(item).getAllByRole("button")[0]);
    }

    it("show the date, weight and 7-day average, newest first", async () => {
      await storage.saveEntry({ date: "2026-11-01", weightKg: 90 });
      await storage.saveEntry({ date: "2026-11-03", weightKg: 89 });
      await renderData();

      expect(rowButtons().map((button) => button.textContent)).toEqual([
        "2026-11-03Weight 89.07-day average 89.50",
        "2026-11-02EstimatedWeight 89.57-day average 89.75",
        "2026-11-01Weight 90.07-day average 90.00",
      ]);
    });

    it("expand to show every figure, and collapse again", async () => {
      await storage.saveEntry({ date: "2026-11-01", weightKg: 90 });
      await storage.saveEntry({ date: "2026-11-03", weightKg: 89 });
      await renderData({ targetWeightKg: 80 });
      const user = userEvent.setup();
      const [newest] = rowButtons();
      expect(newest).toHaveAttribute("aria-expanded", "false");

      await user.click(newest);

      expect(newest).toHaveAttribute("aria-expanded", "true");
      const details = document.getElementById(
        newest.getAttribute("aria-controls")!,
      )!;
      expect(within(details).getAllByRole("term")).toHaveLength(10);
      expect(
        within(details).getByText("Left to lose (kg)").nextSibling,
      ).toHaveTextContent("9.0");

      await user.click(newest);

      expect(newest).toHaveAttribute("aria-expanded", "false");
      expect(details).not.toBeInTheDocument();
    });

    it("open independently of each other", async () => {
      await storage.saveEntry({ date: "2026-11-01", weightKg: 90 });
      await storage.saveEntry({ date: "2026-11-03", weightKg: 89 });
      await renderData();
      const user = userEvent.setup();
      const [newest, , oldest] = rowButtons();

      await user.click(newest);
      await user.click(oldest);

      expect(
        rowButtons().map((button) => button.getAttribute("aria-expanded")),
      ).toEqual(["true", "false", "true"]);
    });
  });

  it("shows dates in the date format setting", async () => {
    await storage.saveEntry({ date: "2026-11-01", weightKg: 90 });
    await renderData({ dateFormat: "DD/MM/YYYY" });

    expect(
      screen.getByRole("rowheader", { name: "01/11/2026" }),
    ).toBeInTheDocument();
  });

  describe("editing and deleting", () => {
    afterEach(() => {
      vi.restoreAllMocks();
    });

    /** Saves two days apart, so the day between them is estimated. */
    async function renderWithGap() {
      await storage.saveEntry({ date: "2026-11-01", weightKg: 90 });
      await storage.saveEntry({ date: "2026-11-03", weightKg: 89.04 });
      await renderData();
      return userEvent.setup();
    }

    function weightField() {
      return within(screen.getByRole("dialog")).getByLabelText("Weight (kg)");
    }

    it("offers Edit and Delete for saved entries only", async () => {
      await renderWithGap();

      const table = screen.getByRole("table");
      expect(
        within(table)
          .getAllByRole("button")
          .map((button) => button.textContent),
      ).toEqual([
        "Edit 2026-11-03",
        "Delete 2026-11-03",
        "Edit 2026-11-01",
        "Delete 2026-11-01",
      ]);
    });

    it("saves a new weight for the same date", async () => {
      const user = await renderWithGap();

      await user.click(screen.getByRole("button", { name: "Edit 2026-11-03" }));
      expect(
        screen.getByRole("dialog", { name: "Edit 2026-11-03" }),
      ).toBeVisible();
      expect(weightField()).toHaveValue("89.0");
      await user.clear(weightField());
      await user.type(weightField(), "88.5{Enter}");

      await waitFor(() => {
        expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
      });
      expect(await storage.getEntries()).toContainEqual({
        date: "2026-11-03",
        weightKg: 88.5,
      });
      expect(bodyRows()[0].slice(0, 2)).toEqual(["2026-11-03", "88.5"]);
    });

    it("keeps the full-precision weight when saved unchanged", async () => {
      const user = await renderWithGap();

      await user.click(screen.getByRole("button", { name: "Edit 2026-11-03" }));
      await user.click(screen.getByRole("button", { name: "Save" }));

      expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
      expect(await storage.getEntries()).toContainEqual({
        date: "2026-11-03",
        weightKg: 89.04,
      });
    });

    it("rejects a weight that isn't a number above 0", async () => {
      const user = await renderWithGap();

      await user.click(screen.getByRole("button", { name: "Edit 2026-11-03" }));
      await user.clear(weightField());
      await user.type(weightField(), "abc{Enter}");

      expect(weightField()).toHaveAttribute("aria-invalid", "true");
      expect(weightField()).toHaveAccessibleDescription(
        "Enter a number above 0, such as 203.8.",
      );
      expect(await storage.getEntries()).toContainEqual({
        date: "2026-11-03",
        weightKg: 89.04,
      });
    });

    it("closes without saving when cancelled", async () => {
      const user = await renderWithGap();

      await user.click(screen.getByRole("button", { name: "Edit 2026-11-03" }));
      await user.clear(weightField());
      await user.type(weightField(), "70");
      await user.click(screen.getByRole("button", { name: "Cancel" }));

      expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
      expect(await storage.getEntries()).toContainEqual({
        date: "2026-11-03",
        weightKg: 89.04,
      });
    });

    it("stays open with an alert if saving fails", async () => {
      const user = await renderWithGap();
      vi.spyOn(storage, "saveEntry").mockRejectedValue(new Error("full"));

      await user.click(screen.getByRole("button", { name: "Edit 2026-11-03" }));
      await user.clear(weightField());
      await user.type(weightField(), "88.5{Enter}");

      expect(await screen.findByRole("alert")).toHaveTextContent(
        "Couldn't save. Try again.",
      );
      expect(screen.getByRole("dialog")).toBeVisible();
    });

    it("can be opened from an expanded phone row", async () => {
      const user = await renderWithGap();
      const list = screen.getByRole("list", { name: /Daily figures/ });

      await user.click(within(list).getAllByRole("button")[0]);
      await user.click(
        within(list).getByRole("button", { name: "Edit 2026-11-03" }),
      );

      expect(
        screen.getByRole("dialog", { name: "Edit 2026-11-03" }),
      ).toBeVisible();
    });

    it("asks before deleting, and deletes once confirmed", async () => {
      const user = await renderWithGap();

      await user.click(
        screen.getByRole("button", { name: "Delete 2026-11-03" }),
      );
      const dialog = screen.getByRole("dialog", { name: "Delete 2026-11-03?" });
      expect(dialog).toHaveAccessibleDescription(
        "This deletes 89.0 kg for 2026-11-03. It can't be undone.",
      );
      await user.click(within(dialog).getByRole("button", { name: "Delete" }));

      await waitFor(() => {
        expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
      });
      expect(await storage.getEntries()).toEqual([
        { date: "2026-11-01", weightKg: 90 },
      ]);
      expect(bodyRows().map((cells) => cells[0])).toEqual(["2026-11-01"]);
    });

    it("keeps the entry when deleting is cancelled", async () => {
      const user = await renderWithGap();

      await user.click(
        screen.getByRole("button", { name: "Delete 2026-11-03" }),
      );
      await user.click(screen.getByRole("button", { name: "Cancel" }));

      expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
      expect(await storage.getEntries()).toHaveLength(2);
    });

    it("stays open with an alert if deleting fails", async () => {
      const user = await renderWithGap();
      vi.spyOn(storage, "deleteEntry").mockRejectedValue(new Error("locked"));

      await user.click(
        screen.getByRole("button", { name: "Delete 2026-11-03" }),
      );
      const dialog = screen.getByRole("dialog");
      await user.click(within(dialog).getByRole("button", { name: "Delete" }));

      expect(await screen.findByRole("alert")).toHaveTextContent(
        "Couldn't delete. Try again.",
      );
      expect(dialog).toBeVisible();
    });
  });
});
