import { Dexie, type EntityTable, type Table } from "dexie";
import type {
  CalendarDate,
  LogEntry,
  Settings,
  WeightEntry,
} from "../lib/types";
import type { NewLogEntry, StorageBackend } from "./storageBackend";

/** The IndexedDB database's name, which the browser keeps per site. */
const DATABASE_NAME = "weight-tracker";

/** The settings table holds one row, saved under this key. */
const SETTINGS_KEY = "settings";

/** The Dexie database with the app's three tables, typed. */
type Database = Dexie & {
  /** Weight entries, keyed by date. */
  entries: Table<WeightEntry, CalendarDate>;
  /** The one settings row, under {@link SETTINGS_KEY}. */
  settings: Table<Settings, string>;
  /** Activity log records, keyed by an `id` that counts up. */
  log: EntityTable<LogEntry, "id">;
};

/**
 * Keeps data in the browser's IndexedDB, through Dexie.
 *
 * @remarks
 * Its methods are documented on {@link StorageBackend}, and editors show those
 * comments here too.
 */
export class DexieBackend implements StorageBackend {
  /** The app's database, which Dexie opens on the first read or write. */
  private readonly db: Database;

  /**
   * Sets up the database and its tables. Dexie opens it, creating the tables
   * the first time, when the first read or write runs.
   *
   * @param databaseName - The database to open. Tests pass a random name, so
   * each starts with an empty database, or reuse one to reopen it.
   */
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

  async trimLog(maxEntries: number): Promise<void> {
    await this.db.log.orderBy("id").reverse().offset(maxEntries).delete();
  }
}
