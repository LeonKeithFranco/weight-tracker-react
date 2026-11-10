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
import type { PersistenceApi } from "../storage/persistence";
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

  /**
   * Renders `useData` inside a provider and waits until the data has loaded.
   *
   * @param persistenceApi - The stand-in for `navigator.storage`, or nothing
   * for a browser without it.
   * @returns The hook's result, whose `current` holds the latest value.
   */
  async function renderLoaded(persistenceApi?: PersistenceApi) {
    const { result } = renderHook(() => useData(), {
      wrapper: ({ children }) => (
        <DataProvider storage={storage} persistenceApi={persistenceApi}>
          {children}
        </DataProvider>
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

  describe("persistent storage", () => {
    /**
     * A stand-in for `navigator.storage`. It starts best-effort unless told
     * otherwise, and `persist()` answers with `grant` and remembers it.
     *
     * @param options - The answers to give: `persisted`, whether storage
     * starts persistent, and `grant`, whether `persist()` grants it.
     * @returns A fake whose methods are Vitest mocks.
     */
    function fakeBrowser({ persisted = false, grant = true } = {}) {
      let current = persisted;
      return {
        persisted: vi.fn(() => Promise.resolve(current)),
        persist: vi.fn(() => {
          current = current || grant;
          return Promise.resolve(current);
        }),
      };
    }

    it("is unsupported when the browser has no API", async () => {
      const result = await renderLoaded();

      expect(result.current.persistence).toBe("unsupported");
    });

    it("asks once at startup when entries are already saved", async () => {
      await storage.saveEntry({ date: "2026-01-01", weightKg: 90 });
      const browser = fakeBrowser();

      const result = await renderLoaded(browser);

      await waitFor(() =>
        expect(result.current.persistence).toBe("persistent"),
      );
      expect(browser.persist).toHaveBeenCalledOnce();
    });

    it("waits for the first save before asking, then asks only once", async () => {
      const browser = fakeBrowser({ grant: false });
      const result = await renderLoaded(browser);
      expect(result.current.persistence).toBe("best-effort");
      expect(browser.persist).not.toHaveBeenCalled();

      await act(() =>
        result.current.saveEntry({ date: "2026-01-01", weightKg: 90 }),
      );
      await waitFor(() => expect(browser.persist).toHaveBeenCalledOnce());
      await act(() =>
        result.current.saveEntry({ date: "2026-01-02", weightKg: 89 }),
      );

      // The browser refused, and a later save doesn't ask again.
      expect(browser.persist).toHaveBeenCalledOnce();
      expect(result.current.persistence).toBe("best-effort");
    });

    it("asks only once a visit, even if every entry is deleted and logged again", async () => {
      const browser = fakeBrowser({ grant: false });
      const result = await renderLoaded(browser);
      await act(() =>
        result.current.saveEntry({ date: "2026-01-01", weightKg: 90 }),
      );
      await waitFor(() => expect(browser.persist).toHaveBeenCalledOnce());

      await act(() => result.current.deleteEntry("2026-01-01"));
      await act(() =>
        result.current.saveEntry({ date: "2026-01-01", weightKg: 90 }),
      );

      expect(browser.persist).toHaveBeenCalledOnce();
    });

    it("asks after the first import too", async () => {
      const browser = fakeBrowser();
      const result = await renderLoaded(browser);

      await act(() =>
        result.current.importEntries({
          entries: [{ date: "2026-01-01", weightKg: 90 }],
          invalidRows: [],
        }),
      );

      await waitFor(() =>
        expect(result.current.persistence).toBe("persistent"),
      );
    });

    it("doesn't ask when storage is already persistent", async () => {
      await storage.saveEntry({ date: "2026-01-01", weightKg: 90 });
      const browser = fakeBrowser({ persisted: true });

      const result = await renderLoaded(browser);

      expect(result.current.persistence).toBe("persistent");
      expect(browser.persist).not.toHaveBeenCalled();
    });

    it("asks again on request, and resolves with the answer", async () => {
      const browser = fakeBrowser({ grant: false });
      const result = await renderLoaded(browser);

      let answer;
      await act(async () => {
        answer = await result.current.requestPersistence();
      });

      expect(answer).toBe("best-effort");
      expect(browser.persist).toHaveBeenCalledOnce();
    });

    it("logs a failed request and keeps working", async () => {
      const browser = fakeBrowser();
      browser.persist.mockRejectedValue(new Error("Not allowed"));
      const result = await renderLoaded(browser);

      await act(() => result.current.requestPersistence());

      expect(result.current.persistence).toBe("best-effort");
      const [record] = await storage.getLogEntries();
      expect(record).toMatchObject({
        type: "error",
        message: "Couldn't ask for persistent storage",
        details: { error: "Error: Not allowed" },
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
