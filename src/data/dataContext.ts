import { createContext, useContext } from "react";
import type { ParsedCsv } from "../lib/csvImport";
import type {
  CalendarDate,
  LogEntry,
  Settings,
  WeightEntry,
} from "../lib/types";
import type { Persistence } from "../storage/persistence";

/**
 * The saved data and the functions that change it, as `DataProvider` shares
 * them. Each change is saved first and then read back, so the data here
 * always matches what's stored.
 */
export type DataContextValue = {
  /** Every saved entry, oldest first. */
  entries: WeightEntry[];
  /** The saved settings, or the defaults until the user saves their own. */
  settings: Settings;
  /** Whether the browser keeps the data until the user deletes it. */
  persistence: Persistence;
  /**
   * Asks the browser for persistent storage. Stays the same function.
   *
   * @returns The browser's answer, or `"best-effort"` if asking failed. Never
   * rejects, because the app works the same without persistent storage.
   */
  requestPersistence(): Promise<Persistence>;
  /**
   * Adds an entry, or replaces the one saved for that date, then updates
   * `entries`.
   *
   * @param entry - The entry to save, with its weight in kg.
   * @throws The storage's error, when the entry can't be saved, or when it was
   * saved but the entries can't be read back.
   */
  saveEntry(entry: WeightEntry): Promise<void>;
  /**
   * Deletes the entry for a date, then updates `entries`.
   *
   * @param date - The date whose entry to delete.
   * @throws The storage's error, when the entry can't be deleted, or when it
   * was deleted but the entries can't be read back.
   */
  deleteEntry(date: CalendarDate): Promise<void>;
  /**
   * Saves a file's valid entries in one step, then updates `entries`.
   *
   * @param parsed - The file's rows, from `parseCsv`.
   * @throws The storage's error, when the entries can't be saved, and then
   * nothing is saved, or when they were saved but can't be read back.
   */
  importEntries(parsed: ParsedCsv): Promise<void>;
  /**
   * Saves the settings, then updates `settings`.
   *
   * @param settings - The settings to save.
   * @throws The storage's error, when the settings can't be saved, or when
   * they were saved but can't be read back.
   */
  saveSettings(settings: Settings): Promise<void>;
  /**
   * Reads the activity log. It isn't loaded with the rest, because only the
   * Log page needs it. Stays the same function between renders, so it can be
   * an effect's dependency.
   *
   * @returns Every record, newest first.
   * @throws The storage's error, when the log can't be read.
   */
  getLogEntries(): Promise<LogEntry[]>;
  /**
   * Records an error in the activity log. Never rejects. Stays the same
   * function.
   *
   * @param message - What went wrong, in words the Log page shows.
   * @param details - The facts behind it, such as the error's text.
   */
  logError(message: string, details?: Record<string, unknown>): Promise<void>;
};

/**
 * Carries the data from `DataProvider` to the components inside it. `null`
 * means there's no `DataProvider` above the component.
 */
export const DataContext = createContext<DataContextValue | null>(null);

/**
 * Gives a component the saved data and the functions that change it.
 *
 * @returns The data shared by the nearest `DataProvider` above the component.
 * @throws {@link Error}
 * When there's no `DataProvider` above the component.
 */
export function useData(): DataContextValue {
  const value = useContext(DataContext);
  if (value === null) {
    throw new Error("useData must be used inside a DataProvider");
  }
  return value;
}
