import { mean, sampleStandardDeviation } from "simple-statistics";
import { addDays } from "./dates";
import { MIN_PROJECTION_DAYS, projectionWindow } from "./projectionWindow";
import type { CalendarDate, WeightEntry } from "./types";

const PROJECTED_DAYS = 180;

/**
 * How many standard deviations the range reaches either side of the trend.
 * Two covers about 95% of a normal distribution.
 */
const RANGE_STANDARD_DEVIATIONS = 2;

/** One future day of the projection. All weights are in kg. */
export type ProjectedDay = {
  date: CalendarDate;
  lowKg: number;
  trendKg: number;
  highKg: number;
};

/**
 * Projects where the weight is likely to be on each of the next 180 days,
 * from the size of recent day-to-day changes. Returns `null` without enough
 * data.
 *
 * It treats each day's change as a random draw from a normal distribution
 * with the recent changes' mean and standard deviation, the same model as
 * the spreadsheet's random walk. Adding up normal draws gives another normal
 * distribution, so after `n` days the weight is centred on the latest weight
 * plus `n` times the mean change, with a standard deviation of the daily one
 * times the square root of `n`. Calculating that directly gives the answer a
 * simulation of many random paths only approximates, in microseconds rather
 * than a few hundred milliseconds on a phone.
 */
export function projectRange(series: WeightEntry[]): ProjectedDay[] | null {
  if (series.length < MIN_PROJECTION_DAYS) {
    return null;
  }

  const recentDays = projectionWindow(series);
  const weights = recentDays.map((day) => day.weightKg);
  const changes = weights
    .slice(1)
    .map((weight, index) => weight - weights[index]);
  const meanChange = mean(changes);
  const changeSpread = sampleStandardDeviation(changes);

  const latest = recentDays[recentDays.length - 1];

  return Array.from({ length: PROJECTED_DAYS }, (_, index) => {
    const day = index + 1;
    const trendKg = latest.weightKg + day * meanChange;
    // Spread grows with the square root of time, not in a straight line,
    // because ups and downs on different days partly cancel out.
    const reach = RANGE_STANDARD_DEVIATIONS * changeSpread * Math.sqrt(day);

    return {
      date: addDays(latest.date, day),
      lowKg: trendKg - reach,
      trendKg,
      highKg: trendKg + reach,
    };
  });
}
