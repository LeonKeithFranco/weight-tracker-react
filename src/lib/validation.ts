import type { CalendarDate, WeightUnit } from "./types";
import { toKg } from "./units";

/** Plain digits only, because `Number()` also accepts `0x10` and `1e3`. */
const WEIGHT_PATTERN = /^\d+(\.\d+)?$/;

/** `NaN` fails the comparison, and `Infinity` fails the finite check. */
export function isAllowedWeight(weightKg: number): boolean {
  return Number.isFinite(weightKg) && weightKg > 0;
}

/**
 * Reads a weight written as text, such as a typed value or a cell in an
 * imported file. Returns it in kg, or `null` if it isn't a plain decimal
 * number above 0.
 */
export function parseWeight(text: string, unit: WeightUnit): number | null {
  if (!WEIGHT_PATTERN.test(text)) {
    return null;
  }

  const weightKg = toKg(Number(text), unit);
  return isAllowedWeight(weightKg) ? weightKg : null;
}

/**
 * `today` is passed in so this stays a pure function. `YYYY-MM-DD` strings sort
 * in date order, so they can be compared directly.
 */
export function isFutureDate(date: CalendarDate, today: CalendarDate): boolean {
  return date > today;
}
