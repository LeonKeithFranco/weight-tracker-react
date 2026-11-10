import type { CalendarDate, DailyFigures, WeightUnit } from "./types";
import { fromKg } from "./units";

/**
 * One day as the charts plot it: weights in the display unit and the weekly
 * change as a percentage. Values aren't rounded, so lines stay smooth, and
 * tooltips round them when they're shown.
 */
export type ChartRow = {
  /** The day the row plots. */
  date: CalendarDate;
  /** Whether the day's weight was estimated, which the tooltip says. */
  isEstimated: boolean;
  /** The day's weight, logged or estimated, for the tooltip. */
  weight: number;
  /**
   * The weight on logged days, or `null` on estimated ones.
   *
   * @remarks
   * The weight is split in two so estimates can be drawn differently. Recharts
   * joins two neighbouring days only when both have a value, so `realWeight`
   * draws the stretches between logged days, and `estimatedWeight` draws
   * every stretch that touches an estimated day.
   */
  realWeight: number | null;
  /**
   * The weight on estimated days and the logged days beside them, or `null`
   * elsewhere. See `realWeight` for why the weight is split.
   */
  estimatedWeight: number | null;
  /** The lowest weight so far. */
  lowestWeight: number;
  /** The 7-day average. */
  average7: number;
  /** The lowest 7-day average so far. */
  lowestAverage7: number;
  /** The 7-day change as a percentage, so -1 means a 1% drop. */
  average7ChangePercent: number;
  /** The 28-day average. */
  average28: number;
  /** The lowest 28-day average so far. */
  lowestAverage28: number;
  /**
   * The weight left to lose, or `null` when no target is set, which Recharts
   * leaves out of the chart.
   */
  weightToLose: number | null;
  /**
   * The weight left to lose, held at 0 once past the target, or `null` when no
   * target is set.
   *
   * @remarks
   * Weight to lose is split at 0 for the stacked Progress chart, because a band
   * that changes sign jumps from the top of the stack to below 0. Neither
   * part changes sign: `leftToLose` is 0 once past the target, and
   * `pastTarget` is empty until then, except beside days past the target, so
   * its band starts and ends at 0.
   */
  leftToLose: number | null;
  /**
   * How far below the target the weight is, as a negative number, on days past
   * the target and the days beside them. `null` elsewhere, and when no target
   * is set. See `leftToLose` for why weight to lose is split.
   */
  pastTarget: number | null;
  /** The weight lost since the first day. */
  weightLossSinceStart: number;
  /** The loss per week since the first day. */
  weightLossPerWeek: number;
};

/**
 * Converts every day's figures into the shape and unit the charts plot.
 *
 * @param figures - Every day's figures, oldest first.
 * @param unit - The display unit to convert weights to.
 * @returns One row per day, in the same order.
 */
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
