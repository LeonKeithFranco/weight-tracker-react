import { useId, useState, type FormEvent } from "react";
import { useData } from "../data/dataContext";
import { formatDate, localToday } from "../lib/dates";
import {
  parseLogForm,
  type LogFormErrors,
  type LogFormValues,
} from "../lib/logForm";
import type { WeightEntry } from "../lib/types";
import { formatWeight } from "../lib/units";
import { WEIGHT_MESSAGES } from "./formMessages";
import styles from "./forms.module.css";

const DATE_MESSAGES: Record<NonNullable<LogFormErrors["date"]>, string> = {
  missing: "Enter a date.",
  future: "The date can't be in the future.",
};

type SaveState =
  | { status: "idle" }
  | { status: "saving" }
  | { status: "saved"; entry: WeightEntry }
  | { status: "failed" };

/** Logs a weight for today or an earlier date. */
export function LogForm() {
  const { settings, saveEntry } = useData();
  const today = localToday();
  const id = useId();

  const [values, setValues] = useState<LogFormValues>({
    date: today,
    weight: "",
  });
  const [errors, setErrors] = useState<LogFormErrors>({});
  const [saveState, setSaveState] = useState<SaveState>({ status: "idle" });

  function updateField(field: keyof LogFormValues, value: string) {
    setValues((current) => ({ ...current, [field]: value }));
    setSaveState({ status: "idle" });
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    // Stops the browser from reloading the page, which is what a form does
    // by default.
    event.preventDefault();

    const result = parseLogForm(values, settings.displayUnit, localToday());
    if (!result.ok) {
      setErrors(result.errors);
      return;
    }

    setErrors({});
    setSaveState({ status: "saving" });
    try {
      await saveEntry(result.entry);
      setValues((current) => ({ ...current, weight: "" }));
      setSaveState({ status: "saved", entry: result.entry });
    } catch {
      setSaveState({ status: "failed" });
    }
  }

  const dateErrorId = `${id}-date-error`;
  const weightErrorId = `${id}-weight-error`;

  return (
    // `noValidate` turns off the browser's own error bubbles, so the form's
    // messages are the only ones and look the same everywhere.
    <form
      className={styles.form}
      onSubmit={handleSubmit}
      noValidate
      aria-labelledby={`${id}-heading`}
    >
      <h2 id={`${id}-heading`}>Log your weight</h2>

      <div className={styles.field}>
        <label htmlFor={`${id}-date`}>Date</label>
        <input
          id={`${id}-date`}
          type="date"
          value={values.date}
          max={today}
          onChange={(event) => updateField("date", event.target.value)}
          aria-invalid={errors.date !== undefined}
          aria-describedby={errors.date ? dateErrorId : undefined}
        />
        {errors.date && (
          <p id={dateErrorId} className={styles.error}>
            {DATE_MESSAGES[errors.date]}
          </p>
        )}
      </div>

      <div className={styles.field}>
        <label htmlFor={`${id}-weight`}>Weight ({settings.displayUnit})</label>
        <input
          id={`${id}-weight`}
          type="text"
          inputMode="decimal"
          autoComplete="off"
          value={values.weight}
          onChange={(event) => updateField("weight", event.target.value)}
          aria-invalid={errors.weight !== undefined}
          aria-describedby={errors.weight ? weightErrorId : undefined}
        />
        {errors.weight && (
          <p id={weightErrorId} className={styles.error}>
            {WEIGHT_MESSAGES[errors.weight]}
          </p>
        )}
      </div>

      <button type="submit" disabled={saveState.status === "saving"}>
        Save
      </button>

      <p role="status" className={styles.status}>
        {saveState.status === "saved" &&
          `Saved ${formatWeight(saveState.entry.weightKg, settings.displayUnit)} ${settings.displayUnit} for ${formatDate(saveState.entry.date, settings.dateFormat)}.`}
        {saveState.status === "failed" &&
          "Couldn't save. Your entry is still in the form, so try again."}
      </p>
    </form>
  );
}
