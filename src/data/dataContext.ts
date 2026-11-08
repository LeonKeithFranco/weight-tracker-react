import { createContext, useContext } from "react";
import type { ParsedCsv } from "../lib/csvImport";
import type { CalendarDate, Settings, WeightEntry } from "../lib/types";

export type DataContextValue = {
  /** Every saved entry, oldest first. */
  entries: WeightEntry[];
  settings: Settings;
  saveEntry(entry: WeightEntry): Promise<void>;
  deleteEntry(date: CalendarDate): Promise<void>;
  importEntries(parsed: ParsedCsv): Promise<void>;
  saveSettings(settings: Settings): Promise<void>;
  /** Records an error in the activity log. Never rejects. */
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
