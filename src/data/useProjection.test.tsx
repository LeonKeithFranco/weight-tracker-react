import { renderHook, waitFor } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { AppStorage } from "../storage/appStorage";
import { InMemoryBackend } from "../storage/inMemoryBackend";
import { DataProvider } from "./DataProvider";
import { SIMULATION_MEASURE, useProjection } from "./useProjection";

/** Saves one weight a day from 2026-01-01, for as many days as given. */
async function storageWith(days: number): Promise<AppStorage> {
  const storage = new AppStorage(new InMemoryBackend());
  for (let day = 1; day <= days; day++) {
    await storage.saveEntry({
      date: `2026-01-${String(day).padStart(2, "0")}`,
      // Alternating, so the day-to-day changes have a spread to simulate.
      weightKg: 90 - day * 0.1 + (day % 2) * 0.3,
    });
  }
  return storage;
}

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
  it("simulates 180 days once there are 14 days of data, and times it", async () => {
    performance.clearMeasures(SIMULATION_MEASURE);

    const { series, simulated } = await renderProjection(await storageWith(14));

    expect(series).toHaveLength(14);
    expect(simulated).toHaveLength(180);
    expect(performance.getEntriesByName(SIMULATION_MEASURE)).not.toHaveLength(
      0,
    );
  });

  it("has no simulation with fewer than 14 days", async () => {
    const { simulated } = await renderProjection(await storageWith(13));

    expect(simulated).toBeNull();
  });
});
