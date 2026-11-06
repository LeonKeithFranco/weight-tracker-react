import type { DailyFigures, DailyPoint } from "./types";

const SHORT_WINDOW_DAYS = 7;
const LONG_WINDOW_DAYS = 28;
const DAYS_PER_WEEK = 7;

/** Mean of up to `windowDays` values, ending at `index` and including it. */
function trailingMean(
  values: number[],
  index: number,
  windowDays: number,
): number {
  const window = values.slice(Math.max(0, index - windowDays + 1), index + 1);
  return window.reduce((sum, value) => sum + value, 0) / window.length;
}

/** Calculates every daily figure. See the table in `docs/SPEC.md`. */
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
