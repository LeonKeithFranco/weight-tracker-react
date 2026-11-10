import type { CalendarDate, WeightEntry, WeightUnit } from "./types";
import { isFutureDate, parseWeight } from "./validation";

/** The form's fields exactly as typed, before any checks. */
export type LogFormValues = {
  /** A date input gives `YYYY-MM-DD`, or an empty string if it's cleared. */
  date: string;
  /** The weight as typed, in the display unit. */
  weight: string;
};

/** The problem with each field, for the fields that have one. */
export type LogFormErrors = {
  /** The date is empty, or after today. */
  date?: "missing" | "future";
  /** The weight is empty, or isn't a plain number above 0. */
  weight?: "missing" | "invalid";
};

/** The entry the form describes, or every problem with it. */
export type LogFormResult =
  { ok: true; entry: WeightEntry } | { ok: false; errors: LogFormErrors };

/**
 * Checks the logging form and turns it into an entry. Every field is checked,
 * so all the problems can be shown at once.
 *
 * @param values - The fields as typed.
 * @param unit - The display unit the weight is typed in.
 * @param today - Today's local date, passed in to keep this pure.
 * @returns The entry, with its weight in kg, or the problems with each field.
 */
export function parseLogForm(
  values: LogFormValues,
  unit: WeightUnit,
  today: CalendarDate,
): LogFormResult {
  const errors: LogFormErrors = {};

  if (values.date === "") {
    errors.date = "missing";
  } else if (isFutureDate(values.date, today)) {
    errors.date = "future";
  }

  const weightText = values.weight.trim();
  const weightKg = parseWeight(weightText, unit);

  if (weightText === "") {
    errors.weight = "missing";
  } else if (weightKg === null) {
    errors.weight = "invalid";
  }

  if (errors.date !== undefined || weightKg === null) {
    return { ok: false, errors };
  }

  return { ok: true, entry: { date: values.date, weightKg } };
}
