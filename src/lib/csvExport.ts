import Papa from "papaparse";
import type { WeightEntry } from "./types";

/**
 * The date column's header in the app's own CSV format, shared with the
 * import parser.
 */
export const DATE_COLUMN = "date";
/**
 * The weight column's header in the app's own CSV format, shared with the
 * import parser.
 */
export const WEIGHT_KG_COLUMN = "weight_kg";

/**
 * Formats real entries as CSV.
 *
 * @remarks
 * Weights keep full precision, because JavaScript writes a number with enough
 * digits to read it back exactly.
 *
 * @param entries - The saved entries, in any order. Estimated days don't
 * belong here, because they're never saved.
 * @returns A header row, then one row per entry, oldest first, with weights
 * in kg and `\n` line endings.
 */
export function formatCsv(entries: WeightEntry[]): string {
  const sorted = entries.toSorted((a, b) => a.date.localeCompare(b.date));

  return Papa.unparse(
    {
      fields: [DATE_COLUMN, WEIGHT_KG_COLUMN],
      data: sorted.map((entry) => [entry.date, entry.weightKg]),
    },
    { newline: "\n" },
  );
}
