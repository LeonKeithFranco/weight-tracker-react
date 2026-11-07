import { Dexie, type EntityTable, type Table } from "dexie";
import type {
  CalendarDate,
  LogEntry,
  Settings,
  WeightEntry,
} from "../lib/types";
import type { NewLogEntry, StorageBackend } from "./storageBackend";

const DATABASE_NAME = "weight-tracker";

/** The settings table holds one row, saved under this key. */
const SETTINGS_KEY = "settings";

type Database = Dexie & {
  entries: Table<WeightEntry, CalendarDate>;
  settings: Table<Settings, string>;
  log: EntityTable<LogEntry, "id">;
};

/** Keeps data in the browser's IndexedDB, through Dexie. */
export class DexieBackend implements StorageBackend {
  private readonly db: Database;

  constructor(databaseName = DATABASE_NAME) {
    this.db = new Dexie(databaseName) as Database;

    // Each table lists its primary key first. `""` means the key is kept
    // outside the row, and `++` means it counts up automatically.
    this.db.version(1).stores({
      entries: "date",
      settings: "",
      log: "++id",
    });
  }

  getEntries(): Promise<WeightEntry[]> {
    return this.db.entries.orderBy("date").toArray();
  }

  getEntry(date: CalendarDate): Promise<WeightEntry | undefined> {
    return this.db.entries.get(date);
  }

  async putEntry(entry: WeightEntry): Promise<void> {
    await this.db.entries.put(entry);
  }

  async putEntries(entries: WeightEntry[]): Promise<void> {
    // Without a transaction, `bulkPut` keeps the rows saved before a failure.
    await this.db.transaction("rw", this.db.entries, () =>
      this.db.entries.bulkPut(entries),
    );
  }

  deleteEntry(date: CalendarDate): Promise<void> {
    return this.db.entries.delete(date);
  }

  getSettings(): Promise<Settings | undefined> {
    return this.db.settings.get(SETTINGS_KEY);
  }

  async putSettings(settings: Settings): Promise<void> {
    await this.db.settings.put(settings, SETTINGS_KEY);
  }

  getLogEntries(): Promise<LogEntry[]> {
    return this.db.log.orderBy("id").reverse().toArray();
  }

  async addLogEntry(entry: NewLogEntry): Promise<void> {
    await this.db.log.add(entry);
  }
}
