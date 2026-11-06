import { addDays, daysBetween } from "./dates";
import type { DailyPoint, WeightEntry } from "./types";

/**
 * Builds a continuous series from the first entry to the latest, filling gaps
 * by linear interpolation. Estimates exist only in this result and are never
 * saved.
 */
export function buildDailySeries(entries: WeightEntry[]): DailyPoint[] {
  // `YYYY-MM-DD` strings sort chronologically when compared as text.
  const sorted = entries.toSorted((a, b) => a.date.localeCompare(b.date));
  const series: DailyPoint[] = [];

  sorted.forEach((entry, index) => {
    const previous = sorted[index - 1];

    if (previous) {
      const gapDays = daysBetween(previous.date, entry.date);
      const dailyChange = (entry.weightKg - previous.weightKg) / gapDays;

      for (let day = 1; day < gapDays; day++) {
        series.push({
          date: addDays(previous.date, day),
          weightKg: previous.weightKg + dailyChange * day,
          isEstimated: true,
        });
      }
    }

    series.push({ ...entry, isEstimated: false });
  });

  return series;
}
