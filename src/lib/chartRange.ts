import { parseDate, toCalendarDate } from "./dates";
import type { CalendarDate } from "./types";

export const RANGE_PRESETS = ["1M", "3M", "6M", "YTD", "1Y", "All"] as const;

/** Derived from the array, so the list and the type can't drift apart. */
export type RangePreset = (typeof RANGE_PRESETS)[number];

export const DEFAULT_RANGE_PRESET: RangePreset = "YTD";

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
