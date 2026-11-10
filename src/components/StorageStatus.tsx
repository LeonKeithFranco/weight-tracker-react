import { useId, useState } from "react";
import { useData } from "../data/dataContext";
import type { Persistence } from "../storage/persistence";
import { FormStatus } from "./FormStatus";
import styles from "./forms.module.css";

/** What each storage state means for the user's data, in plain words. */
const DESCRIPTIONS: Record<Persistence, string> = {
  persistent:
    "Your browser keeps this data until you clear it or uninstall the app.",
  "best-effort":
    "Your browser may delete this data if the device runs low on space. Installing the app makes it more likely to be kept.",
  unsupported: "This browser can't promise to keep this data.",
};

/**
 * Says whether the browser will keep the app's data, and offers to ask again
 * while storage is best-effort, the one state where asking can change the
 * answer.
 */
export function StorageStatus() {
  const { persistence, requestPersistence } = useData();
  const id = useId();
  // The browser's answer to the last time this button asked, if it has.
  const [answer, setAnswer] = useState<Persistence | null>(null);

  async function handleAsk() {
    setAnswer(await requestPersistence());
  }

  const hintId = `${id}-hint`;

  return (
    <section className={styles.form} aria-labelledby={`${id}-heading`}>
      <h2 id={`${id}-heading`}>Storage</h2>

      <p id={hintId} className={styles.hint}>
        {DESCRIPTIONS[persistence]} Export a CSV now and then as a backup.
      </p>

      {persistence === "best-effort" && (
        <button
          type="button"
          onClick={() => void handleAsk()}
          aria-describedby={hintId}
        >
          Ask to keep data
        </button>
      )}

      <FormStatus
        success={
          answer === "persistent"
            ? "Your browser will now keep this data."
            : null
        }
        failure={
          answer === "best-effort"
            ? "Your browser said no. Try again after installing the app."
            : null
        }
      />
    </section>
  );
}
