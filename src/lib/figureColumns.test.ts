import { describe, expect, it } from "vitest";
import { calculateDailyFigures } from "./dailyFigures";
import {
  columnGroups,
  columnHeading,
  figureColumns,
  toneOf,
} from "./figureColumns";
import type { DailyFigures } from "./types";
import { seriesOf } from "./testSeries";
import { toKg } from "./units";

/**
 * Formats each column's value for the last day of consecutive weights.
 *
 * @param weights - One weight a day, in kg, from 2026-01-01.
 * @param targetWeightKg - The target in kg, or `null` for none, which also
 * decides whether the "Left to lose" column is included.
 * @param unit - The display unit.
 * @returns Each column's formatted value for the last day, keyed by the
 * column's label.
 */
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

describe("toneOf", () => {
  it("calls a fall a loss, a rise a gain, and no change neither", () => {
    expect([-0.5, 0.5, 0].map(toneOf)).toEqual(["loss", "gain", null]);
  });
});

describe("the 7-day change's tone", () => {
  const change = figureColumns(true).find(
    (column) => column.key === "average7Change",
  )!;
  const withChange = (average7Change: number) =>
    ({ average7Change }) as DailyFigures;

  it("follows the sign of the change", () => {
    expect(change.tone?.(withChange(-0.0058))).toBe("loss");
    expect(change.tone?.(withChange(0.0021))).toBe("gain");
  });

  it("has none when the change rounds to 0.00%, as it's shown", () => {
    // -0.001% shows as "0.00%", so colouring it blue would contradict it.
    expect(change.format(withChange(-0.00001), "kg")).toBe("0.00%");
    expect(change.tone?.(withChange(-0.00001))).toBeNull();
  });

  it("is the only column with a tone", () => {
    const toned = figureColumns(true).filter((column) => column.tone);
    expect(toned.map((column) => column.key)).toEqual(["average7Change"]);
  });
});

describe("columnGroups", () => {
  it("puts the averages under shared headings and the rest on their own", () => {
    const groups = columnGroups(figureColumns(true)).map((group) => [
      group.label,
      group.columns.map((column) => column.group?.subLabel ?? column.label),
    ]);

    expect(groups).toEqual([
      [null, ["Weight"]],
      [null, ["Lowest weight"]],
      ["7-day average", ["Average", "Lowest", "Change"]],
      ["28-day average", ["Average", "Lowest"]],
      [null, ["Left to lose"]],
      [null, ["Lost since start"]],
      [null, ["Loss per week"]],
    ]);
  });

  it("gives each grouped column a heading that names the same figure", () => {
    // The group and sub-label together should read as the full name, so the
    // short headings can't drift from the names every other screen uses.
    const fullNames: Record<string, string> = {
      "7-day average Average": "7-day average",
      "7-day average Lowest": "Lowest 7-day average",
      "7-day average Change": "7-day change",
      "28-day average Average": "28-day average",
      "28-day average Lowest": "Lowest 28-day average",
    };

    for (const column of figureColumns(true)) {
      if (column.group) {
        const heading = `${column.group.label} ${column.group.subLabel}`;
        expect(fullNames[heading]).toBe(column.label);
      }
    }
  });
});

describe("columnHeading", () => {
  it("adds the display unit to weight columns only", () => {
    const [weight, , , , change] = figureColumns(true);

    expect(columnHeading(weight, "lb")).toBe("Weight (lb)");
    expect(columnHeading(change, "lb")).toBe("7-day change");
  });
});
