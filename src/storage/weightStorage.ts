import type { ParsedCsv } from "../lib/csvImport";
import type {
  CalendarDate,
  LogEntry,
  Settings,
  WeightEntry,
} from "../lib/types";

/**
 * The only way the app reads or writes saved data. Named `WeightStorage`
 * because the browser already has a global `Storage` type for `localStorage`.
 *
 * Every add, edit, delete and import also records a change in the activity log.
 * A failure to record it never fails the data change.
 */
export interface WeightStorage {
  /** Returns all entries, oldest first. */
  getEntries(): Promise<WeightEntry[]>;

  /** Adds an entry, or replaces the one already saved for that date. */
  saveEntry(entry: WeightEntry): Promise<void>;

  /** Deletes the entry for a date. Does nothing if that date has no entry. */
  deleteEntry(date: CalendarDate): Promise<void>;

  /**
   * Saves a file's valid entries in one step, overwriting any on the same
   * dates. Either all of them are saved or none are.
   */
  importEntries(parsed: ParsedCsv): Promise<void>;

  /** Returns the saved settings, or the defaults if none have been saved. */
  getSettings(): Promise<Settings>;

  saveSettings(settings: Settings): Promise<void>;

  /** Returns the activity log, newest first. */
  getLogEntries(): Promise<LogEntry[]>;

  /** Records an error in the activity log. Never rejects. */
  logError(message: string, details?: Record<string, unknown>): Promise<void>;
}
