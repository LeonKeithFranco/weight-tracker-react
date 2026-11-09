import type { DailyFigures } from "./types";

/** The daily figures that have a value to show, rather than describing the day. */
export type FigureKey = Exclude<keyof DailyFigures, "date" | "isEstimated">;

/**
 * What each figure is called everywhere in the app: Home, the Data table and
 * the charts all read their names from here, so they can't drift apart. A
 * `Record` over every figure means a new figure won't build without a name.
 */
export const FIGURE_LABELS: Record<FigureKey, string> = {
  weightKg: "Weight",
  lowestWeightKg: "Lowest weight",
  average7Kg: "7-day average",
  lowestAverage7Kg: "Lowest 7-day average",
  average7Change: "7-day change",
  average28Kg: "28-day average",
  lowestAverage28Kg: "Lowest 28-day average",
  weightToLoseKg: "Left to lose",
  weightLossSinceStartKg: "Lost since start",
  weightLossPerWeekKg: "Loss per week",
};
