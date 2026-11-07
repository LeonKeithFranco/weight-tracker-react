import type { ParsedCsv } from "../lib/csvImport";
import { DEFAULT_DATE_FORMAT } from "../lib/dates";
import { previewImport } from "../lib/importPreview";
import type {
  CalendarDate,
  LogEntry,
  Settings,
  WeightEntry,
} from "../lib/types";
import type { StorageBackend } from "./storageBackend";
import type { WeightStorage } from "./weightStorage";

export const DEFAULT_SETTINGS: Settings = {
  displayUnit: "lb",
  targetWeightKg: null,
  dateFormat: DEFAULT_DATE_FORMAT,
};

/**
 * The rules for saved data, written once. It's given a backend rather than
 * creating one, so the app can pass Dexie and tests can pass the in-memory one.
 */
export class AppStorage implements WeightStorage {
  private readonly backend: StorageBackend;

  constructor(backend: StorageBackend) {
    this.backend = backend;
  }

  getEntries(): Promise<WeightEntry[]> {
    return this.backend.getEntries();
  }

  async saveEntry(entry: WeightEntry): Promise<void> {
    const previous = await this.backend.getEntry(entry.date);
    await this.backend.putEntry(entry);

    if (previous) {
      await this.writeLog("change", `Edited the entry for ${entry.date}`, {
        date: entry.date,
        oldWeightKg: previous.weightKg,
        newWeightKg: entry.weightKg,
      });
    } else {
      await this.writeLog("change", `Added an entry for ${entry.date}`, {
        date: entry.date,
        weightKg: entry.weightKg,
      });
    }
  }

  async deleteEntry(date: CalendarDate): Promise<void> {
    const previous = await this.backend.getEntry(date);
    if (!previous) {
      return;
    }

    await this.backend.deleteEntry(date);
    await this.writeLog("change", `Deleted the entry for ${date}`, {
      date,
      weightKg: previous.weightKg,
    });
  }

  async importEntries(parsed: ParsedCsv): Promise<void> {
    const counts = previewImport(parsed, await this.backend.getEntries());

    await this.backend.putEntries(parsed.entries);
    await this.writeLog("change", "Imported a CSV file", counts);
  }

  async getSettings(): Promise<Settings> {
    const settings = await this.backend.getSettings();
    return settings ?? { ...DEFAULT_SETTINGS };
  }

  saveSettings(settings: Settings): Promise<void> {
    return this.backend.putSettings(settings);
  }

  getLogEntries(): Promise<LogEntry[]> {
    return this.backend.getLogEntries();
  }

  logError(message: string, details?: Record<string, unknown>): Promise<void> {
    return this.writeLog("error", message, details);
  }

  /** Never rejects, because a log failure must not block a data change. */
  private async writeLog(
    type: LogEntry["type"],
    message: string,
    details?: Record<string, unknown>,
  ): Promise<void> {
    try {
      await this.backend.addLogEntry({
        timestamp: new Date().toISOString(),
        type,
        message,
        details,
      });
    } catch (error) {
      console.error("Couldn't write to the activity log", error);
    }
  }
}
