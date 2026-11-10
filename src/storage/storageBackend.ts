import type {
  CalendarDate,
  LogEntry,
  Settings,
  WeightEntry,
} from "../lib/types";

/** A log record before it's saved. The backend assigns the `id`. */
export type NewLogEntry = Omit<LogEntry, "id">;

/**
 * Where data physically lives. A backend only reads and writes. The rules, such
 * as recording changes in the activity log, sit above it in one shared place,
 * so every backend follows them and tests of them run against the real code.
 *
 * @remarks
 * Every method returns a promise, which rejects with the underlying store's
 * own error when it can't read or write, such as when IndexedDB is
 * unavailable or full.
 */
export interface StorageBackend {
  /**
   * Reads every entry.
   *
   * @returns All entries, oldest first.
   * @throws The store's error, when it can't be read.
   */
  getEntries(): Promise<WeightEntry[]>;

  /**
   * Reads the entry for one date.
   *
   * @param date - The date to look up.
   * @returns The entry, or `undefined` if that date has none.
   * @throws The store's error, when it can't be read.
   */
  getEntry(date: CalendarDate): Promise<WeightEntry | undefined>;

  /**
   * Adds an entry, or replaces the one already saved for that date.
   *
   * @param entry - The entry to save.
   * @throws The store's error, when it can't be written.
   */
  putEntry(entry: WeightEntry): Promise<void>;

  /**
   * Saves every entry, or none of them if anything fails. Each replaces any
   * entry already saved for its date.
   *
   * @param entries - The entries to save, each on a different date.
   * @throws The store's error, when it can't be written. Nothing is saved.
   */
  putEntries(entries: WeightEntry[]): Promise<void>;

  /**
   * Deletes the entry for a date. Does nothing if that date has no entry.
   *
   * @param date - The date whose entry to delete.
   * @throws The store's error, when it can't be written.
   */
  deleteEntry(date: CalendarDate): Promise<void>;

  /**
   * Reads the saved settings.
   *
   * @returns The settings, or `undefined` if they've never been saved.
   * @throws The store's error, when it can't be read.
   */
  getSettings(): Promise<Settings | undefined>;

  /**
   * Saves the settings, replacing any saved before.
   *
   * @param settings - The settings to save.
   * @throws The store's error, when it can't be written.
   */
  putSettings(settings: Settings): Promise<void>;

  /**
   * Reads the activity log.
   *
   * @returns Every record, newest first.
   * @throws The store's error, when it can't be read.
   */
  getLogEntries(): Promise<LogEntry[]>;

  /**
   * Adds a record to the activity log, with the next `id`.
   *
   * @param entry - The record to add.
   * @throws The store's error, when it can't be written.
   */
  addLogEntry(entry: NewLogEntry): Promise<void>;

  /**
   * Deletes the oldest log records, keeping only the newest `maxEntries`.
   *
   * @param maxEntries - How many records to keep.
   * @throws The store's error, when it can't be written.
   */
  trimLog(maxEntries: number): Promise<void>;
}
