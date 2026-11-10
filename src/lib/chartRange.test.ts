import { describe, expect, it } from "vitest";
import { filterByRange } from "./chartRange";
import { addDays, daysBetween } from "./dates";

/**
 * Builds rows with only a date, which is all the filter reads.
 *
 * @param start - The first row's date.
 * @param end - The last row's date.
 * @returns One row per day, from `start` through `end`.
 */
function rowsBetween(start: string, end: string) {
  return Array.from({ length: daysBetween(start, end) + 1 }, (_, index) => ({
    date: addDays(start, index),
  }));
}

/**
 * Almost two years of rows, so every preset except All, including 1Y and
 * YTD, cuts some off.
 */
const ROWS = rowsBetween("2024-06-01", "2026-03-15");

describe("filterByRange", () => {
  it("returns nothing for empty rows", () => {
    expect(filterByRange([], "All")).toEqual([]);
  });

  it.each([
    ["1M", "2026-02-15"],
    ["3M", "2025-12-15"],
    ["6M", "2025-09-15"],
    ["YTD", "2026-01-01"],
    ["1Y", "2025-03-15"],
    ["All", "2024-06-01"],
  ] as const)("starts %s on %s and ends on the latest row", (preset, start) => {
    const shown = filterByRange(ROWS, preset);

    expect(shown[0].date).toBe(start);
    expect(shown.at(-1)?.date).toBe("2026-03-15");
  });

  it("clamps to the end of a shorter month", () => {
    const rows = rowsBetween("2026-01-01", "2026-03-31");

    expect(filterByRange(rows, "1M")[0].date).toBe("2026-02-28");
  });

  it("shows everything when history is shorter than the range", () => {
    const rows = rowsBetween("2026-03-01", "2026-03-15");

    expect(filterByRange(rows, "1Y")).toEqual(rows);
  });

  it("keeps the full row, whatever its type", () => {
    const rows = [{ date: "2026-01-01", weightKg: 80 }];

    expect(filterByRange(rows, "All")[0].weightKg).toBe(80);
  });
});
