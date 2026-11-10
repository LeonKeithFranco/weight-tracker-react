import { describe, expect, it } from "vitest";
import { projectRange, type ProjectedDay } from "./projectedRange";
import { seriesOf } from "./testSeries";

/**
 * Builds weights from 100 kg that go down 1.1 kg, then up 0.9 kg, and so on.
 *
 * @param days - How many weights to build.
 * @returns One weight a day, in kg.
 */
function zigzag(days: number): number[] {
  const weights = [100];

  for (let index = 1; index < days; index++) {
    weights.push(weights[index - 1] + (index % 2 === 1 ? -1.1 : 0.9));
  }

  return weights;
}

/**
 * Projects data that is known to have enough days.
 *
 * @param weights - One weight a day, in kg, from 2026-01-01.
 * @returns The projected days.
 * @throws {@link Error}
 * When there's no projection.
 */
function project(weights: number[]): ProjectedDay[] {
  const days = projectRange(seriesOf(weights));

  if (days === null) {
    throw new Error("Expected a projection");
  }

  return days;
}

describe("projectRange", () => {
  it("needs 14 days of data", () => {
    expect(projectRange(seriesOf(zigzag(13)))).toBeNull();
    expect(projectRange(seriesOf(zigzag(14)))).not.toBeNull();
  });

  it("covers the 180 days after the latest day", () => {
    const days = project(zigzag(31));

    expect(days).toHaveLength(180);
    expect(days[0].date).toBe("2026-02-01");
    expect(days[179].date).toBe("2026-07-30");
  });

  it("drifts by the mean change and spreads by 2 standard deviations times the square root of the days", () => {
    // 89 days gives 88 changes, half of each size, so their mean is exactly
    // -0.1 and their sample standard deviation is sqrt(88 / 87).
    const weights = zigzag(89);
    const latest = weights[88];
    const spread = Math.sqrt(88 / 87);

    const days = project(weights);

    // Day 1 and day 180, so a mistake in the square root shows up.
    for (const [index, day] of [
      [0, 1],
      [179, 180],
    ]) {
      const trend = latest + day * -0.1;
      const reach = 2 * spread * Math.sqrt(day);
      expect(days[index].trendKg).toBeCloseTo(trend, 10);
      expect(days[index].lowKg).toBeCloseTo(trend - reach, 10);
      expect(days[index].highKg).toBeCloseTo(trend + reach, 10);
    }
  });

  it("changes when a recent weight changes", () => {
    const changed = zigzag(40);
    changed[39] += 0.1;

    expect(project(changed)[0].trendKg).not.toBe(
      project(zigzag(40))[0].trendKg,
    );
  });

  it("ignores days before the last 90", () => {
    const changed = zigzag(120);
    changed[0] = 150;

    expect(project(changed)).toEqual(project(zigzag(120)));
  });

  it("follows the line exactly when there is no variation", () => {
    const weights = Array.from({ length: 30 }, (_, index) => 100 - index * 0.5);

    const days = project(weights);

    // The latest weight is 85.5, and it keeps falling by 0.5 kg a day.
    expect(days[9].lowKg).toBeCloseTo(80.5, 8);
    expect(days[9].trendKg).toBeCloseTo(80.5, 8);
    expect(days[9].highKg).toBeCloseTo(80.5, 8);
  });
});
