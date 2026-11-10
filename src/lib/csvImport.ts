import Papa from "papaparse";
import { DATE_COLUMN, WEIGHT_KG_COLUMN } from "./csvExport";
import { parseImportDate } from "./dates";
import type { CalendarDate, WeightEntry, WeightUnit } from "./types";
import { isFutureDate, parseWeight } from "./validation";

/** The columns one import format reads, and the unit its weights are in. */
type CsvFormat = {
  /** The header of the column holding dates. */
  dateColumn: string;
  /** The header of the column holding weights. */
  weightColumn: string;
  /** The unit the weight column is in. */
  unit: WeightUnit;
};

/**
 * The formats a file can be imported from: the app's own export, then the
 * spreadsheet's. A file is read with the first one whose columns it has.
 */
const CSV_FORMATS: CsvFormat[] = [
  { dateColumn: DATE_COLUMN, weightColumn: WEIGHT_KG_COLUMN, unit: "kg" },
  { dateColumn: "Date", weightColumn: "Weight (lbs)", unit: "lb" },
];

/**
 * Why a row can't be imported: its date isn't a real date, its date is after
 * today, its weight isn't a plain number above 0, or an earlier row has the
 * same date.
 */
export type InvalidReason =
  "invalid-date" | "future-date" | "invalid-weight" | "duplicate-date";

/** A row that can't be imported, with its text as it appeared in the file. */
export type InvalidRow = {
  /** The row's line number in the file, counting the header as line 1. */
  line: number;
  /** The date cell's text, trimmed. */
  date: string;
  /** The weight cell's text, trimmed. */
  weight: string;
  /** Why the row can't be imported. */
  reason: InvalidReason;
};

/** A file's rows, sorted into what can be imported and what can't. */
export type ParsedCsv = {
  /** The rows that can be imported, in file order, with weights in kg. */
  entries: WeightEntry[];
  /** The rows that can't, in file order. */
  invalidRows: InvalidRow[];
};

/**
 * Whether the file could be read at all. Bad rows don't fail the whole file.
 * A file fails when it has neither format's columns, or when an unclosed
 * quote makes its rows unreadable.
 */
export type CsvParseResult =
  | ({ status: "parsed" } & ParsedCsv)
  | { status: "failed"; reason: "unknown-columns" | "malformed" };

/** One row as an entry, or why it can't be one. */
type RowResult =
  { ok: true; entry: WeightEntry } | { ok: false; reason: InvalidReason };

/**
 * Checks one row with the same rules as logging a weight.
 *
 * @param dateText - The date cell's text.
 * @param weightText - The weight cell's text.
 * @param unit - The unit the weight column is in.
 * @param today - Today's local date, which the row's date can't be after.
 * @returns The entry, with its weight in kg, or the first problem found. The
 * date is checked before the weight.
 */
function parseRow(
  dateText: string,
  weightText: string,
  unit: WeightUnit,
  today: CalendarDate,
): RowResult {
  const date = parseImportDate(dateText);

  if (date === null) {
    return { ok: false, reason: "invalid-date" };
  }

  if (isFutureDate(date, today)) {
    return { ok: false, reason: "future-date" };
  }

  const weightKg = parseWeight(weightText, unit);

  if (weightKg === null) {
    return { ok: false, reason: "invalid-weight" };
  }

  return { ok: true, entry: { date, weightKg } };
}

/**
 * Reads either import format.
 *
 * @remarks
 * The text comes from a file the app didn't write, so nothing about it is
 * trusted. Rows with no weight, such as blank lines, are skipped rather than
 * listed as invalid. When a date repeats, the first row is kept and later ones
 * are invalid.
 *
 * @param text - The file's contents.
 * @param today - Today's local date, passed in to keep this pure.
 * @returns The importable and invalid rows, or why the file can't be read.
 */
export function parseCsv(text: string, today: CalendarDate): CsvParseResult {
  const { data, errors, meta } = Papa.parse<Record<string, string | undefined>>(
    text,
    {
      header: true,
      // Set rather than detected, so a file can't change how it gets read.
      delimiter: ",",
      transformHeader: (header) => header.trim(),
    },
  );

  // An unclosed quote swallows every row after it into one field.
  if (errors.some((error) => error.type === "Quotes")) {
    return { status: "failed", reason: "malformed" };
  }

  const columns = meta.fields ?? [];
  const format = CSV_FORMATS.find(
    ({ dateColumn, weightColumn }) =>
      columns.includes(dateColumn) && columns.includes(weightColumn),
  );

  if (format === undefined) {
    return { status: "failed", reason: "unknown-columns" };
  }

  const entries: WeightEntry[] = [];
  const invalidRows: InvalidRow[] = [];
  const seenDates = new Set<CalendarDate>();

  data.forEach((row, index) => {
    const date = row[format.dateColumn]?.trim() ?? "";
    const weight = row[format.weightColumn]?.trim() ?? "";

    // Covers blank lines and the spreadsheet's unfilled future dates.
    if (weight === "") {
      return;
    }

    // Blank lines stay in `data`, so this matches the line in the file. The
    // first data row is on line 2, after the header.
    const line = index + 2;
    const result = parseRow(date, weight, format.unit, today);

    if (!result.ok) {
      invalidRows.push({ line, date, weight, reason: result.reason });
    } else if (seenDates.has(result.entry.date)) {
      invalidRows.push({ line, date, weight, reason: "duplicate-date" });
    } else {
      seenDates.add(result.entry.date);
      entries.push(result.entry);
    }
  });

  return { status: "parsed", entries, invalidRows };
}
