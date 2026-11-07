import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { InvalidRow } from "../lib/csvImport";
import type { Settings } from "../lib/types";
import { AppStorage, DEFAULT_SETTINGS, MAX_LOG_ENTRIES } from "./appStorage";
import { InMemoryBackend } from "./inMemoryBackend";

const invalidRow: InvalidRow = {
  line: 4,
  date: "not-a-date",
  weight: "90",
  reason: "invalid-date",
};

describe("AppStorage", () => {
  let backend: InMemoryBackend;
  let storage: AppStorage;

  beforeEach(() => {
    backend = new InMemoryBackend();
    storage = new AppStorage(backend);
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  describe("recording changes", () => {
    it("records an add", async () => {
      await storage.saveEntry({ date: "2026-01-01", weightKg: 90 });

      const [record] = await storage.getLogEntries();

      expect(record).toMatchObject({
        type: "change",
        message: "Added an entry for 2026-01-01",
        details: { date: "2026-01-01", weightKg: 90 },
      });
    });

    it("records an edit with the old and new values", async () => {
      await storage.saveEntry({ date: "2026-01-01", weightKg: 90 });
      await storage.saveEntry({ date: "2026-01-01", weightKg: 91 });

      const [record] = await storage.getLogEntries();

      expect(await storage.getEntries()).toEqual([
        { date: "2026-01-01", weightKg: 91 },
      ]);
      expect(record).toMatchObject({
        type: "change",
        message: "Edited the entry for 2026-01-01",
        details: { date: "2026-01-01", oldWeightKg: 90, newWeightKg: 91 },
      });
    });

    it("records a delete with the deleted weight", async () => {
      await storage.saveEntry({ date: "2026-01-01", weightKg: 90 });
      await storage.deleteEntry("2026-01-01");

      const [record] = await storage.getLogEntries();

      expect(await storage.getEntries()).toEqual([]);
      expect(record).toMatchObject({
        type: "change",
        message: "Deleted the entry for 2026-01-01",
        details: { date: "2026-01-01", weightKg: 90 },
      });
    });

    it("records nothing when deleting a date with no entry", async () => {
      await storage.deleteEntry("2026-01-01");

      expect(await storage.getLogEntries()).toEqual([]);
    });

    it("records an import as one record with its counts", async () => {
      await storage.saveEntry({ date: "2026-01-01", weightKg: 90 });

      await storage.importEntries({
        entries: [
          { date: "2026-01-01", weightKg: 95 },
          { date: "2026-01-02", weightKg: 94 },
          { date: "2026-01-03", weightKg: 93 },
        ],
        invalidRows: [invalidRow],
      });

      const log = await storage.getLogEntries();

      expect(await storage.getEntries()).toHaveLength(3);
      expect(log).toHaveLength(2);
      expect(log[0]).toMatchObject({
        type: "change",
        message: "Imported a CSV file",
        details: { newCount: 2, overwriteCount: 1, invalidCount: 1 },
      });
    });

    it("stamps records with the current UTC time", async () => {
      vi.useFakeTimers({ toFake: ["Date"] });
      vi.setSystemTime(new Date("2026-03-01T09:30:00.000Z"));

      await storage.saveEntry({ date: "2026-01-01", weightKg: 90 });

      const [record] = await storage.getLogEntries();

      expect(record.timestamp).toBe("2026-03-01T09:30:00.000Z");
    });
  });

  describe("when the log can't be written", () => {
    beforeEach(() => {
      vi.spyOn(backend, "addLogEntry").mockRejectedValue(new Error("Log full"));
      vi.spyOn(console, "error").mockImplementation(() => {});
    });

    it("still saves the entry", async () => {
      await storage.saveEntry({ date: "2026-01-01", weightKg: 90 });

      expect(await storage.getEntries()).toEqual([
        { date: "2026-01-01", weightKg: 90 },
      ]);
    });

    it("still deletes the entry", async () => {
      await backend.putEntry({ date: "2026-01-01", weightKg: 90 });

      await storage.deleteEntry("2026-01-01");

      expect(await storage.getEntries()).toEqual([]);
    });

    it("still imports the entries", async () => {
      await storage.importEntries({
        entries: [{ date: "2026-01-01", weightKg: 90 }],
        invalidRows: [],
      });

      expect(await storage.getEntries()).toHaveLength(1);
    });

    it("doesn't reject when logging an error", async () => {
      await expect(
        storage.logError("Something broke"),
      ).resolves.toBeUndefined();
    });
  });

  it("still saves the entry when the log can't be trimmed", async () => {
    vi.spyOn(backend, "trimLog").mockRejectedValue(new Error("Trim failed"));
    vi.spyOn(console, "error").mockImplementation(() => {});

    await storage.saveEntry({ date: "2026-01-01", weightKg: 90 });

    expect(await storage.getEntries()).toHaveLength(1);
  });

  it("keeps only the newest records once the log is full", async () => {
    for (let i = 1; i <= MAX_LOG_ENTRIES; i += 1) {
      await backend.addLogEntry({
        timestamp: "2026-01-01T12:00:00.000Z",
        type: "change",
        message: `Record ${i}`,
      });
    }

    await storage.saveEntry({ date: "2026-01-01", weightKg: 90 });

    const log = await storage.getLogEntries();

    expect(log).toHaveLength(MAX_LOG_ENTRIES);
    expect(log[0].message).toBe("Added an entry for 2026-01-01");
    expect(log.at(-1)?.message).toBe("Record 2");
  });

  it("records errors with their details", async () => {
    await storage.logError("Something broke", { screen: "Charts" });

    const [record] = await storage.getLogEntries();

    expect(record).toMatchObject({
      type: "error",
      message: "Something broke",
      details: { screen: "Charts" },
    });
  });

  describe("settings", () => {
    it("returns the defaults until settings are saved", async () => {
      expect(await storage.getSettings()).toEqual(DEFAULT_SETTINGS);
    });

    it("returns saved settings without recording a change", async () => {
      const settings: Settings = {
        displayUnit: "lb",
        targetWeightKg: 80,
        dateFormat: "DD/MM/YYYY",
      };

      await storage.saveSettings(settings);

      expect(await storage.getSettings()).toEqual(settings);
      expect(await storage.getLogEntries()).toEqual([]);
    });
  });
});
