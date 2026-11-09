import { FIGURE_LABELS, type FigureKey } from "./figureLabels";
import type { DailyFigures, WeightUnit } from "./types";
import { formatAverage, formatPercent, formatWeight } from "./units";

/** One figure in the data table, shared by the desktop table and phone rows. */
export type FigureColumn = {
  /** The figure it shows. Unique, so it also works as a React key. */
  key: FigureKey;
  /** The figure's name, from the labels every screen shares. */
  label: string;
  /** Whether the label gets the display unit, such as "Weight (lb)". */
  inDisplayUnit: boolean;
  /** The value as shown, in the display unit with the spec's precision. */
  format(figures: DailyFigures, unit: WeightUnit): string;
};

/**
 * Every daily figure, in the order of the table in `docs/SPEC.md`. Labels are
 * added from the key below, so a column can't show another figure's name.
 */
const DEFINITIONS: Omit<FigureColumn, "label">[] = [
  {
    key: "weightKg",
    inDisplayUnit: true,
    format: (figures, unit) => formatWeight(figures.weightKg, unit),
  },
  {
    key: "lowestWeightKg",
    inDisplayUnit: true,
    format: (figures, unit) => formatWeight(figures.lowestWeightKg, unit),
  },
  {
    key: "average7Kg",
    inDisplayUnit: true,
    format: (figures, unit) => formatAverage(figures.average7Kg, unit),
  },
  {
    key: "lowestAverage7Kg",
    inDisplayUnit: true,
    format: (figures, unit) => formatAverage(figures.lowestAverage7Kg, unit),
  },
  {
    key: "average7Change",
    inDisplayUnit: false,
    format: (figures) => formatPercent(figures.average7Change),
  },
  {
    key: "average28Kg",
    inDisplayUnit: true,
    format: (figures, unit) => formatAverage(figures.average28Kg, unit),
  },
  {
    key: "lowestAverage28Kg",
    inDisplayUnit: true,
    format: (figures, unit) => formatAverage(figures.lowestAverage28Kg, unit),
  },
  {
    key: "weightToLoseKg",
    inDisplayUnit: true,
    // Empty when no target is set, as the spec says.
    format: (figures, unit) =>
      figures.weightToLoseKg === null
        ? ""
        : formatWeight(figures.weightToLoseKg, unit),
  },
  {
    key: "weightLossSinceStartKg",
    inDisplayUnit: true,
    format: (figures, unit) =>
      formatWeight(figures.weightLossSinceStartKg, unit),
  },
  {
    key: "weightLossPerWeekKg",
    inDisplayUnit: true,
    format: (figures, unit) => formatAverage(figures.weightLossPerWeekKg, unit),
  },
];

const COLUMNS: FigureColumn[] = DEFINITIONS.map((column) => ({
  ...column,
  label: FIGURE_LABELS[column.key],
}));

/**
 * The columns to show. "Left to lose" is left out when no target is set, because
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
