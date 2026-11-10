import { mean } from "simple-statistics";
import type { DailyFigures, DailyPoint } from "./types";

/** Days in the short average, and how far back its change compares. */
const SHORT_WINDOW_DAYS = 7;
/** Days in the long average. */
const LONG_WINDOW_DAYS = 28;
/** Used to turn days into weeks for the loss per week. */
const DAYS_PER_WEEK = 7;

/**
 * Averages the values in a window that ends at one index.
 *
 * @param values - Every value in the series, oldest first.
 * @param index - The position of the last value to include.
 * @param windowDays - How many values the window holds.
 * @returns The mean of up to `windowDays` values, ending at `index` and
 * including it. Near the start, it averages however many values exist.
 */
function trailingMean(
  values: number[],
  index: number,
  windowDays: number,
): number {
  return mean(values.slice(Math.max(0, index - windowDays + 1), index + 1));
}

/**
 * Calculates every daily figure. See the table in `docs/SPEC.md`.
 *
 * @param series - The continuous daily series, oldest first, from
 * `buildDailySeries`.
 * @param targetWeightKg - The target weight in kg, or `null` when no target is
 * set.
 * @returns The figures for each day of `series`, in the same order.
 */
export function calculateDailyFigures(
  series: DailyPoint[],
  targetWeightKg: number | null,
): DailyFigures[] {
  const weights = series.map((point) => point.weightKg);
  const figures: DailyFigures[] = [];

  series.forEach((point, index) => {
    const previous = figures[index - 1];
    const average7Kg = trailingMean(weights, index, SHORT_WINDOW_DAYS);
    const average28Kg = trailingMean(weights, index, LONG_WINDOW_DAYS);

    // Compares to day 1 until a day exactly 7 days earlier exists.
    const comparisonIndex = Math.max(0, index - SHORT_WINDOW_DAYS);
    const comparisonAverage7Kg =
      figures[comparisonIndex]?.average7Kg ?? average7Kg;

    const weightLossSinceStartKg = weights[0] - point.weightKg;

    figures.push({
      ...point,
      lowestWeightKg: Math.min(
        previous?.lowestWeightKg ?? point.weightKg,
        point.weightKg,
      ),
      average7Kg,
      lowestAverage7Kg: Math.min(
        previous?.lowestAverage7Kg ?? average7Kg,
        average7Kg,
      ),
      average7Change: average7Kg / comparisonAverage7Kg - 1,
      average28Kg,
      lowestAverage28Kg: Math.min(
        previous?.lowestAverage28Kg ?? average28Kg,
        average28Kg,
      ),
      weightToLoseKg:
        targetWeightKg === null ? null : point.weightKg - targetWeightKg,
      weightLossSinceStartKg,
      weightLossPerWeekKg:
        index === 0 ? 0 : weightLossSinceStartKg / (index / DAYS_PER_WEEK),
    });
  });

  return figures;
}
