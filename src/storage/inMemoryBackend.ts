import type {
  CalendarDate,
  LogEntry,
  Settings,
  WeightEntry,
} from "../lib/types";
import type { NewLogEntry, StorageBackend } from "./storageBackend";

/**
 * Keeps data in plain variables, for tests. Everything is copied on the way in
 * and out, because IndexedDB does the same, so a caller changing an object it
 * holds can't change what's saved.
 */
export class InMemoryBackend implements StorageBackend {
  private entries = new Map<CalendarDate, WeightEntry>();
  private settings: Settings | undefined;
  private logEntries: LogEntry[] = [];
  private nextLogId = 1;

  async getEntries(): Promise<WeightEntry[]> {
    const entries = [...this.entries.values()].sort((a, b) =>
      a.date.localeCompare(b.date),
    );
    return structuredClone(entries);
  }

  async getEntry(date: CalendarDate): Promise<WeightEntry | undefined> {
    return structuredClone(this.entries.get(date));
  }

  async putEntry(entry: WeightEntry): Promise<void> {
    this.entries.set(entry.date, structuredClone(entry));
  }

  async putEntries(entries: WeightEntry[]): Promise<void> {
    for (const entry of entries) {
      this.entries.set(entry.date, structuredClone(entry));
    }
  }

  async deleteEntry(date: CalendarDate): Promise<void> {
    this.entries.delete(date);
  }

  async getSettings(): Promise<Settings | undefined> {
    return structuredClone(this.settings);
  }

  async putSettings(settings: Settings): Promise<void> {
    this.settings = structuredClone(settings);
  }

  async getLogEntries(): Promise<LogEntry[]> {
    return structuredClone(this.logEntries).reverse();
  }

  async addLogEntry(entry: NewLogEntry): Promise<void> {
    this.logEntries.push({ ...structuredClone(entry), id: this.nextLogId });
    this.nextLogId += 1;
  }
}
