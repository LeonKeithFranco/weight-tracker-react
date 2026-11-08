import {
  act,
  render,
  renderHook,
  screen,
  waitFor,
} from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { AppStorage, DEFAULT_SETTINGS } from "../storage/appStorage";
import { InMemoryBackend } from "../storage/inMemoryBackend";
import { useData } from "./dataContext";
import { DataProvider } from "./DataProvider";

describe("DataProvider", () => {
  let storage: AppStorage;

  beforeEach(() => {
    storage = new AppStorage(new InMemoryBackend());
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  /** Renders `useData` inside a provider and waits until the data has loaded. */
  async function renderLoaded() {
    const { result } = renderHook(() => useData(), {
      wrapper: ({ children }) => (
        <DataProvider storage={storage}>{children}</DataProvider>
      ),
    });
    // The hook only runs once the provider has loaded and drawn its children.
    await waitFor(() => expect(result.current).not.toBeNull());
    return result;
  }

  it("provides the saved entries and settings", async () => {
    await storage.saveEntry({ date: "2026-01-02", weightKg: 89 });
    await storage.saveEntry({ date: "2026-01-01", weightKg: 90 });
    await storage.saveSettings({ ...DEFAULT_SETTINGS, displayUnit: "kg" });

    const result = await renderLoaded();

    expect(result.current.entries).toEqual([
      { date: "2026-01-01", weightKg: 90 },
      { date: "2026-01-02", weightKg: 89 },
    ]);
    expect(result.current.settings.displayUnit).toBe("kg");
  });

  it("shows a saved entry", async () => {
    const result = await renderLoaded();

    await act(() =>
      result.current.saveEntry({ date: "2026-01-01", weightKg: 90 }),
    );

    expect(result.current.entries).toEqual([
      { date: "2026-01-01", weightKg: 90 },
    ]);
  });

  it("removes a deleted entry", async () => {
    await storage.saveEntry({ date: "2026-01-01", weightKg: 90 });
    const result = await renderLoaded();

    await act(() => result.current.deleteEntry("2026-01-01"));

    expect(result.current.entries).toEqual([]);
  });

  it("shows imported entries", async () => {
    const result = await renderLoaded();

    await act(() =>
      result.current.importEntries({
        entries: [{ date: "2026-01-01", weightKg: 90 }],
        invalidRows: [],
      }),
    );

    expect(result.current.entries).toEqual([
      { date: "2026-01-01", weightKg: 90 },
    ]);
  });

  it("shows saved settings", async () => {
    const result = await renderLoaded();

    await act(() =>
      result.current.saveSettings({ ...DEFAULT_SETTINGS, targetWeightKg: 80 }),
    );

    expect(result.current.settings.targetWeightKg).toBe(80);
  });

  it("passes errors on to the activity log", async () => {
    const result = await renderLoaded();

    await act(() => result.current.logError("Something failed", { code: 7 }));

    const [record] = await storage.getLogEntries();
    expect(record).toMatchObject({
      type: "error",
      message: "Something failed",
      details: { code: 7 },
    });
  });

  it("shows an error instead of the app, and logs it, if loading fails", async () => {
    vi.spyOn(storage, "getEntries").mockRejectedValue(new Error("disk full"));

    render(
      <DataProvider storage={storage}>
        <p>The app</p>
      </DataProvider>,
    );

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Couldn't load your saved data",
    );
    expect(screen.queryByText("The app")).not.toBeInTheDocument();
    await waitFor(async () => {
      const [record] = await storage.getLogEntries();
      expect(record).toMatchObject({
        type: "error",
        message: "Couldn't load saved data",
        details: { error: "Error: disk full" },
      });
    });
  });

  it("makes useData fail outside a provider", () => {
    // React reports the error to the console as well, which isn't needed here.
    vi.spyOn(console, "error").mockImplementation(() => {});

    expect(() => renderHook(() => useData())).toThrow(
      "useData must be used inside a DataProvider",
    );
  });
});
