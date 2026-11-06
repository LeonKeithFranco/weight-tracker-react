import { describe, expect, it } from "vitest";
import { calculateDailyFigures } from "./dailyFigures";
import { estimateGoalDate } from "./goalDate";
import { seriesOf } from "./testSeries";

function figuresOf(weights: number[]) {
  return calculateDailyFigures(seriesOf(weights), null);
}

/** Starts at 100 and falls by 0.5 kg a day. */
function fallingWeights(days: number): number[] {
  return Array.from({ length: days }, (_, index) => 100 - index * 0.5);
}

describe("estimateGoalDate", () => {
  describe("display states", () => {
    it("shows nothing without a target, even with little data", () => {
      expect(estimateGoalDate([], null)).toEqual({ status: "no-target" });
    });

    it("needs 14 days of data", () => {
      expect(estimateGoalDate(figuresOf(fallingWeights(13)), 80)).toEqual({
        status: "not-enough-data",
      });
      expect(estimateGoalDate(figuresOf(fallingWeights(14)), 80).status).toBe(
        "estimated",
      );
    });

    it("handles no entries at all", () => {
      expect(estimateGoalDate([], 80)).toEqual({ status: "not-enough-data" });
    });

    it("checks for enough data before checking the target", () => {
      expect(estimateGoalDate(figuresOf([70, 70]), 80)).toEqual({
        status: "not-enough-data",
      });
    });

    it("reports the target reached once the 7-day average is at it", () => {
      const flat = figuresOf(Array<number>(14).fill(80));

      expect(estimateGoalDate(flat, 80)).toEqual({ status: "target-reached" });
    });

    it("uses the 7-day average, not the latest weight, for the target", () => {
      // The last day dips under 80, but the 7-day average is still above it.
      const weights = [...fallingWeights(30).slice(0, 29), 79];

      expect(estimateGoalDate(figuresOf(weights), 80).status).toBe("estimated");
    });

    it("gives no estimate when the slope is flat", () => {
      const flat = figuresOf(Array<number>(14).fill(90));

      expect(estimateGoalDate(flat, 80)).toEqual({ status: "no-estimate" });
    });

    it("gives no estimate when the slope is upward", () => {
      const rising = figuresOf(fallingWeights(30).reverse());

      expect(estimateGoalDate(rising, 80)).toEqual({ status: "no-estimate" });
    });

    it("treats a slope too small to matter as flat", () => {
      // Falls 0.000001 kg a day, which would project about 27,000 years ahead.
      const weights = Array.from({ length: 30 }, (_, i) => 90 - i * 0.000001);

      expect(estimateGoalDate(figuresOf(weights), 80)).toEqual({
        status: "no-estimate",
      });
    });
  });

  describe("projected date", () => {
    // After 30 days the latest day is 2026-01-30 at 85.5 kg, and the 7-day
    // average is 87 kg, because the last 7 days run from 88.5 down to 85.5.
    const FIGURES = figuresOf(fallingWeights(30));

    it("projects from the latest 7-day average", () => {
      // 87 to 80 is 7 kg, which takes 14 days at 0.5 kg a day.
      expect(estimateGoalDate(FIGURES, 80)).toEqual({
        status: "estimated",
        date: "2026-02-13",
      });
    });

    it("rounds up to a whole day", () => {
      // 7.1 kg takes 14.2 days, so day 15 is the first one at the target.
      expect(estimateGoalDate(FIGURES, 79.9)).toEqual({
        status: "estimated",
        date: "2026-02-14",
      });
    });

    it("uses only the last 90 days for the slope", () => {
      const rise = Array.from({ length: 50 }, (_, i) => 75 + i);
      const fall = Array.from({ length: 90 }, (_, i) => 124 - i * 0.5);

      // The last 90 days fall 0.5 kg a day. The latest day is 2026-05-20 at
      // 79.5 kg, so the 7-day average is 81 kg, and 11 kg more takes 22 days.
      expect(estimateGoalDate(figuresOf([...rise, ...fall]), 70)).toEqual({
        status: "estimated",
        date: "2026-06-11",
      });
    });

    it("always produces a valid date for the slowest slope allowed", () => {
      // Falls 0.00002 kg a day, with the largest gap weights can have.
      const weights = Array.from({ length: 30 }, (_, i) => 500 - i * 0.00002);
      const estimate = estimateGoalDate(figuresOf(weights), 20);

      expect(estimate.status).toBe("estimated");
      expect(estimate).not.toMatchObject({ date: "Invalid Date" });
    });
  });
});
