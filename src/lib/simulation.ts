import { randomNormal } from "d3-random";
import seedrandom from "seedrandom";
import {
  mean,
  quantileSorted,
  sampleStandardDeviation,
} from "simple-statistics";
import { addDays } from "./dates";
import { MIN_PROJECTION_DAYS, projectionWindow } from "./projectionWindow";
import type { CalendarDate, WeightEntry } from "./types";

const PATH_COUNT = 1000;
const SIMULATED_DAYS = 180;
const LOW_PERCENTILE = 0.1;
const MEDIAN_PERCENTILE = 0.5;
const HIGH_PERCENTILE = 0.9;

/** One future day of the simulation. All weights are in kg. */
export type SimulatedDay = {
  date: CalendarDate;
  lowKg: number;
  medianKg: number;
  highKg: number;
};

/**
 * Seeds from only what the simulation uses, so the chart changes when the
 * recent weights do, and not for anything else such as a new target.
 */
function seedFrom(days: WeightEntry[]): string {
  return days.map((day) => `${day.date}:${day.weightKg}`).join(",");
}

/**
 * Runs a random walk of many possible futures from the latest weight, where
 * each day's change is drawn from the size of recent changes. Returns `null`
 * without enough data. The median is taken separately for each day, so it
 * isn't any single path.
 */
export function simulateProjection(
  series: WeightEntry[],
): SimulatedDay[] | null {
  if (series.length < MIN_PROJECTION_DAYS) {
    return null;
  }

  const recentDays = projectionWindow(series);
  const weights = recentDays.map((day) => day.weightKg);
  const changes = weights
    .slice(1)
    .map((weight, index) => weight - weights[index]);

  // `source` swaps d3's default `Math.random` for the seeded generator.
  const drawChange = randomNormal.source(seedrandom(seedFrom(recentDays)))(
    mean(changes),
    sampleStandardDeviation(changes),
  );

  const latest = recentDays[recentDays.length - 1];
  // Each path only needs its current weight, so one array holds them all.
  const paths = new Array<number>(PATH_COUNT).fill(latest.weightKg);
  const days: SimulatedDay[] = [];

  for (let day = 1; day <= SIMULATED_DAYS; day++) {
    for (let path = 0; path < PATH_COUNT; path++) {
      paths[path] += drawChange();
    }

    // Without a compare function, JavaScript sorts numbers as text.
    const sorted = paths.toSorted((a, b) => a - b);

    days.push({
      date: addDays(latest.date, day),
      lowKg: quantileSorted(sorted, LOW_PERCENTILE),
      medianKg: quantileSorted(sorted, MEDIAN_PERCENTILE),
      highKg: quantileSorted(sorted, HIGH_PERCENTILE),
    });
  }

  return days;
}
