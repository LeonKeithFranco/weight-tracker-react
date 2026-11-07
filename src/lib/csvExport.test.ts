import { describe, expect, it } from "vitest";
import { formatCsv } from "./csvExport";

describe("formatCsv", () => {
  it("writes a header and one row per entry", () => {
    const csv = formatCsv([
      { date: "2026-01-01", weightKg: 90 },
      { date: "2026-01-02", weightKg: 89.5 },
    ]);

    expect(csv).toBe("date,weight_kg\n2026-01-01,90\n2026-01-02,89.5");
  });

  it("keeps full precision", () => {
    const weightKg = 203.8 * 0.45359237;

    expect(formatCsv([{ date: "2026-01-01", weightKg }])).toContain(
      `2026-01-01,${weightKg}`,
    );
  });

  it("sorts entries by date", () => {
    const csv = formatCsv([
      { date: "2026-01-02", weightKg: 89 },
      { date: "2026-01-01", weightKg: 90 },
    ]);

    expect(csv).toBe("date,weight_kg\n2026-01-01,90\n2026-01-02,89");
  });

  it("writes only the header when there are no entries", () => {
    expect(formatCsv([]).trim()).toBe("date,weight_kg");
  });
});
