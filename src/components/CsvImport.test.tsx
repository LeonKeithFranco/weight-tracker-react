import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { DataProvider } from "../data/DataProvider";
import { KG_PER_LB } from "../lib/units";
import { AppStorage } from "../storage/appStorage";
import { InMemoryBackend } from "../storage/inMemoryBackend";
import { CsvImport } from "./CsvImport";

/**
 * The preview region's name, which starts with "Preview of" and the file's
 * name. Matching it picks out the preview, because a named `section` is a
 * region too, so the Import section itself is one.
 */
const PREVIEW_NAME = /^Preview of/;

describe("CsvImport", () => {
  let storage: AppStorage;

  beforeEach(() => {
    storage = new AppStorage(new InMemoryBackend());
    vi.useFakeTimers({ toFake: ["Date"] });
    vi.setSystemTime(new Date(2026, 10, 8, 12));
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  async function renderImport() {
    const user = userEvent.setup();
    render(
      <DataProvider storage={storage}>
        <CsvImport />
      </DataProvider>,
    );
    await screen.findByRole("heading", { name: "Import" });
    return user;
  }

  /** Picks a file in the file input, the way choosing one in the picker does. */
  async function chooseFile(
    user: ReturnType<typeof userEvent.setup>,
    text: string,
    name = "weights.csv",
  ) {
    const file = new File([text], name, { type: "text/csv" });
    await user.upload(screen.getByLabelText("CSV file"), file);
  }

  function preview() {
    return screen.findByRole("region", { name: PREVIEW_NAME });
  }

  /** The number shown next to a count's label in the preview. */
  function count(region: HTMLElement, label: string) {
    return within(region).getByText(label).nextElementSibling;
  }

  it("previews a file without saving it, then imports it when confirmed", async () => {
    await storage.saveEntry({ date: "2026-11-01", weightKg: 88 });
    const user = await renderImport();

    await chooseFile(
      user,
      "date,weight_kg\n2026-11-01,87.5\n2026-11-02,87.25\n2026-11-03,abc",
    );

    const region = await preview();
    expect(region).toHaveAccessibleName("Preview of weights.csv");
    expect(count(region, "New entries")).toHaveTextContent("1");
    expect(count(region, "Overwrite existing")).toHaveTextContent("1");
    expect(count(region, "Invalid, skipped")).toHaveTextContent("1");
    // Nothing is written until the import is confirmed.
    expect(await storage.getEntries()).toEqual([
      { date: "2026-11-01", weightKg: 88 },
    ]);

    await user.click(screen.getByRole("button", { name: "Import" }));

    expect(await screen.findByRole("status")).toHaveTextContent(
      "Imported 2 entries.",
    );
    expect(
      screen.queryByRole("region", { name: PREVIEW_NAME }),
    ).not.toBeInTheDocument();
    expect(await storage.getEntries()).toEqual([
      { date: "2026-11-01", weightKg: 87.5 },
      { date: "2026-11-02", weightKg: 87.25 },
    ]);
  });

  it("reads a spreadsheet file in pounds", async () => {
    const user = await renderImport();

    await chooseFile(user, "Date,Weight (lbs)\n2026-11-01,203.8");
    await preview();
    await user.click(screen.getByRole("button", { name: "Import" }));

    await screen.findByText("Imported 1 entry.");
    expect(await storage.getEntries()).toEqual([
      { date: "2026-11-01", weightKg: 203.8 * KG_PER_LB },
    ]);
  });

  it("lists each invalid row with its problem", async () => {
    const user = await renderImport();

    await chooseFile(
      user,
      "date,weight_kg\n2026-13-01,87\n2099-01-01,87\n2026-11-01,0\n2026-11-02,87\n2026-11-02,88",
    );

    const table = within(await preview()).getByRole("table", {
      name: "Rows that will be skipped",
    });
    const rows = within(table)
      .getAllByRole("row")
      .slice(1)
      .map((row) =>
        within(row)
          .getAllByRole("cell")
          .map((cell) => cell.textContent),
      );
    expect(rows).toEqual([
      ["2", "2026-13-01", "87", "Not a valid date"],
      ["3", "2099-01-01", "87", "Date is in the future"],
      ["4", "2026-11-01", "0", "Not a number above 0"],
      ["6", "2026-11-02", "88", "Repeats an earlier date"],
    ]);
  });

  it("can't import a file with no valid rows", async () => {
    const user = await renderImport();

    await chooseFile(user, "date,weight_kg\n2026-11-01,abc");

    const region = await preview();
    expect(
      within(region).getByRole("button", { name: "Import" }),
    ).toBeDisabled();
    expect(region).toHaveTextContent("This file has no rows to import.");
  });

  it("saves nothing when cancelled", async () => {
    const user = await renderImport();

    await chooseFile(user, "date,weight_kg\n2026-11-01,87.5");
    await preview();
    await user.click(screen.getByRole("button", { name: "Cancel" }));

    expect(
      screen.queryByRole("region", { name: PREVIEW_NAME }),
    ).not.toBeInTheDocument();
    expect(await storage.getEntries()).toEqual([]);
  });

  it.each([
    [
      "has neither pair of columns",
      "day,kg\n2026-11-01,87",
      "This file needs either date and weight_kg columns, or Date and Weight (lbs) columns.",
    ],
    [
      "has an unclosed quote",
      'date,weight_kg\n"2026-11-01,87',
      "This file has a quote that's never closed, so it can't be read.",
    ],
  ])("rejects a file that %s", async (_, text, message) => {
    const user = await renderImport();

    await chooseFile(user, text, "bad.csv");

    expect(await screen.findByRole("alert")).toHaveTextContent(
      `bad.csv: ${message}`,
    );
    expect(
      screen.queryByRole("region", { name: PREVIEW_NAME }),
    ).not.toBeInTheDocument();
  });

  it("shows and records a failed import, and keeps the preview to try again", async () => {
    vi.spyOn(storage, "importEntries").mockRejectedValue(new Error("Full"));
    const logError = vi.spyOn(storage, "logError");
    const user = await renderImport();

    await chooseFile(user, "date,weight_kg\n2026-11-01,87.5");
    await preview();
    await user.click(screen.getByRole("button", { name: "Import" }));

    expect(await screen.findByRole("status")).toHaveTextContent(
      "Couldn't import the file. Nothing was changed. Try again.",
    );
    expect(screen.getByRole("button", { name: "Import" })).toBeEnabled();
    expect(logError).toHaveBeenCalledWith("Couldn't import the CSV", {
      error: expect.objectContaining({ message: "Full" }),
    });
  });

  it("previews the same file again after it's chosen a second time", async () => {
    const user = await renderImport();
    const text = "date,weight_kg\n2026-11-01,87.5";

    await chooseFile(user, text);
    await preview();
    await user.click(screen.getByRole("button", { name: "Cancel" }));
    await chooseFile(user, text);

    expect(await preview()).toBeInTheDocument();
  });
});
