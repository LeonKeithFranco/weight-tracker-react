import { afterEach, describe, expect, it, vi } from "vitest";
import {
  addDays,
  daysBetween,
  formatChartLabel,
  formatDate,
  localToday,
  parseImportDate,
} from "./dates";

describe("localToday", () => {
  const originalTimeZone = process.env.TZ;

  afterEach(() => {
    vi.useRealTimers();
    process.env.TZ = originalTimeZone;
  });

  it("uses the local date, even when it's already tomorrow in UTC", () => {
    process.env.TZ = "America/Toronto";
    vi.useFakeTimers();
    // 9 pm in Toronto, which is 2 am the next day in UTC.
    vi.setSystemTime(new Date("2026-11-07T02:00:00Z"));

    expect(localToday()).toBe("2026-11-06");
  });
});

describe("parseImportDate", () => {
  it("accepts both import formats", () => {
    expect(parseImportDate("2026-11-05")).toBe("2026-11-05");
    expect(parseImportDate("05-11-2026")).toBe("2026-11-05");
  });

  it("rejects dates that don't exist", () => {
    expect(parseImportDate("2026-02-30")).toBeNull();
    expect(parseImportDate("30-02-2026")).toBeNull();
    expect(parseImportDate("29-02-2025")).toBeNull();
  });

  it("accepts a real leap day", () => {
    expect(parseImportDate("29-02-2024")).toBe("2024-02-29");
  });

  it("rejects other formats and text", () => {
    expect(parseImportDate("5-11-2026")).toBeNull();
    expect(parseImportDate("05/11/2026")).toBeNull();
    expect(parseImportDate("2026-11-05T10:00")).toBeNull();
    expect(parseImportDate("yesterday")).toBeNull();
    expect(parseImportDate("")).toBeNull();
  });
});

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
