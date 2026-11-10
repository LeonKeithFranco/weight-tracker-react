import type { WeightUnit } from "./types";
import { formatWeight } from "./units";
import { parseWeight } from "./validation";

/**
 * The target to save, in kg or `null` for no target, or a failure when the
 * field isn't a valid weight.
 */
export type TargetWeightResult =
  { ok: true; targetWeightKg: number | null } | { ok: false };

/**
 * Writes the target as the settings field shows it.
 *
 * @param targetWeightKg - The saved target in kg, or `null` when none is set.
 * @param unit - The display unit.
 * @returns The target in `unit` to 1 decimal place, or empty text when no
 * target is set.
 */
export function formatTargetWeight(
  targetWeightKg: number | null,
  unit: WeightUnit,
): string {
  return targetWeightKg === null ? "" : formatWeight(targetWeightKg, unit);
}

/**
 * Reads the target weight field, in the display unit. Empty means no target.
 *
 * @remarks
 * The field shows the saved target rounded, so if its text is unchanged, the
 * saved value is kept. Converting the rounded text back would shift the target
 * a little each time it's saved.
 *
 * @param text - The field's text as typed.
 * @param unit - The display unit the text is in.
 * @param savedKg - The target saved now, or `null` when none is set.
 * @returns The target to save, or a failure when the text isn't a plain number
 * above 0.
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
