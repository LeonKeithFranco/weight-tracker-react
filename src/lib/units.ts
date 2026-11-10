import type { WeightUnit } from "./types";

/** The exact number of kg in a pound, by international definition. */
export const KG_PER_LB = 0.45359237;

/** Decimal places shown for a weight. */
export const WEIGHT_DECIMALS = 1;
/** Decimal places shown for an average or a rate, such as loss per week. */
export const AVERAGE_DECIMALS = 2;
/** Decimal places shown for a percentage. */
export const PERCENT_DECIMALS = 2;

/**
 * Converts a weight to kg, the unit weights are saved in.
 *
 * @param value - The weight in `unit`.
 * @param unit - The unit `value` is in.
 * @returns The weight in kg, not rounded.
 */
export function toKg(value: number, unit: WeightUnit): number {
  return unit === "kg" ? value : value * KG_PER_LB;
}

/**
 * Converts a saved weight to the unit it's shown in.
 *
 * @param weightKg - The weight in kg.
 * @param unit - The unit to convert to.
 * @returns The weight in `unit`, not rounded.
 */
export function fromKg(weightKg: number, unit: WeightUnit): number {
  return unit === "kg" ? weightKg : weightKg / KG_PER_LB;
}

/**
 * Rounds for display, and avoids showing a small negative as "-0.0". Charts
 * and Home's Latest figures call it directly, because their values are
 * already in the display unit.
 *
 * @param value - The number to show.
 * @param decimals - How many decimal places to show.
 * @returns The rounded number as text, such as "203.8".
 */
export function formatNumber(value: number, decimals: number): string {
  const text = value.toFixed(decimals);
  return Number(text) === 0 ? (0).toFixed(decimals) : text;
}

/**
 * Rounds the way {@link formatNumber} does, for components that take a number
 * and format it themselves, such as the rolling figures.
 *
 * @remarks
 * Give them this, not the raw value: `Intl.NumberFormat` rounds the stored
 * value's shortest form, 199.45, up to 199.5, but `toFixed` rounds its exact
 * value, 199.4499…, down to 199.4.
 *
 * @param value - The number to show.
 * @param decimals - How many decimal places to keep.
 * @returns The rounded number, with 0 in place of a negative that rounds to 0.
 */
export function roundForDisplay(value: number, decimals: number): number {
  return Number(formatNumber(value, decimals));
}

/**
 * `Intl.NumberFormat` options that write a {@link roundForDisplay} value as
 * {@link formatNumber} does.
 *
 * @remarks
 * Use them with the `en-US` locale, which writes numbers the way `toFixed`
 * does. `signDisplay: "negative"` leaves the sign off a value that rounds to
 * 0.
 *
 * @param decimals - How many decimal places to show, always all of them.
 * @returns The options to pass to `Intl.NumberFormat` or NumberFlow.
 */
export function numberFormatOptions(decimals: number): {
  minimumFractionDigits: number;
  maximumFractionDigits: number;
  useGrouping: false;
  signDisplay: "negative";
} {
  return {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
    useGrouping: false,
    signDisplay: "negative",
  };
}

/**
 * Formats a weight to the precision weights are shown at.
 *
 * @param weightKg - The weight in kg.
 * @param unit - The unit to show it in.
 * @returns The weight in `unit` to 1 decimal place, with no unit name.
 */
export function formatWeight(weightKg: number, unit: WeightUnit): string {
  return formatNumber(fromKg(weightKg, unit), WEIGHT_DECIMALS);
}

/**
 * Formats averages and rates, which show more precision than weights.
 *
 * @param weightKg - The average or rate in kg.
 * @param unit - The unit to show it in.
 * @returns The value in `unit` to 2 decimal places, with no unit name.
 */
export function formatAverage(weightKg: number, unit: WeightUnit): string {
  return formatNumber(fromKg(weightKg, unit), AVERAGE_DECIMALS);
}

/**
 * Formats a fraction as a percentage.
 *
 * @param fraction - The fraction, such as a 7-day change.
 * @returns The percentage to 2 decimal places, so 0.0123 becomes "1.23%".
 */
export function formatPercent(fraction: number): string {
  return `${formatNumber(fraction * 100, PERCENT_DECIMALS)}%`;
}
