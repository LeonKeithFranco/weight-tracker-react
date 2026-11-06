import { describe, expect, it } from "vitest";
import { buildDailySeries } from "./dailySeries";

describe("buildDailySeries", () => {
  it("returns nothing when there are no entries", () => {
    expect(buildDailySeries([])).toEqual([]);
  });

  it("keeps consecutive entries as real days", () => {
    expect(
      buildDailySeries([
        { date: "2026-01-01", weightKg: 80 },
        { date: "2026-01-02", weightKg: 79.5 },
      ]),
    ).toEqual([
      { date: "2026-01-01", weightKg: 80, isEstimated: false },
      { date: "2026-01-02", weightKg: 79.5, isEstimated: false },
    ]);
  });

  it("fills a gap with evenly spaced estimates", () => {
    expect(
      buildDailySeries([
        { date: "2026-01-01", weightKg: 80 },
        { date: "2026-01-04", weightKg: 77 },
      ]),
    ).toEqual([
      { date: "2026-01-01", weightKg: 80, isEstimated: false },
      { date: "2026-01-02", weightKg: 79, isEstimated: true },
      { date: "2026-01-03", weightKg: 78, isEstimated: true },
      { date: "2026-01-04", weightKg: 77, isEstimated: false },
    ]);
  });

  it("interpolates upward as well as downward", () => {
    const series = buildDailySeries([
      { date: "2026-01-01", weightKg: 80 },
      { date: "2026-01-03", weightKg: 81 },
    ]);

    expect(series[1]).toEqual({
      date: "2026-01-02",
      weightKg: 80.5,
      isEstimated: true,
    });
  });

  it("fills gaps that cross a month boundary", () => {
    const dates = buildDailySeries([
      { date: "2026-01-31", weightKg: 80 },
      { date: "2026-02-02", weightKg: 79 },
    ]).map((point) => point.date);

    expect(dates).toEqual(["2026-01-31", "2026-02-01", "2026-02-02"]);
  });

  it("sorts entries without changing the input", () => {
    const entries = [
      { date: "2026-01-02", weightKg: 79 },
      { date: "2026-01-01", weightKg: 80 },
    ];

    const dates = buildDailySeries(entries).map((point) => point.date);

    expect(dates).toEqual(["2026-01-01", "2026-01-02"]);
    expect(entries[0].date).toBe("2026-01-02");
  });

  it("does not estimate past the latest entry", () => {
    const series = buildDailySeries([{ date: "2026-01-01", weightKg: 80 }]);

    expect(series).toHaveLength(1);
  });
});
