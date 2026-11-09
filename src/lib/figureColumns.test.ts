import { describe, expect, it } from "vitest";
import { calculateDailyFigures } from "./dailyFigures";
import { columnHeading, figureColumns } from "./figureColumns";
import { seriesOf } from "./testSeries";
import { toKg } from "./units";

/** Each column's value for the last day, keyed by label. */
function formattedLastDay(
  weights: number[],
  targetWeightKg: number | null,
  unit: "kg" | "lb",
) {
  const last = calculateDailyFigures(seriesOf(weights), targetWeightKg).at(-1)!;
  return Object.fromEntries(
    figureColumns(targetWeightKg !== null).map((column) => [
      column.label,
      column.format(last, unit),
    ]),
  );
}

describe("figureColumns", () => {
  it("lists every figure in the spec's order when a target is set", () => {
    expect(figureColumns(true).map((column) => column.label)).toEqual([
      "Weight",
      "Lowest weight",
      "7-day average",
      "Lowest 7-day average",
      "7-day change",
      "28-day average",
      "Lowest 28-day average",
      "Left to lose",
      "Lost since start",
      "Loss per week",
    ]);
  });

  it("leaves out the weight to lose when no target is set", () => {
    const labels = figureColumns(false).map((column) => column.label);

    expect(labels).toHaveLength(9);
    expect(labels).not.toContain("Left to lose");
  });

  it("formats weights to 1 decimal, averages to 2 and the change as a percentage", () => {
    expect(formattedLastDay([90, 89, 88.14], 80, "kg")).toEqual({
      Weight: "88.1",
      "Lowest weight": "88.1",
      "7-day average": "89.05",
      "Lowest 7-day average": "89.05",
      "7-day change": "-1.06%",
      "28-day average": "89.05",
      "Lowest 28-day average": "89.05",
      "Left to lose": "8.1",
      "Lost since start": "1.9",
      "Loss per week": "6.51",
    });
  });

  it("shows weights in the display unit", () => {
    const values = formattedLastDay([toKg(203.8, "lb")], null, "lb");

    expect(values.Weight).toBe("203.8");
  });
});

describe("columnHeading", () => {
  it("adds the display unit to weight columns only", () => {
    const [weight, , , , change] = figureColumns(true);

    expect(columnHeading(weight, "lb")).toBe("Weight (lb)");
    expect(columnHeading(change, "lb")).toBe("7-day change");
  });
});
