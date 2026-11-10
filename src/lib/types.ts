/** A local calendar date in `YYYY-MM-DD` form, never a timestamp. */
export type CalendarDate = string;

/** A unit weights can be shown and typed in. Weights are always saved in kg. */
export type WeightUnit = "kg" | "lb";

/** One logged weight, as saved. There is at most one per date. */
export type WeightEntry = {
  /** The day the weight was logged for. */
  date: CalendarDate;
  /** The weight in kg, at full precision. */
  weightKg: number;
};

/** One day of the continuous series, either logged or estimated. */
export type DailyPoint = WeightEntry & {
  /**
   * Whether the weight was estimated between two logged days, rather than
   * logged. Estimated days are never saved.
   */
  isEstimated: boolean;
};

/**
 * Every calculated figure for one day. All weights are in kg.
 *
 * @remarks
 * The table in `docs/SPEC.md` defines each figure.
 */
export type DailyFigures = DailyPoint & {
  /** The lowest weight from the first day through this one. */
  lowestWeightKg: number;
  /**
   * The mean weight over the last 7 days, including this one, or over every
   * day so far until 7 exist.
   */
  average7Kg: number;
  /** The lowest 7-day average from the first day through this one. */
  lowestAverage7Kg: number;
  /**
   * The change in the 7-day average from 7 days earlier, or from the first day
   * until 7 days earlier exists. A fraction, so -0.01 means a 1% drop.
   */
  average7Change: number;
  /**
   * The mean weight over the last 28 days, including this one, or over every
   * day so far until 28 exist.
   */
  average28Kg: number;
  /** The lowest 28-day average from the first day through this one. */
  lowestAverage28Kg: number;
  /**
   * This day's weight minus the target, which is negative once below it, or
   * `null` when no target is set.
   */
  weightToLoseKg: number | null;
  /** The first day's weight minus this day's, so a loss is positive. */
  weightLossSinceStartKg: number;
  /**
   * The loss since the start, spread over the weeks since then. 0 on the first
   * day.
   */
  weightLossPerWeekKg: number;
};

/** The user's preferences, saved apart from the weight entries. */
export type Settings = {
  /** The unit weights are shown and typed in. */
  displayUnit: WeightUnit;
  /** The target weight in kg, or `null` when no target is set. */
  targetWeightKg: number | null;
  /** A Day.js format string for showing dates, such as `DD/MM/YYYY`. */
  dateFormat: string;
};

/** One record in the activity log, which is separate from weight entries. */
export type LogEntry = {
  /** A number the storage backend assigns, which grows with each new record. */
  id: number;
  /** A UTC timestamp, because a log records an exact moment. */
  timestamp: string;
  /** Whether the record is a change to the data or an error. */
  type: "change" | "error";
  /** What happened, such as "Added an entry for 2026-11-10". */
  message: string;
  /**
   * The facts behind the message, such as an edit's old and new weights, or
   * an error's text. The Log page shows them as JSON.
   */
  details?: Record<string, unknown>;
};
