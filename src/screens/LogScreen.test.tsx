import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { DataProvider } from "../data/DataProvider";
import { downloadFile } from "../files/downloadFile";
import { AppStorage } from "../storage/appStorage";
import { InMemoryBackend } from "../storage/inMemoryBackend";
import { LogScreen } from "./LogScreen";

vi.mock("../files/downloadFile");

describe("LogScreen", () => {
  const originalTimeZone = process.env.TZ;
  let storage: AppStorage;

  beforeEach(() => {
    storage = new AppStorage(new InMemoryBackend());
    // UTC, so the times shown match the timestamps saved.
    process.env.TZ = "UTC";
    vi.useFakeTimers({ toFake: ["Date"] });
    vi.setSystemTime(new Date("2026-11-08T14:30:05Z"));
  });

  afterEach(() => {
    process.env.TZ = originalTimeZone;
    vi.useRealTimers();
    vi.mocked(downloadFile).mockReset();
    vi.restoreAllMocks();
  });

  async function renderLog() {
    const user = userEvent.setup();
    render(
      // `Link` needs a router above it.
      <MemoryRouter>
        <DataProvider storage={storage}>
          <LogScreen />
        </DataProvider>
      </MemoryRouter>,
    );
    await screen.findByRole("heading", { name: "Activity log" });
    return user;
  }

  /** Waits for the list, since the log loads after the page appears. */
  async function logItems() {
    const list = await screen.findByRole("list", { name: "Log entries" });
    return within(list).queryAllByRole("listitem");
  }

  it("lists entries newest first, with their time and type", async () => {
    await storage.saveEntry({ date: "2026-11-07", weightKg: 87.1 });
    await storage.saveEntry({ date: "2026-11-07", weightKg: 87.3 });
    await storage.logError("Something broke");
    await renderLog();

    const items = await logItems();

    expect(items.map((item) => item.textContent)).toEqual([
      expect.stringContaining("ErrorSomething broke"),
      expect.stringContaining("ChangeEdited the entry for 2026-11-07"),
      expect.stringContaining("ChangeAdded an entry for 2026-11-07"),
    ]);
    expect(within(items[0]).getByText("2026-11-08 14:30:05")).toHaveAttribute(
      "datetime",
      "2026-11-08T14:30:05.000Z",
    );
  });

  it("shows the date in the date format setting", async () => {
    await storage.saveSettings({
      ...(await storage.getSettings()),
      dateFormat: "DD/MM/YYYY",
    });
    await storage.saveEntry({ date: "2026-11-07", weightKg: 87.1 });
    await renderLog();

    const [item] = await logItems();

    expect(item).toHaveTextContent("08/11/2026 14:30:05");
  });

  it("shows an entry's details when they're opened", async () => {
    await storage.saveEntry({ date: "2026-11-07", weightKg: 87.1 });
    await storage.saveEntry({ date: "2026-11-07", weightKg: 87.3 });
    const user = await renderLog();

    const [edit] = await logItems();
    await user.click(within(edit).getByText("Details"));

    expect(within(edit).getByText(/"newWeightKg": 87.3/)).toBeVisible();
  });

  it("says when nothing has been recorded, and can't export", async () => {
    await renderLog();

    expect(await logItems()).toEqual([]);
    expect(screen.getByText("Nothing recorded yet.")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Export JSON" })).toBeDisabled();
  });

  it("exports the log as JSON", async () => {
    await storage.saveEntry({ date: "2026-11-07", weightKg: 87.1 });
    const user = await renderLog();
    await logItems();

    await user.click(screen.getByRole("button", { name: "Export JSON" }));

    const [json, fileName, type] = vi.mocked(downloadFile).mock.calls[0];
    expect(JSON.parse(json)).toEqual(await storage.getLogEntries());
    expect(fileName).toBe("weight-tracker-log-2026-11-08.json");
    expect(type).toBe("application/json");
    expect(screen.getByRole("status")).toHaveTextContent(
      "Exported the activity log.",
    );
  });

  it("explains and records a log that can't be loaded", async () => {
    vi.spyOn(storage, "getLogEntries").mockRejectedValue(new Error("Gone"));
    const logError = vi.spyOn(storage, "logError");
    await renderLog();

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Couldn't load the activity log. Try reloading the page.",
    );
    expect(logError).toHaveBeenCalledWith("Couldn't load the activity log", {
      error: expect.objectContaining({ message: "Gone" }),
    });
  });
});
