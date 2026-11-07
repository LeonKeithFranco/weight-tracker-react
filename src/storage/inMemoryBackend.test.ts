import { beforeEach, describe, expect, it } from "vitest";
import type { Settings } from "../lib/types";
import { InMemoryBackend } from "./inMemoryBackend";

const settings: Settings = {
  displayUnit: "lb",
  targetWeightKg: 80,
  dateFormat: "DD/MM/YYYY",
};

describe("InMemoryBackend", () => {
  let backend: InMemoryBackend;

  beforeEach(() => {
    backend = new InMemoryBackend();
  });

  describe("entries", () => {
    it("returns entries oldest first, whatever order they were saved in", async () => {
      await backend.putEntry({ date: "2026-01-03", weightKg: 88 });
      await backend.putEntry({ date: "2026-01-01", weightKg: 90 });
      await backend.putEntry({ date: "2026-01-02", weightKg: 89 });

      const entries = await backend.getEntries();

      expect(entries.map((entry) => entry.date)).toEqual([
        "2026-01-01",
        "2026-01-02",
        "2026-01-03",
      ]);
    });

    it("finds one entry by date", async () => {
      await backend.putEntry({ date: "2026-01-01", weightKg: 90 });

      expect(await backend.getEntry("2026-01-01")).toEqual({
        date: "2026-01-01",
        weightKg: 90,
      });
      expect(await backend.getEntry("2026-01-02")).toBeUndefined();
    });

    it("replaces an entry saved for the same date", async () => {
      await backend.putEntry({ date: "2026-01-01", weightKg: 90 });
      await backend.putEntry({ date: "2026-01-01", weightKg: 91 });

      expect(await backend.getEntries()).toEqual([
        { date: "2026-01-01", weightKg: 91 },
      ]);
    });

    it("saves many entries, overwriting the same dates", async () => {
      await backend.putEntry({ date: "2026-01-01", weightKg: 90 });

      await backend.putEntries([
        { date: "2026-01-01", weightKg: 95 },
        { date: "2026-01-02", weightKg: 94 },
      ]);

      expect(await backend.getEntries()).toEqual([
        { date: "2026-01-01", weightKg: 95 },
        { date: "2026-01-02", weightKg: 94 },
      ]);
    });

    it("deletes an entry, and ignores a date with no entry", async () => {
      await backend.putEntry({ date: "2026-01-01", weightKg: 90 });

      await backend.deleteEntry("2026-01-01");
      await backend.deleteEntry("2026-01-02");

      expect(await backend.getEntries()).toEqual([]);
    });

    it("isn't changed when a caller changes an object it holds", async () => {
      const saved = { date: "2026-01-01", weightKg: 90 };
      await backend.putEntry(saved);
      saved.weightKg = 1;

      const [read] = await backend.getEntries();
      read.weightKg = 2;

      expect(await backend.getEntry("2026-01-01")).toEqual({
        date: "2026-01-01",
        weightKg: 90,
      });
    });
  });

  describe("settings", () => {
    it("returns undefined until settings are saved", async () => {
      expect(await backend.getSettings()).toBeUndefined();

      await backend.putSettings(settings);

      expect(await backend.getSettings()).toEqual(settings);
    });
  });

  describe("activity log", () => {
    it("assigns rising ids and returns the newest record first", async () => {
      const timestamp = "2026-01-01T12:00:00.000Z";
      await backend.addLogEntry({ timestamp, type: "change", message: "One" });
      await backend.addLogEntry({ timestamp, type: "error", message: "Two" });

      expect(await backend.getLogEntries()).toEqual([
        { id: 2, timestamp, type: "error", message: "Two" },
        { id: 1, timestamp, type: "change", message: "One" },
      ]);
    });
  });
});
