import { describe, expect, it } from "vitest";
import { calculateDailyFigures } from "./dailyFigures";
import { estimateGoalDate } from "./goalDate";
import { seriesOf } from "./testSeries";

/**
 * Estimates the goal date for consecutive days of weights.
 *
 * @param weights - One weight a day, in kg, from 2026-01-01.
 * @param targetWeightKg - The target in kg, or `null` for none.
 * @returns The goal date estimate.
 */
function estimate(weights: number[], targetWeightKg: number | null) {
  const figures = calculateDailyFigures(seriesOf(weights), targetWeightKg);
  return estimateGoalDate(figures, targetWeightKg);
}

/** `days` days on a straight line, changing by `kgPerDay` each day. */
function line(days: number, startKg: number, kgPerDay: number): number[] {
  return Array.from({ length: days }, (_, index) => startKg + index * kgPerDay);
}

describe("estimateGoalDate", () => {
  it("shows nothing without a target", () => {
    expect(estimate(line(30, 100, -0.5), null)).toEqual({
      status: "no-target",
    });
  });

  it("needs 14 days of data", () => {
    expect(estimate(line(13, 100, -0.5), 80)).toEqual({
      status: "not-enough-data",
    });
    expect(estimate(line(14, 100, -0.5), 80).status).toBe("estimated");
  });

  it("reports not enough data when there's none at all", () => {
    expect(estimate([], 80)).toEqual({ status: "not-enough-data" });
  });

  it("asks for more data before reporting the target as reached", () => {
    expect(estimate(line(13, 70, -0.5), 80)).toEqual({
      status: "not-enough-data",
    });
  });

  it("reports the target as reached when the average is at the target", () => {
    expect(estimate(line(14, 80, 0), 80)).toEqual({
      status: "target-reached",
    });
  });

  it("goes by the 7-day average, not the latest weight", () => {
    // The last day is under the target, but the 7-day average is about 83.7.
    const weights = [...line(19, 100, -1), 79];

    expect(estimate(weights, 80).status).toBe("estimated");
  });

  it("gives no estimate for a flat trend", () => {
    expect(estimate(line(30, 90, 0), 80)).toEqual({ status: "no-estimate" });
  });

  it("gives no estimate for an upward trend", () => {
    expect(estimate(line(30, 90, 0.1), 80)).toEqual({ status: "no-estimate" });
  });

  it("treats a barely falling trend as flat", () => {
    // This would otherwise project past the latest date JavaScript can hold.
    expect(estimate(line(30, 90, -0.0000001), 50)).toEqual({
      status: "no-estimate",
    });
  });

  it("projects from the 7-day average and rounds up to a whole day", () => {
    // The last day is 2026-01-20 and the 7-day average is 92. Losing the
    // remaining 11.9 kg at 0.5 kg a day takes 23.8 days, so 24 days.
    expect(estimate(line(20, 100, -0.5), 80.1)).toEqual({
      status: "estimated",
      date: "2026-02-13",
    });
  });

  it("fits the line to the last 90 days only", () => {
    // 100 days rising, then 90 falling, ending on 2026-07-09. The 7-day
    // average is 91.4, so 11.35 kg at 0.1 kg a day takes 113.5 days.
    const weights = [...line(100, 60, 0.4), ...line(90, 100, -0.1)];

    expect(estimate(weights, 80.05)).toEqual({
      status: "estimated",
      date: "2026-10-31",
    });
  });
});
