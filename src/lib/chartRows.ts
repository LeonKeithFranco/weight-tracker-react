import type { CalendarDate, DailyFigures, WeightUnit } from "./types";
import { fromKg } from "./units";

/**
 * One day as the charts plot it: weights in the display unit and the weekly
 * change as a percentage. Values aren't rounded, so lines stay smooth, and
 * tooltips round them when they're shown.
 */
export type ChartRow = {
  date: CalendarDate;
  isEstimated: boolean;
  weight: number;
  /**
   * The weight split in two so estimates can be drawn differently. Recharts
   * joins two neighbouring days only when both have a value, so `realWeight`
   * draws the stretches between logged days, and `estimatedWeight` draws
   * every stretch that touches an estimated day.
   */
  realWeight: number | null;
  estimatedWeight: number | null;
  lowestWeight: number;
  average7: number;
  lowestAverage7: number;
  /** A percentage, so -1 means a 1% drop. */
  average7ChangePercent: number;
  average28: number;
  lowestAverage28: number;
  /** `null` when no target is set, which Recharts leaves out of the chart. */
  weightToLose: number | null;
  /**
   * Weight to lose split at 0 for the stacked Progress chart, because a band
   * that changes sign jumps from the top of the stack to below 0. Neither
   * part changes sign: `leftToLose` is 0 once past the target, and
   * `pastTarget` is empty until then, except beside days past the target, so
   * its band starts and ends at 0. Both are `null` without a target.
   */
  leftToLose: number | null;
  pastTarget: number | null;
  weightLossSinceStart: number;
  weightLossPerWeek: number;
};

/** Converts every day's figures into the shape and unit the charts plot. */
export function toChartRows(
  figures: DailyFigures[],
  unit: WeightUnit,
): ChartRow[] {
  const convert = (weightKg: number) => fromKg(weightKg, unit);
  // Loose `!=` is true for both `null` (no target) and `undefined` (no day,
  // past either end of the list), the one common use of loose equality.
  const isPastTarget = (day: DailyFigures | undefined) =>
    day?.weightToLoseKg != null && day.weightToLoseKg < 0;

  return figures.map((day, index) => {
    const weight = convert(day.weightKg);
    const toLose =
      day.weightToLoseKg === null ? null : convert(day.weightToLoseKg);
    const nearPastTarget =
      isPastTarget(day) ||
      isPastTarget(figures[index - 1]) ||
      isPastTarget(figures[index + 1]);
    // A logged day next to an estimate also gets an estimated value, so the
    // faded line reaches it rather than stopping a day short.
    const touchesEstimate =
      day.isEstimated ||
      figures[index - 1]?.isEstimated === true ||
      figures[index + 1]?.isEstimated === true;

    return {
      date: day.date,
      isEstimated: day.isEstimated,
      weight,
      realWeight: day.isEstimated ? null : weight,
      estimatedWeight: touchesEstimate ? weight : null,
      lowestWeight: convert(day.lowestWeightKg),
      average7: convert(day.average7Kg),
      lowestAverage7: convert(day.lowestAverage7Kg),
      average7ChangePercent: day.average7Change * 100,
      average28: convert(day.average28Kg),
      lowestAverage28: convert(day.lowestAverage28Kg),
      weightToLose: toLose,
      leftToLose: toLose === null ? null : Math.max(toLose, 0),
      pastTarget:
        toLose === null || !nearPastTarget ? null : Math.min(toLose, 0),
      weightLossSinceStart: convert(day.weightLossSinceStartKg),
      weightLossPerWeek: convert(day.weightLossPerWeekKg),
    };
  });
}
