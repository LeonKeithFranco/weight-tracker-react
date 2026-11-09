import { useId, useState, type FormEvent } from "react";
import { useData } from "../data/dataContext";
import { formatDate, localToday, normalizeDateFormat } from "../lib/dates";
import { FormStatus } from "./FormStatus";
import styles from "./forms.module.css";

const DAYJS_FORMAT_DOCS = "https://day.js.org/docs/en/display/format";

type SaveState =
  | { status: "idle" }
  | { status: "saving" }
  | { status: "saved" }
  | { status: "failed" };

/** Sets how dates are shown, with a preview that updates as you type. */
export function DateFormatForm() {
  const { settings, saveSettings } = useData();
  const id = useId();

  const [text, setText] = useState(settings.dateFormat);
  const [saveState, setSaveState] = useState<SaveState>({ status: "idle" });

  // Calculated from the text on every render, so it can never be out of date.
  const preview = formatDate(localToday(), text);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const dateFormat = normalizeDateFormat(text);
    setSaveState({ status: "saving" });
    try {
      await saveSettings({ ...settings, dateFormat });
      // Shows what was saved, such as the default after an empty field.
      setText(dateFormat);
      setSaveState({ status: "saved" });
    } catch {
      setSaveState({ status: "failed" });
    }
  }

  const hintId = `${id}-hint`;
  const previewId = `${id}-preview`;

  return (
    <form
      className={styles.form}
      onSubmit={handleSubmit}
      noValidate
      aria-labelledby={`${id}-heading`}
    >
      <h2 id={`${id}-heading`}>Dates</h2>

      <div className={styles.field}>
        <label htmlFor={`${id}-format`}>Date format</label>
        <p id={hintId} className={styles.hint}>
          Uses{" "}
          <a href={DAYJS_FORMAT_DOCS} target="_blank" rel="noreferrer">
            Day.js tokens
          </a>
          , such as D MMM YYYY. Leave empty for YYYY-MM-DD.
        </p>
        <input
          id={`${id}-format`}
          type="text"
          autoComplete="off"
          // Format tokens are case-sensitive, so phones shouldn't change them.
          autoCapitalize="off"
          spellCheck={false}
          value={text}
          onChange={(event) => {
            setText(event.target.value);
            setSaveState({ status: "idle" });
          }}
          aria-describedby={`${hintId} ${previewId}`}
        />
        <p id={previewId}>Today shows as: {preview}</p>
      </div>

      <button type="submit" disabled={saveState.status === "saving"}>
        Save
      </button>

      <FormStatus
        success={saveState.status === "saved" ? "Date format saved." : null}
        failure={
          saveState.status === "failed"
            ? "Couldn't save the date format. Try again."
            : null
        }
      />
    </form>
  );
}
