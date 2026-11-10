import { addDays } from "./dates";
import type { DailyPoint } from "./types";

/**
 * Builds consecutive days of synthetic weights, starting on 2026-01-01, none
 * of them estimated.
 *
 * @param weights - One weight a day, in kg.
 * @returns One point per weight.
 */
export function seriesOf(weights: number[]): DailyPoint[] {
  return weights.map((weightKg, index) => ({
    date: addDays("2026-01-01", index),
    weightKg,
    isEstimated: false,
  }));
}
