import Papa from "papaparse";
import type { WeightEntry } from "./types";

/** The header of the app's own CSV format, shared with the import parser. */
export const DATE_COLUMN = "date";
export const WEIGHT_KG_COLUMN = "weight_kg";

/**
 * Formats real entries as CSV, oldest first. Weights keep full precision,
 * because JavaScript writes a number with enough digits to read it back exactly.
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
