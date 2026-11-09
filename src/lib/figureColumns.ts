import type { DailyFigures, WeightUnit } from "./types";
import { formatAverage, formatPercent, formatWeight } from "./units";

/** One figure in the data table, shared by the desktop table and phone rows. */
export type FigureColumn = {
  /** The figure it shows. Unique, so it also works as a React key. */
  key: keyof DailyFigures;
  label: string;
  /** Whether the label gets the display unit, such as "Weight (lb)". */
  inDisplayUnit: boolean;
  /** The value as shown, in the display unit with the spec's precision. */
  format(figures: DailyFigures, unit: WeightUnit): string;
};

/** Every daily figure, in the order of the table in `docs/SPEC.md`. */
const COLUMNS: FigureColumn[] = [
  {
    key: "weightKg",
    label: "Weight",
    inDisplayUnit: true,
    format: (figures, unit) => formatWeight(figures.weightKg, unit),
  },
  {
    key: "lowestWeightKg",
    label: "Lowest weight",
    inDisplayUnit: true,
    format: (figures, unit) => formatWeight(figures.lowestWeightKg, unit),
  },
  {
    key: "average7Kg",
    label: "7-day average",
    inDisplayUnit: true,
    format: (figures, unit) => formatAverage(figures.average7Kg, unit),
  },
  {
    key: "lowestAverage7Kg",
    label: "Lowest 7-day average",
    inDisplayUnit: true,
    format: (figures, unit) => formatAverage(figures.lowestAverage7Kg, unit),
  },
  {
    key: "average7Change",
    label: "7-day change",
    inDisplayUnit: false,
    format: (figures) => formatPercent(figures.average7Change),
  },
  {
    key: "average28Kg",
    label: "28-day average",
    inDisplayUnit: true,
    format: (figures, unit) => formatAverage(figures.average28Kg, unit),
  },
  {
    key: "lowestAverage28Kg",
    label: "Lowest 28-day average",
    inDisplayUnit: true,
    format: (figures, unit) => formatAverage(figures.lowestAverage28Kg, unit),
  },
  {
    key: "weightToLoseKg",
    label: "To lose",
    inDisplayUnit: true,
    // Empty when no target is set, as the spec says.
    format: (figures, unit) =>
      figures.weightToLoseKg === null
        ? ""
        : formatWeight(figures.weightToLoseKg, unit),
  },
  {
    key: "weightLossSinceStartKg",
    label: "Lost since start",
    inDisplayUnit: true,
    format: (figures, unit) =>
      formatWeight(figures.weightLossSinceStartKg, unit),
  },
  {
    key: "weightLossPerWeekKg",
    label: "Loss per week",
    inDisplayUnit: true,
    format: (figures, unit) => formatAverage(figures.weightLossPerWeekKg, unit),
  },
];

/**
 * The columns to show. "To lose" is left out when no target is set, because
 * every value in it would be empty.
 */
export function figureColumns(hasTarget: boolean): FigureColumn[] {
  return hasTarget
    ? COLUMNS
    : COLUMNS.filter((column) => column.key !== "weightToLoseKg");
}

/** The label with the unit when it has one, such as "Weight (lb)". */
export function columnHeading(column: FigureColumn, unit: WeightUnit): string {
  return column.inDisplayUnit ? `${column.label} (${unit})` : column.label;
}
