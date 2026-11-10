import { renderHook, waitFor } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { AppStorage } from "../storage/appStorage";
import { InMemoryBackend } from "../storage/inMemoryBackend";
import { DataProvider } from "./DataProvider";
import { useProjection } from "./useProjection";

/**
 * Saves one weight a day from 2026-01-01, going down overall but alternating,
 * so the day-to-day changes have a spread to project.
 *
 * @param days - How many days to save.
 * @returns Storage holding those entries.
 */
async function storageWith(days: number): Promise<AppStorage> {
  const storage = new AppStorage(new InMemoryBackend());
  for (let day = 1; day <= days; day++) {
    await storage.saveEntry({
      date: `2026-01-${String(day).padStart(2, "0")}`,
      weightKg: 90 - day * 0.1 + (day % 2) * 0.3,
    });
  }
  return storage;
}

/**
 * Runs the hook inside a `DataProvider` and waits for the entries to load.
 *
 * @param storage - The storage to load the entries from.
 * @returns What the hook returned once the series had loaded.
 */
async function renderProjection(storage: AppStorage) {
  const { result } = renderHook(() => useProjection(), {
    wrapper: ({ children }) => (
      <DataProvider storage={storage}>{children}</DataProvider>
    ),
  });
  await waitFor(() => expect(result.current.series.length).toBeGreaterThan(0));
  return result.current;
}

describe("useProjection", () => {
  it("projects 180 days from the saved entries once there are 14 days", async () => {
    const { series, projected } = await renderProjection(await storageWith(14));

    expect(series).toHaveLength(14);
    expect(projected).toHaveLength(180);
  });

  it("has no projection with fewer than 14 days", async () => {
    const { projected } = await renderProjection(await storageWith(13));

    expect(projected).toBeNull();
  });
});
