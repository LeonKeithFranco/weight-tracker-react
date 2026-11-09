import { describe, expect, it } from "vitest";
import { calculateDailyFigures } from "./dailyFigures";
import { columnGroups, columnHeading, figureColumns } from "./figureColumns";
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
