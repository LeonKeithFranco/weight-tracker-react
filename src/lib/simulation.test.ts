import { describe, expect, it } from "vitest";
import { simulateProjection, type SimulatedDay } from "./simulation";
import { sampleStandardDeviation } from "./statistics";
import { seriesOf } from "./testSeries";

/** Falls 0.1 kg a day on average, swinging 1 kg either way day to day. */
function noisyWeights(days: number): number[] {
  return Array.from(
    { length: days },
    (_, index) => 100 - index * 0.1 + (index % 2 === 0 ? 0.5 : -0.5),
  );
}

/** For tests that need a result, since the simulation can return `null`. */
function simulate(weights: number[]): SimulatedDay[] {
  const days = simulateProjection(seriesOf(weights));

  if (!days) {
    throw new Error("Expected a simulation result");
  }

  return days;
}

describe("simulateProjection", () => {
  describe("data requirements", () => {
    it("needs 14 days of data", () => {
      expect(simulateProjection(seriesOf(noisyWeights(13)))).toBeNull();
      expect(simulateProjection(seriesOf(noisyWeights(14)))).not.toBeNull();
    });

    it("handles no entries at all", () => {
      expect(simulateProjection([])).toBeNull();
    });
  });

  describe("shape of the result", () => {
    it("covers the 180 days after the latest day", () => {
      // 30 days from 2026-01-01 end on 2026-01-30.
      const days = simulate(noisyWeights(30));

      expect(days).toHaveLength(180);
      expect(days[0].date).toBe("2026-01-31");
      expect(days[179].date).toBe("2026-07-29");
    });

    it("keeps the median inside the band on every day", () => {
      for (const day of simulate(noisyWeights(60))) {
        expect(day.lowKg).toBeLessThanOrEqual(day.medianKg);
        expect(day.medianKg).toBeLessThanOrEqual(day.highKg);
      }
    });
  });

  describe("without noise", () => {
    it("continues a steady trend in a straight line", () => {
      const weights = Array.from({ length: 30 }, (_, i) => 100 - i * 0.5);
      const days = simulate(weights);

      // The latest weight is 85.5 kg, so day 10 is 5 kg lower.
      expect(days[9].medianKg).toBeCloseTo(80.5, 8);
      expect(days[9].lowKg).toBeCloseTo(80.5, 8);
      expect(days[9].highKg).toBeCloseTo(80.5, 8);
    });

    it("stays level on a flat series", () => {
      const days = simulate(Array<number>(30).fill(80));

      expect(days[179]).toMatchObject({
        lowKg: 80,
        medianKg: 80,
        highKg: 80,
      });
    });
  });

  describe("repeatability", () => {
    it("gives the same result for the same data", () => {
      const weights = noisyWeights(60);

      expect(simulate(weights)).toEqual(simulate(weights));
    });

    it("gives a different result when a recent weight changes", () => {
      const weights = noisyWeights(60);
      const changed = weights.with(40, weights[40] + 0.1);

      expect(simulate(changed)).not.toEqual(simulate(weights));
    });

    it("ignores fields it doesn't use, such as a day's other figures", () => {
      const series = seriesOf(noisyWeights(60));
      const withExtras = series.map((day) => ({ ...day, weightToLoseKg: 5 }));

      expect(simulateProjection(withExtras)).toEqual(
        simulateProjection(series),
      );
    });
  });

  describe("recent window", () => {
    it("uses only the last 90 days", () => {
      const series = seriesOf([
        ...Array<number>(50).fill(150),
        ...noisyWeights(90),
      ]);

      expect(simulateProjection(series)).toEqual(
        simulateProjection(series.slice(-90)),
      );
    });
  });

  // Exact values would only prove the code matches itself, so these compare
  // the result with what the statistics say a random walk should do.
  describe("statistical behavior", () => {
    const WEIGHTS = noisyWeights(90);
    const CHANGES = WEIGHTS.slice(1).map((w, index) => w - WEIGHTS[index]);
    const DEVIATION = sampleStandardDeviation(CHANGES);
    const AVERAGE_CHANGE = (WEIGHTS[89] - WEIGHTS[0]) / 89;
    const DAYS = simulate(WEIGHTS);

    // The 10th and 90th percentiles sit 1.2816 deviations from the middle.
    const expectedBandWidth = (day: number) =>
      2 * 1.2816 * DEVIATION * Math.sqrt(day);

    it("drifts by the average change", () => {
      const expected = WEIGHTS[89] + AVERAGE_CHANGE * 180;
      // About 2 standard errors of a median of 1,000 paths after 180 days.
      const tolerance = 2 * 1.25 * DEVIATION * Math.sqrt(180 / 1000);

      expect(Math.abs(DAYS[179].medianKg - expected)).toBeLessThan(tolerance);
    });

    it("widens the band with the square root of time", () => {
      for (const day of [1, 45, 180]) {
        const { lowKg, highKg } = DAYS[day - 1];

        const ratio = (highKg - lowKg) / expectedBandWidth(day);

        expect(ratio).toBeGreaterThan(0.9);
        expect(ratio).toBeLessThan(1.1);
      }
    });
  });
});
