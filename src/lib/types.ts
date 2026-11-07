/** A local calendar date in `YYYY-MM-DD` form, never a timestamp. */
export type CalendarDate = string;

export type WeightUnit = "kg" | "lb";

export type WeightEntry = {
  date: CalendarDate;
  weightKg: number;
};

/** One day of the continuous series, either logged or estimated. */
export type DailyPoint = WeightEntry & {
  isEstimated: boolean;
};

/** Every calculated figure for one day. All weights are in kg. */
export type DailyFigures = DailyPoint & {
  lowestWeightKg: number;
  average7Kg: number;
  lowestAverage7Kg: number;
  /** A fraction, so -0.01 means a 1% drop. */
  average7Change: number;
  average28Kg: number;
  lowestAverage28Kg: number;
  /** `null` when no target is set. */
  weightToLoseKg: number | null;
  weightLossSinceStartKg: number;
  weightLossPerWeekKg: number;
};

export type Settings = {
  displayUnit: WeightUnit;
  /** `null` when no target is set. */
  targetWeightKg: number | null;
  /** A Day.js format string. */
  dateFormat: string;
};

/** One record in the activity log, which is separate from weight entries. */
export type LogEntry = {
  id: number;
  /** A UTC timestamp, because a log records an exact moment. */
  timestamp: string;
  type: "change" | "error";
  message: string;
  details?: Record<string, unknown>;
};
