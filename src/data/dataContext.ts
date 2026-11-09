import { createContext, useContext } from "react";
import type { ParsedCsv } from "../lib/csvImport";
import type {
  CalendarDate,
  LogEntry,
  Settings,
  WeightEntry,
} from "../lib/types";
import type { Persistence } from "../storage/persistence";

export type DataContextValue = {
  /** Every saved entry, oldest first. */
  entries: WeightEntry[];
  settings: Settings;
  /** Whether the browser keeps the data until the user deletes it. */
  persistence: Persistence;
  /**
   * Asks the browser for persistent storage, and resolves with its answer.
   * Never rejects. Stays the same function.
   */
  requestPersistence(): Promise<Persistence>;
  saveEntry(entry: WeightEntry): Promise<void>;
  deleteEntry(date: CalendarDate): Promise<void>;
  importEntries(parsed: ParsedCsv): Promise<void>;
  saveSettings(settings: Settings): Promise<void>;
  /**
   * Reads the activity log, newest first. It isn't loaded with the rest, because
   * only the Log page needs it. Stays the same function between renders, so it
   * can be an effect's dependency.
   */
  getLogEntries(): Promise<LogEntry[]>;
  /** Records an error in the activity log. Never rejects. Stays the same function. */
  logError(message: string, details?: Record<string, unknown>): Promise<void>;
};

/** `null` means there's no `DataProvider` above the component. */
export const DataContext = createContext<DataContextValue | null>(null);

/** Gives a component the saved data and the functions that change it. */
export function useData(): DataContextValue {
  const value = useContext(DataContext);
  if (value === null) {
    throw new Error("useData must be used inside a DataProvider");
  }
  return value;
}
