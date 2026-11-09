import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import type { Settings, WeightEntry } from "../lib/types";
import {
  checkPersistence,
  requestPersistence,
  type Persistence,
  type PersistenceApi,
} from "../storage/persistence";
import type { WeightStorage } from "../storage/weightStorage";
import { DataContext, type DataContextValue } from "./dataContext";

type DataProviderProps = {
  storage: WeightStorage;
  /** The browser's `navigator.storage`. Left out, storage is "unsupported". */
  persistenceApi?: PersistenceApi;
  children: ReactNode;
};

/**
 * Loads saved data through storage and shares it with every component inside.
 * Each change is saved first, then the data is read back, so what the screens
 * show always matches what's stored.
 */
export function DataProvider({
  storage,
  persistenceApi,
  children,
}: DataProviderProps) {
  const [entries, setEntries] = useState<WeightEntry[] | null>(null);
  const [settings, setSettings] = useState<Settings | null>(null);
  const [loadFailed, setLoadFailed] = useState(false);
  const [persistence, setPersistence] = useState<Persistence | null>(null);
  // Whether the app has asked for persistent storage on its own since it
  // opened. A ref, because changing it shouldn't draw anything again.
  const askedForPersistence = useRef(false);

  // Without `useCallback`, every render would make a new function, and an
  // effect that depends on it would run again each time. Hooks can't come
  // after the early returns below, so this is up here.
  const getLogEntries = useCallback(() => storage.getLogEntries(), [storage]);
  const logError = useCallback(
    (message: string, details?: Record<string, unknown>) =>
      storage.logError(message, details),
    [storage],
  );
  // Asks the browser, and records a failure rather than throwing, because
  // the app works the same without persistent storage.
  const askForPersistence = useCallback(async () => {
    try {
      const answer = await requestPersistence(persistenceApi);
      setPersistence(answer);
      return answer;
    } catch (error) {
      void storage.logError("Couldn't ask for persistent storage", {
        error: String(error),
      });
      return "best-effort";
    }
  }, [persistenceApi, storage]);

  useEffect(() => {
    let ignore = false;
    checkPersistence(persistenceApi).then(
      (answer) => {
        if (!ignore) setPersistence(answer);
      },
      (error: unknown) => {
        if (ignore) return;
        setPersistence("unsupported");
        void storage.logError("Couldn't check for persistent storage", {
          error: String(error),
        });
      },
    );
    return () => {
      ignore = true;
    };
  }, [persistenceApi, storage]);

  // Asks once per visit, as soon as there's data worth keeping: at startup
  // if entries are already saved, or after the first save or import. Asking
  // before then would show Firefox's prompt to someone who hasn't used the
  // app yet.
  const hasEntries = entries !== null && entries.length > 0;
  useEffect(() => {
    if (
      !hasEntries ||
      persistence !== "best-effort" ||
      askedForPersistence.current
    ) {
      return;
    }
    // Without the ref, deleting every entry and then logging again would
    // ask a second time in one visit.
    askedForPersistence.current = true;
    void askForPersistence();
  }, [hasEntries, persistence, askForPersistence]);

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
  if (entries === null || settings === null || persistence === null) {
    return null;
  }

  const value: DataContextValue = {
    entries,
    settings,
    persistence,
    requestPersistence: askForPersistence,
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
    getLogEntries,
    logError,
  };

  return <DataContext value={value}>{children}</DataContext>;
}
