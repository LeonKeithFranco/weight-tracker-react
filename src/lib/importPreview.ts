import type { ParsedCsv } from "./csvImport";
import type { WeightEntry } from "./types";

/** What an import would do, shown before anything is saved. */
export type ImportPreview = {
  /** Rows for dates that have no entry yet. */
  newCount: number;
  /** Rows that would replace an entry already saved for their date. */
  overwriteCount: number;
  /** Rows that can't be imported, which would be skipped. */
  invalidCount: number;
};

/**
 * Counts what an import would do, without changing anything. A row counts as an
 * overwrite whenever its date already has an entry, even if the weight matches.
 *
 * @param parsed - The file's importable and invalid rows.
 * @param existing - The entries already saved.
 * @returns How many rows would be added, overwrite an entry and be skipped.
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
