import Papa from "papaparse";
import { DATE_COLUMN, WEIGHT_KG_COLUMN } from "./csvExport";
import { parseImportDate } from "./dates";
import type { CalendarDate, WeightEntry, WeightUnit } from "./types";
import { isFutureDate, parseWeight } from "./validation";

type CsvFormat = {
  dateColumn: string;
  weightColumn: string;
  unit: WeightUnit;
};

const CSV_FORMATS: CsvFormat[] = [
  { dateColumn: DATE_COLUMN, weightColumn: WEIGHT_KG_COLUMN, unit: "kg" },
  { dateColumn: "Date", weightColumn: "Weight (lbs)", unit: "lb" },
];

export type InvalidReason =
  "invalid-date" | "future-date" | "invalid-weight" | "duplicate-date";

/** A row that can't be imported, with its text as it appeared in the file. */
export type InvalidRow = {
  line: number;
  date: string;
  weight: string;
  reason: InvalidReason;
};

export type ParsedCsv = {
  entries: WeightEntry[];
  invalidRows: InvalidRow[];
};

/** Whether the file could be read at all. Bad rows don't fail the whole file. */
export type CsvParseResult =
  | ({ status: "parsed" } & ParsedCsv)
  | { status: "failed"; reason: "unknown-columns" | "malformed" };

type RowResult =
  { ok: true; entry: WeightEntry } | { ok: false; reason: InvalidReason };

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
 * Reads either import format. The text comes from a file the app didn't write,
 * so nothing about it is trusted. `today` is passed in to keep this pure.
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
