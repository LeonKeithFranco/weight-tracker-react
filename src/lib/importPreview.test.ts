import { describe, expect, it } from "vitest";
import type { InvalidRow } from "./csvImport";
import { previewImport } from "./importPreview";

/** A row with a bad date, which an import would skip. */
const invalidRow: InvalidRow = {
  line: 4,
  date: "not-a-date",
  weight: "90",
  reason: "invalid-date",
};

describe("previewImport", () => {
  it("counts new, overwritten and invalid rows", () => {
    const preview = previewImport(
      {
        entries: [
          { date: "2026-01-01", weightKg: 90 },
          { date: "2026-01-02", weightKg: 89 },
          { date: "2026-01-03", weightKg: 88 },
        ],
        invalidRows: [invalidRow],
      },
      [
        { date: "2026-01-01", weightKg: 95 },
        { date: "2025-12-31", weightKg: 96 },
      ],
    );

    expect(preview).toEqual({
      newCount: 2,
      overwriteCount: 1,
      invalidCount: 1,
    });
  });

  it("counts a matching date as an overwrite even if the weight is the same", () => {
    const entry = { date: "2026-01-01", weightKg: 90 };

    expect(
      previewImport({ entries: [entry], invalidRows: [] }, [entry]),
    ).toEqual({ newCount: 0, overwriteCount: 1, invalidCount: 0 });
  });

  it("counts everything as new when nothing exists yet", () => {
    const preview = previewImport(
      { entries: [{ date: "2026-01-01", weightKg: 90 }], invalidRows: [] },
      [],
    );

    expect(preview).toEqual({
      newCount: 1,
      overwriteCount: 0,
      invalidCount: 0,
    });
  });
});
