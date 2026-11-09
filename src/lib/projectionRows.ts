import { projectionWindow } from "./projectionWindow";
import type { SimulatedDay } from "./simulation";
import type { CalendarDate, DailyPoint, WeightUnit } from "./types";
import { fromKg } from "./units";

/**
 * One day of the Projection chart, in the display unit: either a recent day
 * with its weight, or a simulated future day with the median and range. The
 * latest day has both, so the projection starts from the last weight.
 */
export type ProjectionRow = {
  date: CalendarDate;
  isEstimated: boolean;
  /** `null` on future days. */
  weight: number | null;
  /** `null` on recent days, except the latest. */
  median: number | null;
  /**
   * The 10th to 90th percentile band as `[low, high]`, which is how Recharts
   * draws a range area. `null` on recent days, except the latest.
   */
  range: [number, number] | null;
  /** The same on every day, so it draws as a flat line. `null` without one. */
  target: number | null;
};

/**
 * Joins the days the simulation learned from to the days it projects. Uses
 * the same recent window as the simulation, rather than the range presets,
 * because the presets cover only the past.
 */
export function toProjectionRows(
  series: DailyPoint[],
  simulated: SimulatedDay[],
  unit: WeightUnit,
  targetWeightKg: number | null,
): ProjectionRow[] {
  const convert = (weightKg: number) => fromKg(weightKg, unit);
  const target = targetWeightKg === null ? null : convert(targetWeightKg);
  const recent = projectionWindow(series);

  const recentRows = recent.map((day, index): ProjectionRow => {
    const weight = convert(day.weightKg);
    const isLatest = index === recent.length - 1;
    return {
      date: day.date,
      isEstimated: day.isEstimated,
      weight,
      // Every path starts from the latest weight, so the median line and the
      // band start there too, joined to the weight line.
      median: isLatest ? weight : null,
      range: isLatest ? [weight, weight] : null,
      target,
    };
  });

  const futureRows = simulated.map((day): ProjectionRow => ({
    date: day.date,
    isEstimated: false,
    weight: null,
    median: convert(day.medianKg),
    range: [convert(day.lowKg), convert(day.highKg)],
    target,
  }));

  return [...recentRows, ...futureRows];
}
