import type { CalendarDate, WeightUnit } from "./types";
import { toKg } from "./units";

/** Plain digits only, because `Number()` also accepts `0x10` and `1e3`. */
const WEIGHT_PATTERN = /^\d+(\.\d+)?$/;

/**
 * Checks a weight is one the app can save: a real number above 0.
 *
 * @remarks
 * `Number.isFinite` rejects `NaN` and `Infinity`, and the comparison rejects
 * 0 and negative weights.
 *
 * @param weightKg - The weight in kg.
 * @returns Whether the weight is allowed.
 */
export function isAllowedWeight(weightKg: number): boolean {
  return Number.isFinite(weightKg) && weightKg > 0;
}

/**
 * Reads a weight written as text, such as a typed value or a cell in an
 * imported file.
 *
 * @param text - The weight as written, such as "203.8".
 * @param unit - The unit the text is in.
 * @returns The weight in kg, or `null` if the text isn't a plain decimal
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
 * Checks whether a date is after today, which entries can't be.
 *
 * @remarks
 * `today` is passed in so this stays a pure function. `YYYY-MM-DD` strings sort
 * in date order, so they can be compared directly.
 *
 * @param date - The date to check.
 * @param today - Today's local date.
 * @returns Whether `date` is later than `today`.
 */
export function isFutureDate(date: CalendarDate, today: CalendarDate): boolean {
  return date > today;
}
