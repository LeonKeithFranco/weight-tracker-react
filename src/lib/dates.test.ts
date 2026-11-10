import { afterEach, describe, expect, it, vi } from "vitest";
import {
  addDays,
  daysBetween,
  formatChartLabel,
  formatDate,
  formatTimestamp,
  localToday,
  normalizeDateFormat,
  parseImportDate,
  splitDateParts,
} from "./dates";

describe("splitDateParts", () => {
  it("splits an ISO date, keeping leading zeros", () => {
    expect(splitDateParts("2027-03-05")).toEqual([
      { kind: "digits", text: "2027" },
      { kind: "text", text: "-" },
      { kind: "digits", text: "03" },
      { kind: "text", text: "-" },
      { kind: "digits", text: "05" },
    ]);
  });

  it("keeps a month name and its spaces as one run", () => {
    expect(splitDateParts("12 Mar 2027")).toEqual([
      { kind: "digits", text: "12" },
      { kind: "text", text: " Mar " },
      { kind: "digits", text: "2027" },
    ]);
  });

  it("handles a date that starts with text", () => {
    expect(splitDateParts("Mar 12, 2027")).toEqual([
      { kind: "text", text: "Mar " },
      { kind: "digits", text: "12" },
      { kind: "text", text: ", " },
      { kind: "digits", text: "2027" },
    ]);
  });

  it("keeps a status with no digits as one text run", () => {
    expect(splitDateParts("No estimate")).toEqual([
      { kind: "text", text: "No estimate" },
    ]);
  });

  it("returns no parts for empty text", () => {
    expect(splitDateParts("")).toEqual([]);
  });
});

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
    expect(formatDate("2026-11-05", "   ")).toBe("2026-11-05");
  });
});

describe("normalizeDateFormat", () => {
  it("trims the format", () => {
    expect(normalizeDateFormat("  D MMM YYYY ")).toBe("D MMM YYYY");
  });

  it("falls back to YYYY-MM-DD when empty or only spaces", () => {
    expect(normalizeDateFormat("")).toBe("YYYY-MM-DD");
    expect(normalizeDateFormat("   ")).toBe("YYYY-MM-DD");
  });
});

describe("formatTimestamp", () => {
  const originalTimeZone = process.env.TZ;

  afterEach(() => {
    process.env.TZ = originalTimeZone;
  });

  it("shows the moment in local time, with the date in the given format", () => {
    process.env.TZ = "America/Toronto";

    // 2:30 am in UTC is still the evening before in Toronto.
    expect(formatTimestamp("2026-11-08T02:30:05.000Z", "DD/MM/YYYY")).toBe(
      "07/11/2026 21:30:05",
    );
  });

  it("falls back to YYYY-MM-DD for an empty format", () => {
    process.env.TZ = "UTC";

    expect(formatTimestamp("2026-11-08T02:30:05.000Z", "")).toBe(
      "2026-11-08 02:30:05",
    );
  });
});

describe("formatChartLabel", () => {
  it("uses a compact month and day", () => {
    expect(formatChartLabel("2026-11-05")).toBe("Nov 5");
  });
});
