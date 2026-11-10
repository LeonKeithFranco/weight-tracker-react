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

/**
 * The most records the activity log keeps. Older ones are deleted as new ones
 * arrive, so the log can't grow without limit.
 */
export const MAX_LOG_ENTRIES = 5000;

/** The settings used until the user saves their own. */
export const DEFAULT_SETTINGS: Settings = {
  displayUnit: "lb",
  targetWeightKg: null,
  dateFormat: DEFAULT_DATE_FORMAT,
};

/**
 * The rules for saved data, written once. It's given a backend rather than
 * creating one, so the app can pass Dexie and tests can pass the in-memory one.
 *
 * @remarks
 * Its public methods are documented on {@link WeightStorage}, and editors show
 * those comments here too.
 */
export class AppStorage implements WeightStorage {
  /** Where the data is read from and written to. */
  private readonly backend: StorageBackend;

  /**
   * Creates the storage rules on top of a backend.
   *
   * @param backend - Where the data lives: Dexie in the app, or the in-memory
   * backend in tests.
   */
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

  /**
   * Adds a record to the activity log, then trims the log to its limit.
   *
   * @remarks
   * Never rejects, because a log failure must not block a data change. A
   * failure is written to the browser's console instead.
   *
   * @param type - Whether the record is a change or an error.
   * @param message - What happened.
   * @param details - The facts behind the message.
   */
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
      await this.backend.trimLog(MAX_LOG_ENTRIES);
    } catch (error) {
      console.error("Couldn't write to the activity log", error);
    }
  }
}
