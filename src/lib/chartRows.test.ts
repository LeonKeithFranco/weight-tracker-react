import { describe, expect, it } from "vitest";
import { toChartRows } from "./chartRows";
import type { DailyFigures } from "./types";
import { KG_PER_LB } from "./units";

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
        lowestWeight: 89,
        average7: 90.5,
        lowestAverage7: 90.25,
        average7ChangePercent: -1.23,
        average28: 91,
        lowestAverage28: 90.75,
        weightToLose: 10,
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
  });
});
