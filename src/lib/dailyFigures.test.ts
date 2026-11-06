import { describe, expect, it } from "vitest";
import { calculateDailyFigures } from "./dailyFigures";
import { seriesOf } from "./testSeries";
import type { DailyPoint } from "./types";

// Falls to 94 on day 7, then rises, so the lows and the weights differ.
const DIP = [100, 99, 98, 97, 96, 95, 94, 95, 96, 97];

// 30 days falling by 1 kg a day, which makes window means easy to work out.
const RAMP = Array.from({ length: 30 }, (_, index) => 100 - index);

describe("calculateDailyFigures", () => {
  it("returns nothing for an empty series", () => {
    expect(calculateDailyFigures([], 70)).toEqual([]);
  });

  it("keeps each day's date, weight and estimated flag", () => {
    const series = [
      { date: "2026-01-01", weightKg: 80, isEstimated: true },
    ] satisfies DailyPoint[];

    expect(calculateDailyFigures(series, null)[0]).toMatchObject(series[0]);
  });

  it("handles a single day", () => {
    expect(calculateDailyFigures(seriesOf([80]), 70)[0]).toMatchObject({
      lowestWeightKg: 80,
      average7Kg: 80,
      lowestAverage7Kg: 80,
      average7Change: 0,
      average28Kg: 80,
      lowestAverage28Kg: 80,
      weightToLoseKg: 10,
      weightLossSinceStartKg: 0,
      weightLossPerWeekKg: 0,
    });
  });

  describe("lowest weight", () => {
    it("holds the lowest value so far after the weight rises", () => {
      const lows = calculateDailyFigures(seriesOf(DIP), null).map(
        (day) => day.lowestWeightKg,
      );

      expect(lows).toEqual([100, 99, 98, 97, 96, 95, 94, 94, 94, 94]);
    });
  });

  describe("7-day average", () => {
    const figures = calculateDailyFigures(seriesOf(DIP), null);

    it("uses the days available until 7 exist", () => {
      expect(figures[0].average7Kg).toBe(100);
      expect(figures[1].average7Kg).toBe(99.5);
      expect(figures[5].average7Kg).toBe(97.5);
    });

    it("uses exactly 7 days once they exist", () => {
      expect(figures[6].average7Kg).toBeCloseTo(679 / 7, 10);
      expect(figures[7].average7Kg).toBeCloseTo(674 / 7, 10);
    });

    it("tracks the lowest average so far", () => {
      const late = calculateDailyFigures(
        seriesOf([...DIP, 120, 120, 120, 120]),
        null,
      );
      const lowest = Math.min(...late.map((day) => day.average7Kg));

      expect(late.at(-1)?.lowestAverage7Kg).toBe(lowest);
      expect(late.at(-1)?.average7Kg).toBeGreaterThan(lowest);
    });
  });

  describe("7-day average % change", () => {
    const figures = calculateDailyFigures(seriesOf(DIP), null);

    it("compares to day 1 until 7 days earlier exists", () => {
      expect(figures[0].average7Change).toBe(0);
      expect(figures[1].average7Change).toBeCloseTo(99.5 / 100 - 1, 10);
      expect(figures[6].average7Change).toBeCloseTo(679 / 7 / 100 - 1, 10);
    });

    it("compares to exactly 7 days earlier after that", () => {
      expect(figures[7].average7Change).toBeCloseTo(674 / 7 / 100 - 1, 10);
      expect(figures[8].average7Change).toBeCloseTo(671 / 7 / 99.5 - 1, 10);
    });
  });

  describe("28-day average", () => {
    const figures = calculateDailyFigures(seriesOf(RAMP), null);

    it("uses the days available until 28 exist", () => {
      expect(figures[3].average28Kg).toBe(98.5);
      expect(figures[26].average28Kg).toBe(87);
    });

    it("uses exactly 28 days once they exist", () => {
      expect(figures[27].average28Kg).toBe(86.5);
      expect(figures[28].average28Kg).toBe(85.5);
    });

    it("tracks the lowest average so far", () => {
      const late = calculateDailyFigures(
        seriesOf([...RAMP, 200, 200, 200]),
        null,
      );

      expect(late.at(-1)?.lowestAverage28Kg).toBe(84.5);
    });
  });

  describe("weight to lose until target", () => {
    it("is the weight minus the target", () => {
      const figures = calculateDailyFigures(seriesOf([80, 75]), 78);

      expect(figures[0].weightToLoseKg).toBe(2);
    });

    it("goes negative below the target", () => {
      const figures = calculateDailyFigures(seriesOf([80, 75]), 78);

      expect(figures[1].weightToLoseKg).toBe(-3);
    });

    it("is null when no target is set", () => {
      const figures = calculateDailyFigures(seriesOf([80]), null);

      expect(figures[0].weightToLoseKg).toBeNull();
    });
  });

  describe("weight loss", () => {
    const figures = calculateDailyFigures(seriesOf(DIP), null);

    it("measures since the first day", () => {
      expect(figures[6].weightLossSinceStartKg).toBe(6);
    });

    it("is negative after a gain", () => {
      const gain = calculateDailyFigures(seriesOf([80, 81]), null);

      expect(gain[1].weightLossSinceStartKg).toBe(-1);
    });

    it("is 0 per week on the first day", () => {
      expect(figures[0].weightLossPerWeekKg).toBe(0);
    });

    it("divides by the weeks since the first day", () => {
      expect(figures[1].weightLossPerWeekKg).toBe(7);
      expect(figures[7].weightLossPerWeekKg).toBe(5);
    });
  });
});
