import { FIGURE_LABELS, type FigureKey } from "./figureLabels";
import type { DailyFigures, WeightUnit } from "./types";
import {
  formatAverage,
  formatPercent,
  formatWeight,
  PERCENT_DECIMALS,
} from "./units";

/** One figure in the data table, shared by the desktop table and phone rows. */
export type FigureColumn = {
  /** The figure it shows. Unique, so it also works as a React key. */
  key: FigureKey;
  /** The figure's name, from the labels every screen shares. */
  label: string;
  /** Whether the label gets the display unit, such as "Weight (lb)". */
  inDisplayUnit: boolean;
  /**
   * For columns that share a heading in the desktop table, such as "Lowest"
   * under "7-day average". The two together say the same as `label`.
   */
  group?: { label: string; subLabel: string };
  /**
   * Formats the figure for one day.
   *
   * @param figures - The day's figures.
   * @param unit - The display unit.
   * @returns The value as shown, in the display unit with the spec's
   * precision, or empty text when the day has no value.
   */
  format(figures: DailyFigures, unit: WeightUnit): string;
  /**
   * Says whether the day's value is a loss or a gain, for columns coloured by
   * it. Only columns that are coloured have one.
   *
   * @param figures - The day's figures.
   * @returns The value's tone.
   */
  tone?(figures: DailyFigures): Tone;
};

/**
 * A loss is shown in blue and a gain in red, as in the charts. `null` is
 * neither, and is shown in the text colour.
 */
export type Tone = "loss" | "gain" | null;

/**
 * Says whether a change is a loss or a gain.
 *
 * @param change - The change, in any unit.
 * @returns `"loss"` below 0, `"gain"` above 0, and `null` for exactly 0.
 */
export function toneOf(change: number): Tone {
  if (change < 0) return "loss";
  if (change > 0) return "gain";
  return null;
}

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
    group: { label: FIGURE_LABELS.average7Kg, subLabel: "Average" },
    format: (figures, unit) => formatAverage(figures.average7Kg, unit),
  },
  {
    key: "lowestAverage7Kg",
    inDisplayUnit: true,
    group: { label: FIGURE_LABELS.average7Kg, subLabel: "Lowest" },
    format: (figures, unit) => formatAverage(figures.lowestAverage7Kg, unit),
  },
  {
    key: "average7Change",
    inDisplayUnit: false,
    group: { label: FIGURE_LABELS.average7Kg, subLabel: "Change" },
    format: (figures) => formatPercent(figures.average7Change),
    // From the percentage as shown, so a change that rounds to "0.00%"
    // isn't coloured as a loss or gain.
    tone: (figures) =>
      toneOf(Number((figures.average7Change * 100).toFixed(PERCENT_DECIMALS))),
  },
  {
    key: "average28Kg",
    inDisplayUnit: true,
    group: { label: FIGURE_LABELS.average28Kg, subLabel: "Average" },
    format: (figures, unit) => formatAverage(figures.average28Kg, unit),
  },
  {
    key: "lowestAverage28Kg",
    inDisplayUnit: true,
    group: { label: FIGURE_LABELS.average28Kg, subLabel: "Lowest" },
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

/** Every column, with its label from the shared labels. */
const COLUMNS: FigureColumn[] = DEFINITIONS.map((column) => ({
  ...column,
  label: FIGURE_LABELS[column.key],
}));

/**
 * Lists the columns to show. "Left to lose" is left out when no target is set,
 * because every value in it would be empty.
 *
 * @param hasTarget - Whether a target weight is set.
 * @returns The columns in the spec's order.
 */
export function figureColumns(hasTarget: boolean): FigureColumn[] {
  return hasTarget
    ? COLUMNS
    : COLUMNS.filter((column) => column.key !== "weightToLoseKg");
}

/** A run of columns side by side, under a shared heading or none. */
export type ColumnGroup = {
  /** The shared heading, or `null` for a column that stands alone. */
  label: string | null;
  /** The columns in the group, in table order. */
  columns: FigureColumn[];
};

/**
 * Splits the columns into what the table's top heading row shows: one group
 * for each run of columns sharing a heading, and one per column on its own.
 *
 * @param columns - The columns to show, in table order.
 * @returns The groups in table order. Columns only share a group when they
 * sit side by side.
 */
export function columnGroups(columns: FigureColumn[]): ColumnGroup[] {
  const groups: ColumnGroup[] = [];
  for (const column of columns) {
    const label = column.group?.label ?? null;
    const last = groups.at(-1);
    if (label !== null && last?.label === label) {
      last.columns.push(column);
    } else {
      groups.push({ label, columns: [column] });
    }
  }
  return groups;
}

/**
 * Writes a column's heading for the phone rows, where each label stands alone.
 *
 * @param column - The column to name.
 * @param unit - The display unit.
 * @returns The label with the unit when it has one, such as "Weight (lb)".
 */
export function columnHeading(column: FigureColumn, unit: WeightUnit): string {
  return column.inDisplayUnit ? `${column.label} (${unit})` : column.label;
}
