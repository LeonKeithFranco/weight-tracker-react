import type { WeightUnit } from "./types";
import { formatWeight } from "./units";
import { parseWeight } from "./validation";

export type TargetWeightResult =
  { ok: true; targetWeightKg: number | null } | { ok: false };

/** The target as the settings field shows it, or empty if there's no target. */
export function formatTargetWeight(
  targetWeightKg: number | null,
  unit: WeightUnit,
): string {
  return targetWeightKg === null ? "" : formatWeight(targetWeightKg, unit);
}

/**
 * Reads the target weight field, in the display unit. Empty means no target.
 *
 * The field shows the saved target rounded, so if its text is unchanged, the
 * saved value is kept. Converting the rounded text back would shift the target
 * a little each time it's saved.
 */
export function parseTargetWeight(
  text: string,
  unit: WeightUnit,
  savedKg: number | null,
): TargetWeightResult {
  const trimmed = text.trim();

  if (trimmed === "") {
    return { ok: true, targetWeightKg: null };
  }

  if (trimmed === formatTargetWeight(savedKg, unit)) {
    return { ok: true, targetWeightKg: savedKg };
  }

  const targetWeightKg = parseWeight(trimmed, unit);
  return targetWeightKg === null ? { ok: false } : { ok: true, targetWeightKg };
}
