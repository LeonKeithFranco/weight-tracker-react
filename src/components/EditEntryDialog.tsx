import { useId, useState, type FormEvent } from "react";
import { useData } from "../data/dataContext";
import { formatDate, localToday } from "../lib/dates";
import { parseLogForm, type LogFormErrors } from "../lib/logForm";
import type { WeightEntry } from "../lib/types";
import { formatWeight } from "../lib/units";
import styles from "./dialog.module.css";
import { WEIGHT_MESSAGES } from "./formMessages";
import formStyles from "./forms.module.css";
import { useModal } from "./useModal";

/** The props for {@link EditEntryDialog}. */
type EditEntryDialogProps = {
  /** The saved entry to change. */
  entry: WeightEntry;
  /** Called once the dialog has closed, however it was closed. */
  onClose(): void;
};

/**
 * Changes the weight of a saved entry, in a modal dialog that opens as soon
 * as it's drawn. The date stays the same. Saving the weight unchanged keeps
 * the stored value, because the field shows it rounded.
 */
export function EditEntryDialog({ entry, onClose }: EditEntryDialogProps) {
  const { settings, saveEntry } = useData();
  const dialogRef = useModal();
  const id = useId();
  const unit = settings.displayUnit;
  const date = formatDate(entry.date, settings.dateFormat);
  const shownWeight = formatWeight(entry.weightKg, unit);

  const [weight, setWeight] = useState(shownWeight);
  const [error, setError] = useState<LogFormErrors["weight"]>();
  const [saveState, setSaveState] = useState<"idle" | "saving" | "failed">(
    "idle",
  );

  function close() {
    dialogRef.current?.close();
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    // The field shows the weight rounded, so saving that text back would
    // change the stored value slightly. Unchanged text keeps the full value.
    if (weight.trim() === shownWeight) {
      close();
      return;
    }

    const result = parseLogForm(
      { date: entry.date, weight },
      unit,
      localToday(),
    );
    if (!result.ok) {
      setError(result.errors.weight);
      return;
    }

    setError(undefined);
    setSaveState("saving");
    try {
      await saveEntry(result.entry);
      close();
    } catch {
      setSaveState("failed");
    }
  }

  const errorId = `${id}-error`;

  return (
    // `onClose` fires for the buttons below and for the Escape key.
    <dialog
      ref={dialogRef}
      className={styles.dialog}
      onClose={onClose}
      aria-labelledby={`${id}-heading`}
    >
      <h2 id={`${id}-heading`}>Edit {date}</h2>
      <form className={formStyles.form} onSubmit={handleSubmit} noValidate>
        <div className={formStyles.field}>
          <label htmlFor={`${id}-weight`}>Weight ({unit})</label>
          <input
            id={`${id}-weight`}
            type="text"
            inputMode="decimal"
            autoComplete="off"
            value={weight}
            onChange={(event) => {
              setWeight(event.target.value);
              setSaveState("idle");
            }}
            aria-invalid={error !== undefined}
            aria-describedby={error ? errorId : undefined}
          />
          {error && (
            <p id={errorId} className={formStyles.error}>
              {WEIGHT_MESSAGES[error]}
            </p>
          )}
        </div>

        {saveState === "failed" && (
          <p role="alert" className={formStyles.error}>
            Couldn&apos;t save. Try again.
          </p>
        )}

        <div className={styles.buttons}>
          <button type="button" onClick={close}>
            Cancel
          </button>
          <button type="submit" disabled={saveState === "saving"}>
            Save
          </button>
        </div>
      </form>
    </dialog>
  );
}
