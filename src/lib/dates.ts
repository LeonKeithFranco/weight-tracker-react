import dayjs, { type Dayjs } from "dayjs";
import customParseFormat from "dayjs/plugin/customParseFormat";
import utc from "dayjs/plugin/utc";
import type { CalendarDate } from "./types";

dayjs.extend(utc);
dayjs.extend(customParseFormat);

/** The date format setting's default, which is also how dates are saved. */
export const DEFAULT_DATE_FORMAT = "YYYY-MM-DD";

/** The charts' axis label format, short enough to fit under each tick. */
const CHART_LABEL_FORMAT = "MMM D";

/** The date formats an imported file may use, tried in this order. */
const IMPORT_DATE_FORMATS = [DEFAULT_DATE_FORMAT, "DD-MM-YYYY"];

/**
 * Turns a calendar date into a Day.js date for arithmetic.
 *
 * @remarks
 * Parses in UTC because UTC has no daylight saving. A local day can be 23 or
 * 25 hours long, which would throw off date arithmetic.
 *
 * @param date - The calendar date to parse.
 * @returns The start of that day in UTC.
 */
export function parseDate(date: CalendarDate): Dayjs {
  return dayjs.utc(date);
}

/**
 * Turns a Day.js date back into a calendar date.
 *
 * @param date - The date to convert, usually from {@link parseDate}.
 * @returns The date in `YYYY-MM-DD` form.
 */
export function toCalendarDate(date: Dayjs): CalendarDate {
  return date.format(DEFAULT_DATE_FORMAT);
}

/**
 * Today's date where the user is. This one is local, not UTC, because in the
 * evening west of UTC it's already tomorrow in UTC.
 *
 * @returns Today's local date.
 */
export function localToday(): CalendarDate {
  return dayjs().format(DEFAULT_DATE_FORMAT);
}

/**
 * Reads a date from an imported file.
 *
 * @remarks
 * Strict parsing rejects dates that don't exist, such as `2026-02-30`, which
 * Day.js would otherwise roll forward into March.
 *
 * @param text - The cell's text, in `YYYY-MM-DD` or `DD-MM-YYYY` form.
 * @returns The date, or `null` if the text isn't a real date in either form.
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

/**
 * Moves a date by a number of days.
 *
 * @param date - The date to start from.
 * @param days - How many days to move, back in time when negative.
 * @returns The date `days` days after `date`.
 */
export function addDays(date: CalendarDate, days: number): CalendarDate {
  return toCalendarDate(parseDate(date).add(days, "day"));
}

/**
 * Counts the days from one date to another.
 *
 * @param start - The date to count from.
 * @param end - The date to count to.
 * @returns The number of days from `start` to `end`, which is negative when
 * `end` comes first and 0 for the same day.
 */
export function daysBetween(start: CalendarDate, end: CalendarDate): number {
  return parseDate(end).diff(parseDate(start), "day");
}

/**
 * Trims a date format setting. An empty one, or one that's only spaces, falls
 * back to the default.
 *
 * @param format - The date format setting as typed.
 * @returns The format to use.
 */
export function normalizeDateFormat(format: string): string {
  return format.trim() || DEFAULT_DATE_FORMAT;
}

/**
 * Formats a date for display.
 *
 * @param date - The date to show.
 * @param format - A Day.js format string, such as the date format setting. An
 * empty format uses the default.
 * @returns The formatted date, such as "10/11/2026".
 */
export function formatDate(date: CalendarDate, format: string): string {
  return parseDate(date).format(normalizeDateFormat(format));
}

/** A run of digits or of other characters in a formatted date. */
export type DatePart = {
  /** Whether the run is all digits or all other characters. */
  kind: "digits" | "text";
  /** The run's characters, spaces included. */
  text: string;
};

/**
 * Splits a formatted date into runs of digits and runs of everything else, so
 * the digits can roll and the rest, such as a month name, can change on its
 * own.
 *
 * @param text - A formatted date, or any other text shown in its place.
 * @returns The runs in order. "12 Mar 2027" becomes `12`, ` Mar ` and `2027`.
 * Text with no digits, such as "No estimate", is one text run, and empty text
 * gives no runs.
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
 *
 * @param timestamp - An ISO 8601 timestamp in UTC.
 * @param dateFormat - The date format setting.
 * @returns The local date and time, such as "2026-11-10 18:04:59".
 */
export function formatTimestamp(timestamp: string, dateFormat: string): string {
  // Plain `dayjs`, not `dayjs.utc`, so the moment is shown in local time.
  return dayjs(timestamp).format(`${normalizeDateFormat(dateFormat)} HH:mm:ss`);
}

/**
 * Formats a date as a chart axis label, whatever the date format setting is.
 *
 * @param date - The date at the tick.
 * @returns A compact label such as "Nov 5".
 */
export function formatChartLabel(date: CalendarDate): string {
  return parseDate(date).format(CHART_LABEL_FORMAT);
}
