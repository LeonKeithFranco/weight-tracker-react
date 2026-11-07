import "fake-indexeddb/auto";
import { describe, expect, it } from "vitest";
import type { WeightEntry } from "../lib/types";
import { DexieBackend } from "./dexieBackend";

describe("DexieBackend", () => {
  it("keeps data when the database is opened again", async () => {
    const name = crypto.randomUUID();
    await new DexieBackend(name).putEntry({
      date: "2026-01-01",
      weightKg: 90,
    });

    const reopened = new DexieBackend(name);

    expect(await reopened.getEntries()).toEqual([
      { date: "2026-01-01", weightKg: 90 },
    ]);
  });

  it("saves none of the entries if one of them fails", async () => {
    const backend = new DexieBackend(crypto.randomUUID());
    const noDate = { weightKg: 89 } as WeightEntry;

    await expect(
      backend.putEntries([{ date: "2026-01-01", weightKg: 90 }, noDate]),
    ).rejects.toThrow();

    expect(await backend.getEntries()).toEqual([]);
  });
});
