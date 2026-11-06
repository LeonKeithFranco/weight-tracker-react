import { linearRegression } from "simple-statistics";
import { addDays } from "./dates";
import { MIN_PROJECTION_DAYS, projectionWindow } from "./projectionWindow";
import type { CalendarDate, DailyFigures } from "./types";

/**
 * Any slower than this counts as flat, at a hundredth of a gram a day. Without
 * it, a slope that's only slightly negative from rounding would project a date
 * too far away for a JavaScript date to hold.
 */
const FLAT_SLOPE_KG_PER_DAY = 0.00001;

/** One member for each row of the display table in `docs/SPEC.md`. */
export type GoalEstimate =
  | { status: "no-target" }
  | { status: "not-enough-data" }
  | { status: "target-reached" }
  | { status: "no-estimate" }
  | { status: "estimated"; date: CalendarDate };

/**
 * Projects when the target will be reached, by following the slope of the
 * recent trend down from the latest 7-day average.
 */
export function estimateGoalDate(
  figures: DailyFigures[],
  targetWeightKg: number | null,
): GoalEstimate {
  if (targetWeightKg === null) {
    return { status: "no-target" };
  }

  if (figures.length < MIN_PROJECTION_DAYS) {
    return { status: "not-enough-data" };
  }

  const latest = figures[figures.length - 1];

  if (latest.average7Kg <= targetWeightKg) {
    return { status: "target-reached" };
  }

  // Each point is [day number, weight], so the slope `m` is kg per day.
  const points = projectionWindow(figures).map((day, index) => [
    index,
    day.weightKg,
  ]);
  const slopeKgPerDay = linearRegression(points).m;

  if (slopeKgPerDay > -FLAT_SLOPE_KG_PER_DAY) {
    return { status: "no-estimate" };
  }

  const kgToLose = latest.average7Kg - targetWeightKg;
  // Rounds up to the first whole day the line is at or below the target.
  const daysToTarget = Math.ceil(kgToLose / -slopeKgPerDay);

  return { status: "estimated", date: addDays(latest.date, daysToTarget) };
}
