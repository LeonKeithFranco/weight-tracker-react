import dayjs, { type Dayjs } from "dayjs";
import customParseFormat from "dayjs/plugin/customParseFormat";
import utc from "dayjs/plugin/utc";
import type { CalendarDate } from "./types";

dayjs.extend(utc);
dayjs.extend(customParseFormat);

export const DEFAULT_DATE_FORMAT = "YYYY-MM-DD";
const CHART_LABEL_FORMAT = "MMM D";
const IMPORT_DATE_FORMATS = [DEFAULT_DATE_FORMAT, "DD-MM-YYYY"];

/**
 * Parses in UTC because UTC has no daylight saving. A local day can be 23 or
 * 25 hours long, which would throw off date arithmetic.
 */
export function parseDate(date: CalendarDate): Dayjs {
  return dayjs.utc(date);
}

export function toCalendarDate(date: Dayjs): CalendarDate {
  return date.format(DEFAULT_DATE_FORMAT);
}

/**
 * Today's date where the user is. This one is local, not UTC, because in the
 * evening west of UTC it's already tomorrow in UTC.
 */
export function localToday(): CalendarDate {
  return dayjs().format(DEFAULT_DATE_FORMAT);
}

/**
 * Reads a date from an imported file, or returns `null` if it isn't one. Strict
 * parsing rejects dates that don't exist, such as `2026-02-30`, which Day.js
 * would otherwise roll forward into March.
 */
export function parseImportDate(text: string): CalendarDate | null {
  for (const format of IMPORT_DATE_FORMATS) {
    const date = dayjs.utc(text, format, true);

    if (date.isValid()) {
      return toCalendarDate(date);
    }
  }

  return null;
}

export function addDays(date: CalendarDate, days: number): CalendarDate {
  return toCalendarDate(parseDate(date).add(days, "day"));
}

export function daysBetween(start: CalendarDate, end: CalendarDate): number {
  return parseDate(end).diff(parseDate(start), "day");
}

/**
 * Trims a date format setting. An empty one, or one that's only spaces, falls
 * back to the default.
 */
export function normalizeDateFormat(format: string): string {
  return format.trim() || DEFAULT_DATE_FORMAT;
}

/** Formats with a Day.js format string. An empty format uses the default. */
export function formatDate(date: CalendarDate, format: string): string {
  return parseDate(date).format(normalizeDateFormat(format));
}

/** A run of digits or of other characters in a formatted date. */
export type DatePart = { kind: "digits" | "text"; text: string };

/**
 * Splits a formatted date into runs of digits and runs of everything else, so
 * the digits can roll and the rest, such as a month name, can change on its
 * own. "12 Mar 2027" becomes `12`, ` Mar ` and `2027`. Text with no digits,
 * such as "No estimate", is one text run.
 */
export function splitDateParts(text: string): DatePart[] {
  return (text.match(/\d+|\D+/g) ?? []).map((run) => ({
    kind: /^\d/.test(run) ? "digits" : "text",
    text: run,
  }));
}

/**
 * Shows a UTC timestamp, such as a log entry's, in local time: the date in the
 * date format setting, then the time on a 24-hour clock.
 */
export function formatTimestamp(timestamp: string, dateFormat: string): string {
  // Plain `dayjs`, not `dayjs.utc`, so the moment is shown in local time.
  return dayjs(timestamp).format(`${normalizeDateFormat(dateFormat)} HH:mm:ss`);
}

/** Compact axis label such as "Nov 5", whatever the date format setting is. */
export function formatChartLabel(date: CalendarDate): string {
  return parseDate(date).format(CHART_LABEL_FORMAT);
}
