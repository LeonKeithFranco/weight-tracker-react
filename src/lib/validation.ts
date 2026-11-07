import type { CalendarDate } from "./types";

/** `NaN` fails the comparison, and `Infinity` fails the finite check. */
export function isAllowedWeight(weightKg: number): boolean {
  return Number.isFinite(weightKg) && weightKg > 0;
}

/**
 * `today` is passed in so this stays a pure function. `YYYY-MM-DD` strings sort
 * in date order, so they can be compared directly.
 */
export function isFutureDate(date: CalendarDate, today: CalendarDate): boolean {
  return date > today;
}
