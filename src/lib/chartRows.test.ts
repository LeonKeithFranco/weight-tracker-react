import { describe, expect, it } from "vitest";
import { toChartRows } from "./chartRows";
import type { DailyFigures } from "./types";
import { KG_PER_LB } from "./units";

/**
 * An estimated day with a different value in every figure, with weights in kg
 * and the 7-day change as a fraction.
 */
const day: DailyFigures = {
  date: "2026-11-05",
  weightKg: 90,
  isEstimated: true,
  lowestWeightKg: 89,
  average7Kg: 90.5,
  lowestAverage7Kg: 90.25,
  average7Change: -0.0123,
  average28Kg: 91,
  lowestAverage28Kg: 90.75,
  weightToLoseKg: 10,
  weightLossSinceStartKg: 5,
  weightLossPerWeekKg: 0.5,
};

describe("toChartRows", () => {
  it("keeps kg values unchanged and turns the change into a percentage", () => {
    expect(toChartRows([day], "kg")).toEqual([
      {
        date: "2026-11-05",
        isEstimated: true,
        weight: 90,
        realWeight: null,
        estimatedWeight: 90,
        lowestWeight: 89,
        average7: 90.5,
        lowestAverage7: 90.25,
        average7ChangePercent: -1.23,
        average28: 91,
        lowestAverage28: 90.75,
        weightToLose: 10,
        leftToLose: 10,
        pastTarget: null,
        weightLossSinceStart: 5,
        weightLossPerWeek: 0.5,
      },
    ]);
  });

  it("converts every weight to lb without rounding", () => {
    const [row] = toChartRows([day], "lb");

    expect(row.weight).toBe(90 / KG_PER_LB);
    expect(row.lowestAverage28).toBe(90.75 / KG_PER_LB);
    expect(row.weightToLose).toBe(10 / KG_PER_LB);
    expect(row.weightLossPerWeek).toBe(0.5 / KG_PER_LB);
    // A percentage has no unit, so it's the same in both.
    expect(row.average7ChangePercent).toBe(-1.23);
  });

  it("leaves weight to lose empty when no target is set", () => {
    const [row] = toChartRows([{ ...day, weightToLoseKg: null }], "lb");

    expect(row.weightToLose).toBeNull();
    expect(row.leftToLose).toBeNull();
    expect(row.pastTarget).toBeNull();
  });

  it("splits weight to lose at 0 so neither part changes sign", () => {
    // Above the target, then past it, then back above.
    const days = [3, 1, -1, -2, 1, 2].map((toLose) => ({
      ...day,
      weightToLoseKg: toLose,
    }));

    const rows = toChartRows(days, "kg");

    expect(rows.map((row) => row.leftToLose)).toEqual([3, 1, 0, 0, 1, 2]);
    // The days beside those past the target get 0, so the band below the
    // line starts and ends at 0 rather than at its first value.
    expect(rows.map((row) => row.pastTarget)).toEqual([
      null,
      0,
      -1,
      -2,
      0,
      null,
    ]);
  });

  it("splits the weight so estimated stretches reach the logged days beside them", () => {
    // Logged, logged, estimated, estimated, logged, logged.
    const days = [false, false, true, true, false, false].map(
      (isEstimated, index) => ({ ...day, weightKg: 90 - index, isEstimated }),
    );

    const rows = toChartRows(days, "kg");

    expect(rows.map((row) => row.realWeight)).toEqual([
      90,
      89,
      null,
      null,
      86,
      85,
    ]);
    // Days 2 and 5 are logged but border the estimates, so the faded line
    // joins them up, and the solid line never crosses the gap.
    expect(rows.map((row) => row.estimatedWeight)).toEqual([
      null,
      89,
      88,
      87,
      86,
      null,
    ]);
  });
});
