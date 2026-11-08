import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { DataProvider } from "../data/DataProvider";
import { downloadFile } from "../files/downloadFile";
import { AppStorage } from "../storage/appStorage";
import { InMemoryBackend } from "../storage/inMemoryBackend";
import { CsvExport } from "./CsvExport";

// Replaces the real module everywhere for this file, including inside
// `CsvExport`, because jsdom can't download files. Playwright tests the real
// download.
vi.mock("../files/downloadFile");

describe("CsvExport", () => {
  let storage: AppStorage;

  beforeEach(() => {
    storage = new AppStorage(new InMemoryBackend());
    vi.useFakeTimers({ toFake: ["Date"] });
    // Local time, so the date is the same in every time zone.
    vi.setSystemTime(new Date(2026, 10, 8, 12));
  });

  afterEach(() => {
    vi.useRealTimers();
    // Clears the calls the fake recorded and anything a test made it do.
    vi.mocked(downloadFile).mockReset();
    vi.restoreAllMocks();
  });

  async function renderExport() {
    const user = userEvent.setup();
    render(
      <DataProvider storage={storage}>
        <CsvExport />
      </DataProvider>,
    );
    await screen.findByRole("heading", { name: "Export" });
    return user;
  }

  function exportButton() {
    return screen.getByRole("button", { name: "Export CSV" });
  }

  it("downloads the entries as CSV, named after today", async () => {
    await storage.saveEntry({ date: "2026-11-07", weightKg: 87.1 });
    await storage.saveEntry({ date: "2026-11-06", weightKg: 87.25 });
    const user = await renderExport();

    await user.click(exportButton());

    expect(downloadFile).toHaveBeenCalledWith(
      "date,weight_kg\n2026-11-06,87.25\n2026-11-07,87.1",
      "weight-tracker-2026-11-08.csv",
      "text/csv",
    );
    expect(screen.getByRole("status")).toHaveTextContent("Exported 2 entries.");
  });

  it("says entry, not entries, for one entry", async () => {
    await storage.saveEntry({ date: "2026-11-07", weightKg: 87.1 });
    const user = await renderExport();

    await user.click(exportButton());

    expect(screen.getByRole("status")).toHaveTextContent("Exported 1 entry.");
  });

  it("can't export when there are no entries", async () => {
    await renderExport();

    expect(exportButton()).toBeDisabled();
    expect(exportButton()).toHaveAccessibleDescription(
      "Nothing to export yet.",
    );
  });

  it("shows and records a failed export", async () => {
    await storage.saveEntry({ date: "2026-11-07", weightKg: 87.1 });
    vi.mocked(downloadFile).mockImplementation(() => {
      throw new Error("Blocked");
    });
    const logError = vi.spyOn(storage, "logError");
    const user = await renderExport();

    await user.click(exportButton());

    expect(screen.getByRole("status")).toHaveTextContent(
      "Couldn't export your data. Try again.",
    );
    expect(logError).toHaveBeenCalledWith("Couldn't export the CSV", {
      error: expect.objectContaining({ message: "Blocked" }),
    });
  });
});
