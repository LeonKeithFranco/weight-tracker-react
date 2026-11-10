import { describe, expect, it } from "vitest";
import { toProjectionRows } from "./projectionRows";
import type { ProjectedDay } from "./projectedRange";
import type { DailyPoint } from "./types";
import { KG_PER_LB } from "./units";

/**
 * Builds consecutive days from 2026-01-01, the last one estimated, to check
 * the estimated flag carries over.
 *
 * @param weights - One weight a day, in kg.
 * @returns One point per weight.
 */
function seriesOf(weights: number[]): DailyPoint[] {
  return weights.map((weightKg, index) => ({
    date: `2026-01-${String(index + 1).padStart(2, "0")}`,
    weightKg,
    isEstimated: index === weights.length - 1,
  }));
}

/** Two projected days, following a three-day series. */
const projected: ProjectedDay[] = [
  { date: "2026-01-04", lowKg: 88, trendKg: 89, highKg: 90 },
  { date: "2026-01-05", lowKg: 87, trendKg: 88.5, highKg: 90 },
];

describe("toProjectionRows", () => {
  it("joins the recent weights to the projected days at the latest weight", () => {
    const rows = toProjectionRows(
      seriesOf([91, 90, 89.5]),
      projected,
      "kg",
      80,
    );

    expect(rows).toEqual([
      {
        date: "2026-01-01",
        isEstimated: false,
        weight: 91,
        trend: null,
        range: null,
        target: 80,
      },
      {
        date: "2026-01-02",
        isEstimated: false,
        weight: 90,
        trend: null,
        range: null,
        target: 80,
      },
      // The latest day starts the trend and the band at its own weight.
      {
        date: "2026-01-03",
        isEstimated: true,
        weight: 89.5,
        trend: 89.5,
        range: [89.5, 89.5],
        target: 80,
      },
      {
        date: "2026-01-04",
        isEstimated: false,
        weight: null,
        trend: 89,
        range: [88, 90],
        target: 80,
      },
      {
        date: "2026-01-05",
        isEstimated: false,
        weight: null,
        trend: 88.5,
        range: [87, 90],
        target: 80,
      },
    ]);
  });

  it("uses only the projection's 90-day window of past days", () => {
    const rows = toProjectionRows(
      seriesOf(Array.from({ length: 120 }, () => 90)),
      [],
      "kg",
      null,
    );

    expect(rows).toHaveLength(90);
  });

  it("converts to lb and leaves the target empty without one", () => {
    const [first, , , future] = toProjectionRows(
      seriesOf([91, 90, 89.5]),
      projected,
      "lb",
      null,
    );

    expect(first.weight).toBe(91 / KG_PER_LB);
    expect(future.range).toEqual([88 / KG_PER_LB, 90 / KG_PER_LB]);
    expect(first.target).toBeNull();
  });
});
