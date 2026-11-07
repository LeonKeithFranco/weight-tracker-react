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
 */
export interface StorageBackend {
  /** Returns all entries, oldest first. */
  getEntries(): Promise<WeightEntry[]>;

  getEntry(date: CalendarDate): Promise<WeightEntry | undefined>;

  /** Adds an entry, or replaces the one already saved for that date. */
  putEntry(entry: WeightEntry): Promise<void>;

  /** Saves every entry, or none of them if anything fails. */
  putEntries(entries: WeightEntry[]): Promise<void>;

  /** Does nothing if that date has no entry. */
  deleteEntry(date: CalendarDate): Promise<void>;

  /** Returns `undefined` if settings have never been saved. */
  getSettings(): Promise<Settings | undefined>;

  putSettings(settings: Settings): Promise<void>;

  /** Returns the activity log, newest first. */
  getLogEntries(): Promise<LogEntry[]>;

  addLogEntry(entry: NewLogEntry): Promise<void>;
}
