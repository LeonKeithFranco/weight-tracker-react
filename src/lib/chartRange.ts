import { parseDate, toCalendarDate } from "./dates";
import type { CalendarDate } from "./types";

/** The ranges of history the charts can show, in the order they're offered. */
export const RANGE_PRESETS = ["1M", "3M", "6M", "YTD", "1Y", "All"] as const;

/**
 * One of the chart range presets. Derived from the array, so the list and the
 * type can't drift apart.
 */
export type RangePreset = (typeof RANGE_PRESETS)[number];

/** The range the charts show when the Charts screen opens. */
export const DEFAULT_RANGE_PRESET: RangePreset = "YTD";

/**
 * Finds the first day a preset shows.
 *
 * @param latest - The latest day in the data.
 * @param preset - The preset chosen.
 * @returns The earliest date to show. A month back from the 31st lands on the
 * last day of a shorter month, and "All" returns a date before any data.
 */
function rangeStart(latest: CalendarDate, preset: RangePreset): CalendarDate {
  const end = parseDate(latest);

  switch (preset) {
    case "1M":
      return toCalendarDate(end.subtract(1, "month"));
    case "3M":
      return toCalendarDate(end.subtract(3, "month"));
    case "6M":
      return toCalendarDate(end.subtract(6, "month"));
    case "YTD":
      return toCalendarDate(end.startOf("year"));
    case "1Y":
      return toCalendarDate(end.subtract(1, "year"));
    case "All":
      return "0000-01-01";
  }
}

/**
 * Keeps the rows a preset shows. Ranges count back from the latest row rather
 * than today, so a break from logging doesn't leave the charts empty. Rows
 * must be in date order, and their figures are already calculated from the
 * full history, so filtering changes only what's displayed.
 *
 * @param rows - The rows to filter, in date order.
 * @param preset - The preset chosen.
 * @returns The rows from the preset's start through the latest row, or none
 * when `rows` is empty.
 */
export function filterByRange<T extends { date: CalendarDate }>(
  rows: T[],
  preset: RangePreset,
): T[] {
  const latest = rows.at(-1);

  if (!latest) {
    return [];
  }

  const start = rangeStart(latest.date, preset);
  return rows.filter((row) => row.date >= start);
}
