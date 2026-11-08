import { useEffect, useState, type ReactNode } from "react";
import type { Settings, WeightEntry } from "../lib/types";
import type { WeightStorage } from "../storage/weightStorage";
import { DataContext, type DataContextValue } from "./dataContext";

type DataProviderProps = {
  storage: WeightStorage;
  children: ReactNode;
};

/**
 * Loads saved data through storage and shares it with every component inside.
 * Each change is saved first, then the data is read back, so what the screens
 * show always matches what's stored.
 */
export function DataProvider({ storage, children }: DataProviderProps) {
  const [entries, setEntries] = useState<WeightEntry[] | null>(null);
  const [settings, setSettings] = useState<Settings | null>(null);
  const [loadFailed, setLoadFailed] = useState(false);

  useEffect(() => {
    // Set if React discards this effect before loading finishes, so a late
    // result doesn't overwrite newer state.
    let ignore = false;

    Promise.all([storage.getEntries(), storage.getSettings()]).then(
      ([savedEntries, savedSettings]) => {
        if (ignore) return;
        setEntries(savedEntries);
        setSettings(savedSettings);
      },
      (error: unknown) => {
        if (ignore) return;
        setLoadFailed(true);
        void storage.logError("Couldn't load saved data", {
          error: String(error),
        });
      },
    );

    return () => {
      ignore = true;
    };
  }, [storage]);

  if (loadFailed) {
    return (
      <p role="alert">Couldn't load your saved data. Try reloading the page.</p>
    );
  }

  // Loading from IndexedDB takes a moment, so show nothing rather than flash
  // a message.
  if (entries === null || settings === null) {
    return null;
  }

  const value: DataContextValue = {
    entries,
    settings,
    async saveEntry(entry) {
      await storage.saveEntry(entry);
      setEntries(await storage.getEntries());
    },
    async deleteEntry(date) {
      await storage.deleteEntry(date);
      setEntries(await storage.getEntries());
    },
    async importEntries(parsed) {
      await storage.importEntries(parsed);
      setEntries(await storage.getEntries());
    },
    async saveSettings(newSettings) {
      await storage.saveSettings(newSettings);
      setSettings(await storage.getSettings());
    },
    logError(message, details) {
      return storage.logError(message, details);
    },
  };

  return <DataContext value={value}>{children}</DataContext>;
}
