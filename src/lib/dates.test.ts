import { describe, expect, it } from "vitest";
import { addDays, daysBetween, formatChartLabel, formatDate } from "./dates";

describe("addDays", () => {
  it("crosses month and year boundaries", () => {
    expect(addDays("2025-12-31", 1)).toBe("2026-01-01");
  });

  it("handles leap days", () => {
    expect(addDays("2024-02-28", 1)).toBe("2024-02-29");
    expect(addDays("2025-02-28", 1)).toBe("2025-03-01");
  });

  it("is not affected by daylight saving changes", () => {
    expect(addDays("2026-03-07", 2)).toBe("2026-03-09");
    expect(addDays("2026-10-31", 2)).toBe("2026-11-02");
  });
});

describe("daysBetween", () => {
  it("counts calendar days", () => {
    expect(daysBetween("2026-01-01", "2026-01-01")).toBe(0);
    expect(daysBetween("2026-01-01", "2026-01-08")).toBe(7);
    expect(daysBetween("2025-12-31", "2026-01-01")).toBe(1);
  });

  it("is not affected by daylight saving changes", () => {
    expect(daysBetween("2026-03-01", "2026-03-31")).toBe(30);
    expect(daysBetween("2026-10-20", "2026-11-10")).toBe(21);
  });
});

describe("formatDate", () => {
  it("uses the given Day.js format", () => {
    expect(formatDate("2026-11-05", "DD/MM/YYYY")).toBe("05/11/2026");
  });

  it("falls back to YYYY-MM-DD for an empty format", () => {
    expect(formatDate("2026-11-05", "")).toBe("2026-11-05");
  });
});

describe("formatChartLabel", () => {
  it("uses a compact month and day", () => {
    expect(formatChartLabel("2026-11-05")).toBe("Nov 5");
  });
});
