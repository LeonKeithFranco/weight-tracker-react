import { useId, useState, type FormEvent } from "react";
import { useData } from "../data/dataContext";
import { formatTargetWeight, parseTargetWeight } from "../lib/targetWeight";
import { FormStatus } from "./FormStatus";
import styles from "./forms.module.css";

/**
 * Where saving has got to: not started, under way, saved, with whether the
 * target was removed, or failed.
 */
type SaveState =
  | { status: "idle" }
  | { status: "saving" }
  | { status: "saved"; removed: boolean }
  | { status: "failed" };

/**
 * Sets or removes the target weight, in the display unit. Its field starts
 * from the saved target, so give it `key={displayUnit}` to start again in the
 * new unit when the unit changes.
 */
export function TargetWeightForm() {
  const { settings, saveSettings } = useData();
  const unit = settings.displayUnit;
  const id = useId();

  const [text, setText] = useState(
    formatTargetWeight(settings.targetWeightKg, unit),
  );
  const [invalid, setInvalid] = useState(false);
  const [saveState, setSaveState] = useState<SaveState>({ status: "idle" });

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const result = parseTargetWeight(text, unit, settings.targetWeightKg);
    if (!result.ok) {
      setInvalid(true);
      return;
    }

    setInvalid(false);
    setSaveState({ status: "saving" });
    try {
      await saveSettings({
        ...settings,
        targetWeightKg: result.targetWeightKg,
      });
      // Shows the target the way it's displayed everywhere else, such as
      // "180" becoming "180.0".
      setText(formatTargetWeight(result.targetWeightKg, unit));
      setSaveState({
        status: "saved",
        removed: result.targetWeightKg === null,
      });
    } catch {
      setSaveState({ status: "failed" });
    }
  }

  const hintId = `${id}-hint`;
  const errorId = `${id}-error`;

  return (
    <form
      className={styles.form}
      onSubmit={handleSubmit}
      noValidate
      // Names the form after its heading, so it can be told apart from others.
      aria-labelledby={`${id}-heading`}
    >
      <h2 id={`${id}-heading`}>Target</h2>

      <div className={styles.field}>
        <label htmlFor={`${id}-target`}>Target weight ({unit})</label>
        <p id={hintId} className={styles.hint}>
          Leave empty for no target.
        </p>
        <input
          id={`${id}-target`}
          type="text"
          inputMode="decimal"
          autoComplete="off"
          value={text}
          onChange={(event) => {
            setText(event.target.value);
            setSaveState({ status: "idle" });
          }}
          aria-invalid={invalid}
          // Lists every description, separated by spaces.
          aria-describedby={invalid ? `${hintId} ${errorId}` : hintId}
        />
        {invalid && (
          <p id={errorId} className={styles.error}>
            Enter a number above 0, or leave it empty.
          </p>
        )}
      </div>

      <button type="submit" disabled={saveState.status === "saving"}>
        Save
      </button>

      <FormStatus
        success={
          saveState.status === "saved"
            ? saveState.removed
              ? "Target removed."
              : "Target saved."
            : null
        }
        failure={
          saveState.status === "failed"
            ? "Couldn't save the target. Try again."
            : null
        }
      />
    </form>
  );
}
