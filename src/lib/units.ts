import type { WeightUnit } from "./types";

export const KG_PER_LB = 0.45359237;

export const WEIGHT_DECIMALS = 1;
export const AVERAGE_DECIMALS = 2;
const PERCENT_DECIMALS = 2;

export function toKg(value: number, unit: WeightUnit): number {
  return unit === "kg" ? value : value * KG_PER_LB;
}

export function fromKg(weightKg: number, unit: WeightUnit): number {
  return unit === "kg" ? weightKg : weightKg / KG_PER_LB;
}

/**
 * Rounds for display, and avoids showing a small negative as "-0.0". Charts
 * call it directly, because their values are already in the display unit.
 */
export function formatNumber(value: number, decimals: number): string {
  const text = value.toFixed(decimals);
  return Number(text) === 0 ? (0).toFixed(decimals) : text;
}

export function formatWeight(weightKg: number, unit: WeightUnit): string {
  return formatNumber(fromKg(weightKg, unit), WEIGHT_DECIMALS);
}

/** Formats averages and rates, which show more precision than weights. */
export function formatAverage(weightKg: number, unit: WeightUnit): string {
  return formatNumber(fromKg(weightKg, unit), AVERAGE_DECIMALS);
}

/** Formats a fraction as a percentage, so 0.0123 becomes "1.23%". */
export function formatPercent(fraction: number): string {
  return `${formatNumber(fraction * 100, PERCENT_DECIMALS)}%`;
}
