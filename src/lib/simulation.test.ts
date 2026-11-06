import { describe, expect, it } from "vitest";
import { simulateProjection, type SimulatedDay } from "./simulation";
import { seriesOf } from "./testSeries";

/** Weights that go down 1.1 kg, then up 0.9 kg, and so on. */
function zigzag(days: number): number[] {
  const weights = [100];

  for (let index = 1; index < days; index++) {
    weights.push(weights[index - 1] + (index % 2 === 1 ? -1.1 : 0.9));
  }

  return weights;
}

/** Runs the simulation on data that is known to have enough days. */
function simulate(weights: number[]): SimulatedDay[] {
  const days = simulateProjection(seriesOf(weights));

  if (days === null) {
    throw new Error("Expected a simulation");
  }

  return days;
}

describe("simulateProjection", () => {
  it("needs 14 days of data", () => {
    expect(simulateProjection(seriesOf(zigzag(13)))).toBeNull();
    expect(simulateProjection(seriesOf(zigzag(14)))).not.toBeNull();
  });

  it("covers the 180 days after the latest day", () => {
    const days = simulate(zigzag(31));

    expect(days).toHaveLength(180);
    expect(days[0].date).toBe("2026-02-01");
    expect(days[179].date).toBe("2026-07-30");
  });

  it("gives the same result for the same data", () => {
    expect(simulate(zigzag(40))).toEqual(simulate(zigzag(40)));
  });

  it("gives a different result when a recent weight changes", () => {
    const changed = zigzag(40);
    changed[39] += 0.1;

    expect(simulate(changed)[0].medianKg).not.toBe(
      simulate(zigzag(40))[0].medianKg,
    );
  });

  it("ignores days before the last 90", () => {
    const changed = zigzag(120);
    changed[0] = 150;

    expect(simulate(changed)).toEqual(simulate(zigzag(120)));
  });

  it("follows the line exactly when there is no variation", () => {
    const weights = Array.from({ length: 30 }, (_, index) => 100 - index * 0.5);

    const days = simulate(weights);

    // The latest weight is 85.5, and it keeps falling by 0.5 kg a day.
    expect(days[9].lowKg).toBeCloseTo(80.5, 8);
    expect(days[9].medianKg).toBeCloseTo(80.5, 8);
    expect(days[9].highKg).toBeCloseTo(80.5, 8);
  });

  it("keeps the median inside the band every day", () => {
    for (const day of simulate(zigzag(60))) {
      expect(day.lowKg).toBeLessThanOrEqual(day.medianKg);
      expect(day.medianKg).toBeLessThanOrEqual(day.highKg);
    }
  });

  it("widens the band over time", () => {
    const days = simulate(zigzag(60));

    expect(days[179].highKg - days[179].lowKg).toBeGreaterThan(
      days[0].highKg - days[0].lowKg,
    );
  });

  it("matches the drift and spread a random walk should have", () => {
    // 89 days gives 88 changes, half of each size, so their mean is exactly
    // -0.1 and their sample standard deviation is about 1.006.
    const weights = zigzag(89);
    const latest = weights[88];
    const finalDay = simulate(weights)[179];

    // After n days the mean drift is n * mean, so 180 * -0.1 = -18. The spread
    // is the standard deviation * sqrt(n), about 13.5, and the 10th and 90th
    // percentiles of a normal distribution sit 1.2816 of those from the middle.
    expect(Math.abs(finalDay.medianKg - (latest - 18))).toBeLessThan(1.5);
    expect(Math.abs(finalDay.highKg - finalDay.lowKg - 34.6)).toBeLessThan(3);
  });
});
