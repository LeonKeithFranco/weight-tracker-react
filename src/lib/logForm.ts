import type { CalendarDate, WeightEntry, WeightUnit } from "./types";
import { isFutureDate, parseWeight } from "./validation";

/** The form's fields exactly as typed, before any checks. */
export type LogFormValues = {
  /** A date input gives `YYYY-MM-DD`, or an empty string if it's cleared. */
  date: string;
  /** In the display unit. */
  weight: string;
};

export type LogFormErrors = {
  date?: "missing" | "future";
  weight?: "missing" | "invalid";
};

export type LogFormResult =
  { ok: true; entry: WeightEntry } | { ok: false; errors: LogFormErrors };

/**
 * Checks the logging form and turns it into an entry. Every field is checked,
 * so all the problems can be shown at once. `today` is passed in to keep this
 * pure.
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
