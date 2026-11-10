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
 *
 * @remarks
 * Every method returns a promise, which rejects with the storage backend's
 * error when the data can't be read or written, except
 * {@link WeightStorage.logError}, which never rejects.
 */
export interface WeightStorage {
  /**
   * Reads every entry.
   *
   * @returns All entries, oldest first.
   * @throws The backend's error, when the entries can't be read.
   */
  getEntries(): Promise<WeightEntry[]>;

  /**
   * Adds an entry, or replaces the one already saved for that date, and
   * records it in the activity log as an add or an edit.
   *
   * @param entry - The entry to save, with its weight in kg.
   * @throws The backend's error, when the entry can't be saved.
   */
  saveEntry(entry: WeightEntry): Promise<void>;

  /**
   * Deletes the entry for a date, and records it in the activity log. Does
   * nothing if that date has no entry.
   *
   * @param date - The date whose entry to delete.
   * @throws The backend's error, when the entry can't be deleted.
   */
  deleteEntry(date: CalendarDate): Promise<void>;

  /**
   * Saves a file's valid entries in one step, overwriting any on the same
   * dates. Either all of them are saved or none are. The activity log records
   * how many were new, overwrote an entry or were invalid.
   *
   * @param parsed - The file's rows, from `parseCsv`.
   * @throws The backend's error, when the entries can't be saved. Nothing is
   * saved.
   */
  importEntries(parsed: ParsedCsv): Promise<void>;

  /**
   * Reads the saved settings.
   *
   * @returns The settings, or the defaults if none have been saved.
   * @throws The backend's error, when the settings can't be read.
   */
  getSettings(): Promise<Settings>;

  /**
   * Saves the settings, replacing any saved before. Settings changes aren't
   * recorded in the activity log.
   *
   * @param settings - The settings to save.
   * @throws The backend's error, when the settings can't be saved.
   */
  saveSettings(settings: Settings): Promise<void>;

  /**
   * Reads the activity log.
   *
   * @returns Every record, newest first.
   * @throws The backend's error, when the log can't be read.
   */
  getLogEntries(): Promise<LogEntry[]>;

  /**
   * Records an error in the activity log. Never rejects, so callers can fire
   * it and forget it.
   *
   * @param message - What went wrong, in words the Log page shows.
   * @param details - The facts behind it, such as the error's text.
   */
  logError(message: string, details?: Record<string, unknown>): Promise<void>;
}
