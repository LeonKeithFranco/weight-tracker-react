import type { ParsedCsv } from "./csvImport";
import type { WeightEntry } from "./types";

export type ImportPreview = {
  newCount: number;
  overwriteCount: number;
  invalidCount: number;
};

/**
 * Counts what an import would do, without changing anything. A row counts as an
 * overwrite whenever its date already has an entry, even if the weight matches.
 */
export function previewImport(
  { entries, invalidRows }: ParsedCsv,
  existing: WeightEntry[],
): ImportPreview {
  const existingDates = new Set(existing.map((entry) => entry.date));
  const overwriteCount = entries.filter((entry) =>
    existingDates.has(entry.date),
  ).length;

  return {
    newCount: entries.length - overwriteCount,
    overwriteCount,
    invalidCount: invalidRows.length,
  };
}
