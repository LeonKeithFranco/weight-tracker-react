import { describe, expect, it } from "vitest";
import { formatCsv } from "./csvExport";
import { parseCsv, type ParsedCsv } from "./csvImport";
import { toKg } from "./units";

/** The date the tests treat as today, which rows can't be after. */
const TODAY = "2026-11-06";

/**
 * Parses a file that should be readable, so tests can check its rows.
 *
 * @param text - The file's contents.
 * @returns The file's importable and invalid rows.
 * @throws {@link Error}
 * When the whole file is rejected.
 */
function parseRows(text: string): ParsedCsv {
  const result = parseCsv(text, TODAY);

  if (result.status === "failed") {
    throw new Error(`Expected the file to parse, got ${result.reason}`);
  }

  return result;
}

describe("parseCsv formats", () => {
  it("reads the app's own export in kg", () => {
    const { entries } = parseRows("date,weight_kg\n2026-01-01,90.5\n");

    expect(entries).toEqual([{ date: "2026-01-01", weightKg: 90.5 }]);
  });

  it("converts the spreadsheet format from lb without rounding", () => {
    const { entries } = parseRows("Date,Weight (lbs)\n01-02-2026,203.8\n");

    expect(entries).toEqual([
      { date: "2026-02-01", weightKg: toKg(203.8, "lb") },
    ]);
  });

  it("gets back exactly what was exported", () => {
    const original = [
      { date: "2026-01-01", weightKg: toKg(203.8, "lb") },
      { date: "2026-01-02", weightKg: 0.1 + 0.2 },
    ];

    expect(parseRows(formatCsv(original)).entries).toEqual(original);
  });

  it("accepts either date format in either file format", () => {
    const { entries } = parseRows(
      "date,weight_kg\n05-01-2026,90\n2026-01-06,89\n",
    );

    expect(entries.map((entry) => entry.date)).toEqual([
      "2026-01-05",
      "2026-01-06",
    ]);
  });

  it("ignores extra columns, wherever they are", () => {
    const { entries } = parseRows(
      "Note,Date,Lowest Weight,Weight (lbs),Target\nx,01-01-2026,1,200,155\n",
    );

    expect(entries).toEqual([
      { date: "2026-01-01", weightKg: toKg(200, "lb") },
    ]);
  });

  it("reads a file with a byte order mark, Windows line endings and padded cells", () => {
    const { entries, invalidRows } = parseRows(
      "﻿ date , weight_kg \r\n 2026-01-01 , 90 \r\n",
    );

    expect(entries).toEqual([{ date: "2026-01-01", weightKg: 90 }]);
    expect(invalidRows).toEqual([]);
  });
});

describe("parseCsv skipped rows", () => {
  it("skips rows with no weight without reporting them", () => {
    const { entries, invalidRows } = parseRows(
      "Date,Weight (lbs),7 Day Average\n01-01-2026,200,200\n02-01-2026,,200\n31-12-2030,,\n",
    );

    expect(entries).toHaveLength(1);
    expect(invalidRows).toEqual([]);
  });

  it("skips blank lines", () => {
    const { entries, invalidRows } = parseRows(
      "date,weight_kg\n\n2026-01-01,90\n\n\n",
    );

    expect(entries).toHaveLength(1);
    expect(invalidRows).toEqual([]);
  });

  it("treats a missing weight field as no weight", () => {
    const { entries, invalidRows } = parseRows("date,weight_kg\n2026-01-01\n");

    expect(entries).toEqual([]);
    expect(invalidRows).toEqual([]);
  });
});

describe("parseCsv invalid rows", () => {
  it("reports each kind of bad date", () => {
    const { entries, invalidRows } = parseRows(
      "date,weight_kg\n2026-02-30,90\n,90\n2026-11-07,90\n",
    );

    expect(entries).toEqual([]);
    expect(invalidRows.map((row) => row.reason)).toEqual([
      "invalid-date",
      "invalid-date",
      "future-date",
    ]);
  });

  it("allows today's date", () => {
    expect(parseRows(`date,weight_kg\n${TODAY},90\n`).entries).toHaveLength(1);
  });

  it.each(["heavy", "0", "-90", "0x5A", "1e2", "Infinity", "9".repeat(400)])(
    "rejects a weight of %s",
    (weight) => {
      const { entries, invalidRows } = parseRows(
        `date,weight_kg\n2026-01-01,${weight}\n`,
      );

      expect(entries).toEqual([]);
      expect(invalidRows[0].reason).toBe("invalid-weight");
    },
  );

  it("rejects a quoted decimal comma", () => {
    const { invalidRows } = parseRows('date,weight_kg\n2026-01-01,"90,5"\n');

    expect(invalidRows[0].reason).toBe("invalid-weight");
  });

  it("keeps the first row for a date and reports later ones", () => {
    const { entries, invalidRows } = parseRows(
      "date,weight_kg\n2026-01-01,90\n01-01-2026,91\n",
    );

    expect(entries).toEqual([{ date: "2026-01-01", weightKg: 90 }]);
    expect(invalidRows).toEqual([
      { line: 3, date: "01-01-2026", weight: "91", reason: "duplicate-date" },
    ]);
  });

  it("keeps good rows and reports the file's line and text for bad ones", () => {
    const { entries, invalidRows } = parseRows(
      "date,weight_kg\n2026-01-01,90\n\nnot-a-date,oops\n2026-01-03,89\n",
    );

    expect(entries).toHaveLength(2);
    expect(invalidRows).toEqual([
      { line: 4, date: "not-a-date", weight: "oops", reason: "invalid-date" },
    ]);
  });
});

describe("parseCsv unreadable files", () => {
  it.each([
    ["an empty file", ""],
    ["other columns", "day,kilos\n2026-01-01,90\n"],
    ["only one of the columns", "date\n2026-01-01\n"],
    ["columns from different formats", "date,Weight (lbs)\n2026-01-01,200\n"],
    ["semicolons", "date;weight_kg\n2026-01-01;90\n"],
  ])("rejects %s", (_name, text) => {
    expect(parseCsv(text, TODAY)).toEqual({
      status: "failed",
      reason: "unknown-columns",
    });
  });

  it("rejects an unclosed quote rather than losing the rows after it", () => {
    const text = 'date,weight_kg\n"2026-01-01,90\n2026-01-02,89\n';

    expect(parseCsv(text, TODAY)).toEqual({
      status: "failed",
      reason: "malformed",
    });
  });

  it("accepts a file with a header and no rows", () => {
    expect(parseRows("date,weight_kg\n")).toEqual({
      status: "parsed",
      entries: [],
      invalidRows: [],
    });
  });
});
